# アルゴリズム仕様書

## 1. 設定ファイルバリデーション（YAMLパーサー）

### 概要
- board.yaml, pieces.yaml, rules.yaml の整合性を一括検証
- 盤面サイズ・コマ配置・勝利条件・ルールの相互矛盾を検出

### チェックフロー（シーケンス図）

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant W as WebUI
    participant S as サーバー
    participant P as YAMLパーサー
    U->>W: 設定ファイル編集
    W->>S: 設定送信
    S->>P: validate_settings
    alt 不整合あり
        P-->>S: エラー返却
        S-->>W: エラー表示
    else OK
        P-->>S: 設定OK
        S-->>W: ゲーム開始
    end
```

### 主なバリデーションロジック（擬似コード）

- board_type, board_size, special_squares, obstacles の妥当性
- piece_types のユニーク性・movement/promotion の妥当性
- initial_positions の座標・重複・type の存在確認
- rules.yaml の victory_conditions/piece_reuse/players の妥当性

---

## 2. 盤面・コマの移動処理

### 盤面形状ごとの座標処理

```mermaid
flowchart TD
    A[移動入力] --> B{盤面形状}
    B -- 矩形 --> C[範囲内チェック]
    B -- クアッドスフィア --> D[モジュロ演算で正規化]
    C & D --> E[移動ルール判定]
    E --> F[合法なら移動実行]
```

- **矩形盤面**：0 <= x < width, 0 <= y < height
- **クアッドスフィア**：x = x % width, y = y % height

---

## 3. 勝利条件判定

### 勝利条件の種類と判定タイミング

| 種類             | 判定内容例                                      |
|------------------|-----------------------------------------------|
| capture_king     | 指定コマが捕獲されたか                         |
| eliminate_all    | 相手コマが全て除去されたか                     |
| control_center   | 中央マスを占領しているか                       |
| reach_square     | 特定マスに到達したか                           |
| score            | ポイントが目標値に到達したか                   |

### 判定フロー

```mermaid
flowchart TD
    A[ターン終了時] --> B[勝利条件リストを順次判定]
    B -->|条件成立| C[勝者決定]
    B -->|全て不成立| D[次ターンへ]
```

---

## 4. AIアルゴリズム（概要）

- **ミニマックス法**：全手を探索し、最善手を選択
- **モンテカルロ木探索**：ランダムプレイアウトで勝率の高い手を選択

```mermaid
flowchart TD
    A[AI手番] --> B{AI方式}
    B -- ミニマックス --> C[全手探索・評価]
    B -- モンテカルロ --> D[ランダムシミュレーション]
    C & D --> E[最善手選択]
    E --> F[手を返す]
```

---

## 5. 不整合チェックの詳細

- 盤面サイズ・コマ配置・勝利条件・ルールの相互矛盾を検出
- エラー例・メッセージ例を明記 