import json
from pathlib import Path

from backend.app import create_app


def main() -> None:
    app, _socketio = create_app()
    client = app.test_client()

    base = Path("backend/sample_configs")
    board_yaml = (base / "board_quadsphere.yaml").read_text(encoding="utf-8")
    pieces_yaml = (base / "pieces_basic.yaml").read_text(encoding="utf-8")
    rules_yaml = (base / "rules_basic.yaml").read_text(encoding="utf-8")

    # Health
    health = client.get("/api/health")
    print("HEALTH:", health.status_code, health.json)

    # Create game
    resp = client.post(
        "/api/games",
        json={
            "board_yaml": board_yaml,
            "pieces_yaml": pieces_yaml,
            "rules_yaml": rules_yaml,
        },
    )
    print("CREATE:", resp.status_code, resp.json)

    if resp.status_code == 201 and resp.json and resp.json.get("game_id"):
        game_id = resp.json["game_id"]
        g = client.get(f"/api/games/{game_id}")
        print("GET:", g.status_code, bool(g.json))


if __name__ == "__main__":
    main()


