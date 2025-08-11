from __future__ import annotations

import os
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional, Tuple

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, emit
import yaml


# -----------------------------
# Models (minimal viable set)
# -----------------------------


@dataclass
class SpecialSquare:
    position: Tuple[int, int]
    effect: str
    value: Any | None = None


@dataclass
class Obstacle:
    position: Tuple[int, int]
    type: str


@dataclass
class Board:
    type: str
    size: Tuple[int, int]
    special_squares: List[SpecialSquare]
    obstacles: List[Obstacle]

    def is_valid_position(self, x: int, y: int) -> bool:
        width, height = self.size
        if self.type == "rectangular":
            return 0 <= x < width and 0 <= y < height
        # quadsphere: allow any integer, valid by modulo wrap
        return isinstance(x, int) and isinstance(y, int)

    def normalize_pos(self, x: int, y: int) -> Tuple[int, int]:
        width, height = self.size
        if self.type == "rectangular":
            return x, y
        # wrap on both axes
        return (x % width, y % height)


@dataclass
class Piece:
    type: str
    position: Tuple[int, int]
    owner: str
    promoted: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "position": list(self.position),
            "owner": self.owner,
            "promoted": self.promoted,
        }


@dataclass
class Rules:
    turn_system: str
    victory_conditions: List[Dict[str, Any]]
    draw_conditions: Dict[str, Any] | None
    piece_reuse: str | None
    reuse_rules: Dict[str, Any] | None
    time_limit: Dict[str, Any] | None
    players: Dict[str, Any]


@dataclass
class Game:
    id: str
    board: Board
    pieces: List[Piece]
    rules: Rules
    players: List[Dict[str, Any]]
    state: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "game_id": self.id,
            "board": {
                "type": self.board.type,
                "size": list(self.board.size),
                "special_squares": [asdict(s) for s in self.board.special_squares],
                "obstacles": [asdict(o) for o in self.board.obstacles],
            },
            "pieces": [p.to_dict() for p in self.pieces],
            "rules": asdict(self.rules),
            "players": self.players,
            "state": self.state,
        }


# -----------------------------
# Validation utilities
# -----------------------------


class ValidationError(Exception):
    pass


def validate_board(board_data: Dict[str, Any]) -> None:
    board_type = board_data.get("board_type", "rectangular")
    if board_type not in ["rectangular", "quadsphere"]:
        raise ValidationError(f"Invalid board_type: {board_type}")

    board_size = board_data.get("board_size")
    if (
        not isinstance(board_size, list)
        or len(board_size) != 2
        or not all(isinstance(x, int) and x > 0 for x in board_size)
    ):
        raise ValidationError("Invalid board_size: Expected [width, height] with positive integers")

    width, height = board_size
    for square in board_data.get("special_squares", []) or []:
        position = square.get("position")
        if not (isinstance(position, list) and len(position) == 2 and all(isinstance(x, int) for x in position)):
            raise ValidationError(f"Invalid position in special_squares: {position}")
        if board_type == "rectangular" and not (0 <= position[0] < width and 0 <= position[1] < height):
            raise ValidationError(f"Position {position} out of bounds for board size {board_size}")
        if square.get("effect") not in ["teleport", "damage", "bonus", "block"]:
            raise ValidationError(f"Invalid effect in special_squares: {square.get('effect')}")
        if square.get("effect") == "teleport":
            value = square.get("value")
            if board_type == "rectangular" and not (
                isinstance(value, list)
                and len(value) == 2
                and 0 <= value[0] < width
                and 0 <= value[1] < height
            ):
                raise ValidationError(f"Invalid teleport target: {value}")

    for obstacle in board_data.get("obstacles", []) or []:
        position = obstacle.get("position")
        if not (isinstance(position, list) and len(position) == 2 and all(isinstance(x, int) for x in position)):
            raise ValidationError(f"Invalid position in obstacles: {position}")
        if board_type == "rectangular" and not (0 <= position[0] < width and 0 <= position[1] < height):
            raise ValidationError(f"Obstacle position {position} out of bounds for board size {board_size}")


