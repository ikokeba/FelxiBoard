# 詳細設計書

## 1. クラス構成（再掲・補足）

```mermaid
classDiagram
  class Game {
    +id: str
    +board: Board
    +pieces: List[Piece]
    +rules: Rules
    +players: List[Player]
    +state: dict
    +make_move(move: Move) bool
    +check_victory() -> Optional[str]
    +to_dict() dict
    +undo_move() bool
    +redo_move() bool
  }
  class Board {
    +type: str
    +size: Tuple[int, int]
    +special_squares: List[SpecialSquare]
    +obstacles: List[Obstacle]
    +get_square(x: int, y: int) -> Square
    +normalize_pos(x: int, y: int) -> Tuple[int, int]
    +is_within_bounds(x: int, y: int) -> bool
  }
  class Piece {
    +type: str
    +position: Tuple[int, int]
    +owner: str
    +promoted: bool
    +move(to: Tuple[int, int]) bool
    +can_promote(to: Tuple[int, int]) -> bool
  }
  class Rules {
    +turn_system: str
    +victory_conditions: List[VictoryCondition]
    +draw_conditions: dict
    +piece_reuse: str
    +reuse_rules: dict
    +time_limit: dict
    +players: dict
    +validate_move(piece: Piece, from_pos: Tuple[int, int], to_pos: Tuple[int, int], board: Board) -> bool
    +check_victory_condition(game_state) -> Optional[str]
    +validate_settings(board, pieces, rules) -> None
  }
  class Player {
    +id: str
    +name: str
    +type: str # human/ai
    +ai_level: Optional[str]
  }
  class Move {
    +from_pos: Tuple[int, int]
    +to_pos: Tuple[int, int]
    +player_id: str
    +piece_type: str
    +promote: bool
    +is_valid: bool
    +error_message: Optional[str]
  }
  class SpecialSquare {
    +position: Tuple[int, int]
    +effect: str
    +value: Any
  }
  class Obstacle {
    +position: Tuple[int, int]
    +type: str
  }
  class VictoryCondition {
    +type: str
    +value: Any
  }

  Game o-- Board
  Game o-- Piece
  Game o-- Rules
  Game o-- Player
  Game o-- Move
  Board o-- SpecialSquare
  Board o-- Obstacle
  Rules o-- VictoryCondition
```

- **補足**: undo/redo, is_within_bounds, can_promote, is_valid, error_message等を追加し、保守性・再利用性・エラー処理を強化。

---

## 1.1 クラス・メソッドの入出力型・例外・エラーケース（補足）

| クラス/メソッド                | 入力型                       | 出力型                       | 例外・エラーケース例                       |
|-------------------------------|------------------------------|------------------------------|--------------------------------------------|
| Game.make_move(move)           | Move                         | bool                         | 不正手（Move.is_valid=False, error_message）|
| Game.undo_move(), redo_move()  | なし                         | bool                         | 履歴なし、巻き戻し不可                      |
| Board.get_square(x, y)         | int, int                     | Square/None                  | 範囲外アクセス                             |
| Board.normalize_pos(x, y)      | int, int                     | (int, int)                   | -                                          |
| Piece.move(to)                 | (int, int)                   | bool                         | 不正移動、成り不可                         |
| Rules.validate_move(...)       | Piece, from, to, Board       | bool/str                     | 移動ルール違反、障害物衝突                 |
| Rules.check_victory_condition  | dict                         | Optional[str]                | -                                          |
| Rules.validate_settings        | board, pieces, rules         | None/ValidationError         | 設定不整合                                 |

---

## 2. 主要モジュールの内部ロジック・アルゴリズム

### 2.1 Gameクラス
- ゲーム全体の状態管理、進行制御、履歴管理
- 主なメソッド：
  - `make_move(move: Move)`: 合法手判定→状態更新→履歴追加。異常時はMove.is_valid=False, error_messageに理由を格納。
  - `undo_move()`, `redo_move()`: 履歴を用いた巻き戻し/やり直し。UIからも呼び出し可能。
  - `check_victory()`: 勝利条件判定。勝者IDまたはNoneを返す。
  - `to_dict()`: シリアライズ

### 2.2 Boardクラス
- 盤面構造・特殊マス・障害物管理
- クアッドスフィア盤面時はnormalize_posで端ラップ処理
- 主なメソッド：
  - `get_square(x, y)`: 指定座標のマス情報取得
  - `normalize_pos(x, y)`: 端ラップ処理
  - `is_within_bounds(x, y)`: 盤面内判定（矩形盤面時）

### 2.3 Pieceクラス
- コマの状態・移動・成り処理
- 主なメソッド：
  - `move(to)`: 位置更新、成り判定
  - `can_promote(to)`: 成り可能か判定

### 2.4 Rulesクラス
- 合法手判定・勝利条件判定・バリデーション
- 主なメソッド：
  - `validate_move(piece, from, to, board)`: 移動ルール・障害物・特殊マス考慮。違反時は理由を返す。
  - `check_victory_condition(game_state)`: 現在状態で勝利条件成立か判定
  - `validate_settings(board, pieces, rules)`: 設定ファイルの整合性検証

