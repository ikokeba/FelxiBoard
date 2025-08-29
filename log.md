# プロジェクトログ

## 2025-07-25

### 要件定義フォーマットとの比較作業完了

**作業内容**:
- `/specifications`ディレクトリと`FlexiBoard/1.要件整理.md`の内容を要件定義書テンプレートと照合
- 不足している項目を特定し、各ドキュメントに追加

**追加した項目**:
1. **文書情報**: 文書名、バージョン、作成日、承認者等
2. **変更履歴**: バージョン管理テーブル
3. **プロジェクト概要**: 背景・目的、スコープ、設計方針
4. **用語・略語定義**: プロジェクト固有の用語集
5. **リスク分析**: 影響度・発生確率・対策のマトリックス
6. **承認**: 承認者・承認日・署名欄

**更新したファイル**:
- `FlexiBoard/specifications/01_requirements.md`
- `FlexiBoard/specifications/02_system_architecture.md`
- `FlexiBoard/specifications/03_algorithm.md`
- `FlexiBoard/specifications/04_UI_design.md`
- `FlexiBoard/1.要件整理.md`

**改善提案**:
- MVP/Extensionラベルの付与
- テスト基準の追加
- 非機能要件の定量化
- セキュリティ設計の詳細化
- 運用・保守計画の策定

**次のアクション**:
- 改善提案の段階的実施
- 追加ドキュメント（テスト計画書、運用・保守計画書、セキュリティ設計書）の作成検討

--- 
 
## 2025-08-11

### バックエンドMVP実装と環境整備

**作業内容**:
- uv仮想環境（.venv）作成、依存インストール（Flask, Flask-SocketIO, PyYAML, devツール）
- `pyproject.toml` 整備（hatch build targets: wheel/sdist, scripts）
- 最小バックエンド実装追加（`backend/app.py`）
  - モデル: `Game`, `Board`, `Piece`, `Rules`, `SpecialSquare`, `Obstacle`
  - バリデーション: `validate_board`, `validate_pieces`, `validate_rules`, `validate_settings`
  - API: `GET /api/health`, `POST /api/games`, `GET /api/games/{id}`, `POST /api/games/{id}/move`
  - WebSocket: `join`, `update`（HTTP→WS通知は`socketio.emit`に修正）
- サンプル設定追加（`backend/sample_configs/*.yaml`）
- スモークテストスクリプト追加（`scripts/smoke_api.py`）

**確認結果**:
- 内蔵テストクライアントでヘルス確認・ゲーム作成・取得が成功（PowerShell経由のJSON送信ではエスケープ起因の500が発生するためbody.json経由で切り分け中）

**todo更新**:
- 環境セットアップの完了を反映、API疎通テスト項目を追加

**既知の課題**:
- PowerShellの`Invoke-RestMethod`で複数行YAMLを含むJSONのエスケープが不安定→外部ファイル化 or curl利用に切替予定
- ログ出力・例外ハンドリングの強化、コード分割（`services/`, `models/`）

**次のアクション**:
- PowerShell/curl両対応の疎通スクリプト整備とAPI 500切り分け完了
- ユニットテスト雛形追加（バリデーション/API）
- フロントエンド雛形着手（設定エディタのモック）

---

## 2025-08-29

### 公開リポジトリ準備（/repo_publish_preparation 準拠）

**作業内容**:
- 機密情報スキャン（コード/履歴/設定・データ）
- `.gitignore` 拡充（`.venv/`, `.env`, `__pycache__/`, `*.log`, ツールキャッシュ 等）
- `requirements.txt` 生成（`uv pip compile pyproject.toml -o requirements.txt`）
- 追跡済みサーバーログの除外（`git rm --cached server-*.log`）
- Serena用ディレクトリ作成（`.serena/.keep`）
- `README.md` 更新（`uv sync` 手順・`uv run` 追記）

**確認結果**:
- コード内・履歴に機密値の混入なし（`Select-String` によるキーワード確認）
- 依存関係は `pyproject.toml` を基に `requirements.txt` へ正しく反映
- 現在ブランチは `origin` より2コミット先行、push未実施

**次のアクション**:
- `LICENSE` 追加（種別と著作権表記の確定待ち）
- 公開前最終チェックリストの完了

---