def validate_pieces(pieces_data: Dict[str, Any], board_size: List[int], board_type: str) -> None:
    width, height = board_size
    piece_types = pieces_data.get("piece_types", []) or []
    seen_names = set()

    for pt in piece_types:
        name = pt.get("name")
        if not name or name in seen_names:
            raise ValidationError(f"Duplicate or missing piece type name: {name}")
        seen_names.add(name)

        movement = pt.get("movement")
        valid_patterns = [
            "adjacent",
            "horizontal_vertical_unlimited",
            "diagonal_unlimited",
            "knight",
            "forward_1",
            "custom",
        ]
        if isinstance(movement, list):
            ok = all(
                isinstance(m, list) and len(m) == 2 and all(isinstance(x, int) for x in m)
                for m in movement
            )
            if not ok:
                raise ValidationError(f"Invalid movement coordinates for {name}: {movement}")
        elif movement not in valid_patterns:
            raise ValidationError(f"Invalid movement pattern for {name}: {movement}")

        if pt.get("promotion"):
            new_type = pt["promotion"].get("new_type")
            if new_type and not any(pt2["name"] == new_type for pt2 in piece_types):
                raise ValidationError(f"Unknown promotion new_type: {new_type}")
            zone = pt["promotion"].get("zone")
            if zone not in ["enemy_back_row", "enemy_territory", "specific_square"]:
                raise ValidationError(f"Invalid promotion zone: {zone}")

    seen_positions = set()
    initial_positions = pieces_data.get("initial_positions", {}) or {}
    for _player_id, pieces in initial_positions.items():
        for piece in pieces:
            if piece.get("type") not in seen_names:
                raise ValidationError(f"Unknown piece type in initial_positions: {piece.get('type')}")
            position = piece.get("position")
            if not (isinstance(position, list) and len(position) == 2):
                raise ValidationError(f"Invalid initial position: {position}")
            x, y = position
            if not (isinstance(x, int) and isinstance(y, int)):
                raise ValidationError(f"Non-integer position for piece {piece.get('type')}: {position}")
            if board_type == "rectangular" and not (0 <= x < width and 0 <= y < height):
                raise ValidationError(f"Position {position} out of bounds for board size {board_size}")
            pos_tuple = (x, y)
            if pos_tuple in seen_positions:
                raise ValidationError(f"Duplicate position {position} found")
            seen_positions.add(pos_tuple)


def validate_rules(rules_data: Dict[str, Any], piece_types: List[Dict[str, Any]]) -> None:
    if rules_data.get("turn_system") != "alternate":
        raise ValidationError(f"Invalid turn_system: {rules_data.get('turn_system')}")

    valid_conditions = ["capture_king", "eliminate_all", "control_center", "reach_square", "score"]
    for condition in rules_data.get("victory_conditions", []) or []:
        if condition.get("type") not in valid_conditions:
            raise ValidationError(f"Invalid victory condition: {condition.get('type')}")
        if condition.get("type") == "capture_king" and condition.get("value") not in [pt["name"] for pt in piece_types]:
            raise ValidationError(f"Unknown piece type in victory condition: {condition.get('value')}")

    if rules_data.get("piece_reuse") == "on" and not rules_data.get("reuse_rules"):
        raise ValidationError("reuse_rules is required when piece_reuse is 'on'")


def validate_settings(board: Dict[str, Any], pieces: Dict[str, Any], rules: Dict[str, Any]) -> None:
    validate_board(board)
    validate_pieces(pieces, board["board_size"], board.get("board_type", "rectangular"))
    validate_rules(rules, pieces.get("piece_types", []) or [])


# -----------------------------
# In-memory storage (MVP)
# -----------------------------


GAMES: Dict[str, Game] = {}


