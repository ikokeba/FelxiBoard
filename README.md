# FlexiBoard

Webベースの汎用ボードゲーム作成/対戦プラットフォーム（MVP）。

## 技術スタック
- Backend: Python (Flask, Flask-SocketIO), PyYAML
- Frontend: HTML/CSS/JavaScript（後続実装）

## 開発環境（uv）
Windows PowerShell 前提。

推奨（プロジェクト依存関係の同期）:
```
uv --version
uv venv --python 3.10 --seed --prompt .venv
uv sync
```

代替（開発ツール含めてインストール）:
```
uv venv --python 3.10 --seed --prompt .venv
uv pip install -e .[dev]
```

## 実行
```
# 開発起動
./.venv/Scripts/python -m backend.app
# または（インストール済みなら）
flexiboard
# または（uv 経由で実行）
uv run flexiboard
```

## API 概要（MVP）
- POST /api/games { board_yaml, pieces_yaml, rules_yaml }
- GET /api/games/{id}
- POST /api/games/{id}/move { from, to, player }

WebSocket:
- `join` { game_id } → `update` { state }

サンプル設定は `backend/sample_configs/` を参照。
