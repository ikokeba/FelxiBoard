# システム構成仕様書

## 1. 全体アーキテクチャ

```mermaid
graph TD
    subgraph クライアント
        A1[WebUI<br>（設定エディタ/ゲーム画面）]
    end
    subgraph サーバー
        B1[Flask API]
        B2[YAMLパーサー/バリデータ]
        B3[ルールエンジン]
        B4[AIエンジン]
        B5[ゲーム状態管理]
    end
    A1 <--> |WebSocket/REST| B1
    B1 --> B2
    B1 --> B3
    B1 --> B4
    B2 --> B5
    B3 --> B5
    B4 --> B5
```

---

## 2. ファイル構成・データフロー

```mermaid
flowchart TD
    subgraph 設定ファイル
        F1[board.yaml]
        F2[pieces.yaml]
        F3[rules.yaml]
    end
    F1 & F2 & F3 -->|アップロード/編集| S1[YAMLパーサー/バリデータ]
    S1 -->|整合性OK| S2[ゲーム状態生成]
    S1 -->|エラー| S3[エラーメッセージ返却]
    S2 --> S4[ゲーム進行/AI/勝利判定]
    S4 -->|状態更新| C1[WebUI]
```

---

## 3. 各コンポーネントの役割

| コンポーネント         | 役割                                                                 |
|----------------------|--------------------------------------------------------------------|
| WebUI                | 設定編集、盤面プレビュー、コマ操作、エラー表示                      |
| Flask API            | クライアントとの通信、リクエスト受付                                |
| YAMLパーサー/バリデータ | 設定ファイルの読み込み・不整合チェック                              |
| ルールエンジン        | ゲーム進行・勝利条件判定                                            |
| AIエンジン            | AIプレイヤーの手を計算（ミニマックス/モンテカルロ木探索）           |
| ゲーム状態管理        | 盤面・コマ・ターン等の状態を保持                                    |

---

## 4. 設定ファイル構造（Mermaidクラス図）

```mermaid
classDiagram
    class Board {
        +string board_type
        +list board_size
        +list special_squares
        +list obstacles
    }
    class PieceType {
        +string name
        +list movement
        +list special_moves
        +dict promotion
    }
    class InitialPosition {
        +string player_id
        +list pieces
    }
    class Rules {
        +string turn_system
        +list victory_conditions
        +dict draw_conditions
        +string piece_reuse
        +dict reuse_rules
        +dict time_limit
        +dict players
    }
    Board o-- "0..*" SpecialSquare
    Board o-- "0..*" Obstacle
    InitialPosition o-- "0..*" Piece
    Rules o-- "0..*" VictoryCondition
``` 