def create_game_from_yamls(board_yaml: str, pieces_yaml: str, rules_yaml: str) -> Game:
    board_data = yaml.safe_load(board_yaml) or {}
    pieces_data = yaml.safe_load(pieces_yaml) or {}
    rules_data = yaml.safe_load(rules_yaml) or {}

    validate_settings(board_data, pieces_data, rules_data)

    width, height = board_data["board_size"]
    board = Board(
        type=board_data.get("board_type", "rectangular"),
        size=(width, height),
        special_squares=[
            SpecialSquare(tuple(s["position"]), s["effect"], s.get("value"))
            for s in (board_data.get("special_squares") or [])
        ],
        obstacles=[Obstacle(tuple(o["position"]), o["type"]) for o in (board_data.get("obstacles") or [])],
    )

    pieces: List[Piece] = []
    initial_positions = pieces_data.get("initial_positions", {}) or {}
    for player_id, plist in initial_positions.items():
        for p in plist:
            pieces.append(
                Piece(
                    type=p["type"],
                    position=tuple(p["position"]),
                    owner=player_id,
                    promoted=bool(p.get("promoted", False)),
                )
            )

    rules = Rules(
        turn_system=rules_data.get("turn_system", "alternate"),
        victory_conditions=rules_data.get("victory_conditions", []) or [],
        draw_conditions=rules_data.get("draw_conditions"),
        piece_reuse=rules_data.get("piece_reuse"),
        reuse_rules=rules_data.get("reuse_rules"),
        time_limit=rules_data.get("time_limit"),
        players=rules_data.get("players", {"number": 2}),
    )

    import secrets

    game_id = secrets.token_hex(4)
    game = Game(
        id=game_id,
        board=board,
        pieces=pieces,
        rules=rules,
        players=[],
        state={"turn": "player_1", "history": []},
    )
    GAMES[game_id] = game
    return game


# -----------------------------
# Flask application factory
# -----------------------------


def create_app() -> tuple[Flask, SocketIO]:
    app = Flask(__name__)
    CORS(app)
    socketio = SocketIO(app, cors_allowed_origins="*")

    @app.get("/api/health")
    def health() -> Any:
        return {"status": "ok"}

    @app.post("/api/games")
    def api_create_game():
        data = request.get_json(force=True, silent=True) or {}
        board_yaml = data.get("board_yaml", "")
        pieces_yaml = data.get("pieces_yaml", "")
        rules_yaml = data.get("rules_yaml", "")
        try:
            game = create_game_from_yamls(board_yaml, pieces_yaml, rules_yaml)
            return jsonify({"game_id": game.id, "status": "created", "errors": None}), 201
        except ValidationError as e:
            return jsonify({"game_id": None, "status": "error", "errors": str(e)}), 400

    @app.get("/api/games/<game_id>")
    def api_get_game(game_id: str):
        game = GAMES.get(game_id)
        if not game:
            return jsonify({"error": "not_found"}), 404
        return jsonify(game.to_dict())

    @app.post("/api/games/<game_id>/move")
    def api_move(game_id: str):
        game = GAMES.get(game_id)
        if not game:
            return jsonify({"error": "not_found"}), 404
        data = request.get_json(force=True, silent=True) or {}
        from_pos = tuple(data.get("from", []))
        to_pos = tuple(data.get("to", []))
        player = data.get("player")
        # MVP: accept any move inside board for rectangular or modulo-wrapped for quadsphere
        try:
            x2, y2 = to_pos
            if game.board.type == "rectangular" and not game.board.is_valid_position(x2, y2):
                raise ValidationError("Move out of bounds")
            if game.board.type == "quadsphere":
                to_pos = game.board.normalize_pos(x2, y2)
            # Append to history only
            game.state.setdefault("history", []).append({
                "from": list(from_pos),
                "to": list(to_pos),
                "player": player,
            })
            # notify via WS (must use socketio.emit in HTTP context)
            socketio.emit("update", {"state": game.state}, room=game.id)
            return jsonify({"state": game.state, "errors": None})
        except Exception as e:  # keep simple for MVP
            return jsonify({"state": game.state, "errors": str(e)})

    # -------- WebSocket --------
    @socketio.on("join")
    def on_join(data):  # type: ignore[no-redef]
        game_id = data.get("game_id")
        if game_id in GAMES:
            join_room(game_id)
            emit("update", {"state": GAMES[game_id].state})
        else:
            emit("error", {"message": "game_not_found"})

    return app, socketio


def main() -> None:
    app, socketio = create_app()
    port = int(os.environ.get("PORT", "8000"))
    socketio.run(app, host="0.0.0.0", port=port, allow_unsafe_werkzeug=True)


if __name__ == "__main__":
    main()


