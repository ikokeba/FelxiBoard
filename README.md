# FlexiBoard

Webベースの汎用ボードゲーム作成/対戦プラットフォーム（MVP）。設定用YAMLから盤面・駒・ルールを構成し、HTTP/WS APIで進行を制御します。

## 技術スタック

- Backend: Python（Flask, Flask-SocketIO, Flask-CORS）, PyYAML
- Frontend: HTML/CSS/JavaScript（後続実装）

## ディレクトリ構成（抜粋）

- `backend/`: Flask アプリ（`backend/app.py`）、サンプル設定 `sample_configs/*.yaml`
- `scripts/`: スモークテスト等（`scripts/smoke_api.py`）
- `specifications/`: 要件・設計ドキュメント
- `pyproject.toml`: パッケージ定義・CLI エントリ `flexiboard`

## 開発環境（uv）

Windows PowerShell 前提。Python 3.10+。

推奨（依存を同期）:

```powershell
uv --version
uv venv --python 3.10 --seed --prompt .venv
uv sync
```

代替（開発ツール込みでインストール）:

```powershell
uv venv --python 3.10 --seed --prompt .venv
uv pip install -e .[dev]
```

## 実行方法

```powershell
# 1) 直接起動（仮想環境の Python）
./.venv/Scripts/python -m backend.app

# 2) パッケージの CLI
flexiboard

# 3) uv 経由
uv run flexiboard

# ポート変更（PowerShell）
$env:PORT = 8010; uv run flexiboard
```

## API 概要（MVP）

- `GET  /api/health` → { status: "ok" }
- `POST /api/games` body: `{ board_yaml, pieces_yaml, rules_yaml }`
- `GET  /api/games/{id}`
- `POST /api/games/{id}/move` body: `{ from, to, player }`

WebSocket イベント:

- `join` `{ game_id }` → サーバから `update` `{ state }`

サンプル設定は `backend/sample_configs/` を参照。

### クイック確認

PowerShell の多行 YAML 埋め込みは扱いが難しいため、スモークスクリプトの利用を推奨:

```powershell
uv run python scripts/smoke_api.py
```

curl で試す場合（例: Windows Git Bash 等）:

```bash
curl -X POST http://localhost:8000/api/games \
  -H "Content-Type: application/json" \
  -d @<(cat <<JSON
{
  "board_yaml": "$(cat backend/sample_configs/board_quadsphere.yaml)",
  "pieces_yaml": "$(cat backend/sample_configs/pieces_basic.yaml)",
  "rules_yaml":  "$(cat backend/sample_configs/rules_basic.yaml)"
}
JSON
)
```

## 開発

- フォーマット: `uv run black .`
- Lint: `uv run ruff check .`
- 型チェック: `uv run mypy backend`
- 依存ピン止め更新: `uv pip compile pyproject.toml -o requirements.txt`

## トラブルシュート

- PowerShell で複数行 YAML を JSON に含めるとエスケープ問題が発生しやすいです。`scripts/smoke_api.py` を使用するか、ファイル読み込み（`Get-Content -Raw`）で対応してください。

## ライセンス

TBD（公開時に `LICENSE` を追加予定）。