### 2.5 エラー処理・異常系設計方針
- すべてのユーザー入力・APIリクエストはサーバー側でバリデーション
- 不正な操作・設定時は詳細なエラーメッセージを返却
- 予期せぬ例外はログ出力し、UIには一般的なエラー通知を表示
- 履歴巻き戻し・やり直し時も一貫した状態復元を保証

---

## 3. 主要アルゴリズム例

### 3.1 合法手判定（Rules.validate_move）
1. コマの移動ルール（movement, special_moves）を取得
2. 盤面形状（矩形/クアッドスフィア）に応じて座標正規化
3. 障害物・特殊マスの有無を確認
4. 目的地が盤面内（またはラップ後）か判定
5. 他コマとの衝突・特殊ルール（ジャンプ等）を考慮
6. 合法ならTrue、不正ならFalseと理由

### 3.2 勝利条件判定（Rules.check_victory_condition）
1. victory_conditionsリストを順に評価
2. 例：capture_kingなら盤面上にkingが存在するか
3. control_centerなら指定マスを占有しているか
4. scoreならポイント到達か
5. いずれか成立で勝者を返す

---

## 4. シーケンス図（ゲーム進行・エラー処理含む）

```mermaid
sequenceDiagram
  participant U as ユーザー
  participant W as WebUI
  participant S as サーバー
  participant P as yaml_parser.py
  participant G as game_service.py

  U->>W: 設定編集/操作
  W->>S: POST /api/games
  S->>P: validate_settings
  alt 不整合
    P->>S: エラー
    S->>W: エラー通知
    W->>U: エラー表示
  else 正常
    P->>S: OK
    S->>G: ゲーム作成
    G->>S: ゲーム状態
    S->>W: ゲームID
    W->>U: ゲーム画面
  end
  loop ゲーム進行
    U->>W: コマ移動
    W->>S: move
    S->>G: make_move
    G->>G: 動的チェック
    alt 不正
      G->>S: エラー（Move.error_message）
      S->>W: エラー通知
      W->>U: エラー表示
    else 正常
      G->>S: 更新状態
      S->>W: 状態通知
      W->>U: 盤面更新
    end
  end
```

---

## 5. データベース設計書（補足）
- 各テーブルの主キー・外部キー・インデックス・制約条件を明記
- 履歴テーブルはゲームID・手番順・タイムスタンプでインデックス
- 設定ファイルはゲームごとにバージョン管理可能

---

## 6. API仕様書（補足）
- すべてのAPIはバリデーションエラー時に400、認証エラー時に401、サーバーエラー時に500を返す
- 入力・出力のJSONスキーマ例を明記
- エラー時はerror_messageフィールドで詳細を返却

---

## 7. UI設計書

### 7.1 画面レイアウト例

```mermaid
flowchart TD
  S1[トップ画面]
  S2[設定エディタ画面]
  S3[ゲーム作成/参加画面]
  S4[ゲームプレイ画面]
  S5[観戦/履歴画面]

  S1 --> S2
  S1 --> S3
  S3 --> S4
  S4 --> S5
  S1 --> S5
```

### 7.2 主要UI要素
- **設定エディタ画面**: 盤面形状選択ドロップダウン、YAMLエディタ、プレビュー盤面、バリデーション結果表示、保存/インポート/エクスポートボタン
- **ゲームプレイ画面**: 盤面グリッド、コマ操作（ドラッグ/クリック）、ターン表示、チャット欄、履歴/巻き戻し/やり直しボタン
- **観戦/履歴画面**: 盤面遷移再生コントロール、進行状況表示、観戦者リスト

---

## 7.3 主要画面ワイヤーフレーム例（Mermaid）

```mermaid
flowchart TD
  Top[トップ画面: ロゴ・新規作成・参加・履歴]
  Editor[設定エディタ: 盤面形状選択・YAMLエディタ・プレビュー・保存]
  Game[ゲーム画面: 盤面・コマ操作・ターン表示・チャット・履歴]
  Spectate[観戦/履歴: 盤面遷移再生・進行状況・観戦者リスト]

  Top --> Editor
  Top --> Game
  Top --> Spectate
  Game --> Spectate
```

---

## 8. 再利用性・保守性・最適化の補足
- すべてのクラス・APIは単体テスト可能な粒度で設計
- 盤面・コマ・ルールの追加/変更は設定ファイルのみで対応可能
- 履歴・巻き戻し・やり直し機能により、ユーザー体験とデバッグ性を向上
- エラー処理・バリデーションは共通モジュール化し、再利用性・保守性を高める 

---

## 8.1 エラー処理・異常系フロー図（Mermaid）

```mermaid
flowchart TD
  A[ユーザー操作] --> B[WebUI入力]
  B --> C[API/WSリクエスト]
  C --> D[サーバーバリデーション]
  D -- OK --> E[正常処理]
  D -- エラー --> F[エラーメッセージ返却]
  F --> B
```

- 例：不正なYAML/不正手/認証エラー時は詳細なエラーメッセージをUIに返却 