/**
 * FlexiBoard UI Management
 * ユーザーインターフェースの管理とページ遷移
 */

class UIManager {
    constructor() {
        this.currentPage = 'home-page';
        this.gameId = null;
        this.socket = null;
        this.init();
    }

    /**
     * UIの初期化
     */
    init() {
        this.bindEvents();
        this.showPage('home-page');
    }

    /**
     * イベントリスナーの設定
     */
    bindEvents() {
        // ホームページのボタン
        document.getElementById('create-game-btn').addEventListener('click', () => {
            this.showPage('create-game-page');
        });

        document.getElementById('join-game-btn').addEventListener('click', () => {
            this.showPage('join-game-page');
        });

        // 戻るボタン
        document.getElementById('back-to-home-btn').addEventListener('click', () => {
            this.showPage('home-page');
        });

        document.getElementById('back-to-home-from-join-btn').addEventListener('click', () => {
            this.showPage('home-page');
        });

        // ゲーム離脱ボタン
        document.getElementById('leave-game-btn').addEventListener('click', () => {
            this.leaveGame();
        });

        // 盤面形状選択
        document.querySelectorAll('input[name="board-shape"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.onBoardShapeChange(e.target.value);
            });
        });

        // 設定タブ
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 設定検証ボタン
        document.getElementById('validate-btn').addEventListener('click', () => {
            this.validateConfig();
        });

        // ゲーム作成ボタン
        document.getElementById('create-game-final-btn').addEventListener('click', () => {
            this.createGame();
        });

        // ゲーム参加ボタン
        document.getElementById('join-game-submit-btn').addEventListener('click', () => {
            this.joinGame();
        });

        // ゲームリセットボタン
        document.getElementById('reset-game-btn').addEventListener('click', () => {
            this.resetGame();
        });

        // テンプレート適用ボタン
        document.getElementById('apply-template-btn').addEventListener('click', () => {
            this.applyTemplate();
        });

        // ファイルインポートボタン
        document.getElementById('import-file-btn').addEventListener('click', () => {
            this.triggerFileImport();
        });

        // ファイル入力の変更
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFileImport(e);
        });

        // 一括エクスポートボタン
        document.getElementById('export-all-btn').addEventListener('click', () => {
            this.exportAllSettings();
        });

        // 個別エクスポートボタン
        document.getElementById('export-board-btn').addEventListener('click', () => {
            this.exportSingleFile('board');
        });

        document.getElementById('export-pieces-btn').addEventListener('click', () => {
            this.exportSingleFile('pieces');
        });

        document.getElementById('export-rules-btn').addEventListener('click', () => {
            this.exportSingleFile('rules');
        });

        // AI設定変更イベント
        document.getElementById('ai-difficulty').addEventListener('change', (e) => {
            this.onAiDifficultyChange(e.target.value);
        });

        document.getElementById('ai-player-name').addEventListener('input', (e) => {
            this.onAiPlayerNameChange(e.target.value);
        });

        document.getElementById('enable-ai').addEventListener('change', (e) => {
            this.onAiEnableChange(e.target.checked);
        });
    }

    /**
     * ページの表示切り替え
     * @param {string} pageId - 表示するページのID
     */
    showPage(pageId) {
        // 現在のページを非表示
        const currentPage = document.getElementById(this.currentPage);
        if (currentPage) {
            currentPage.classList.remove('active');
        }

        // 新しいページを表示
        const newPage = document.getElementById(pageId);
        if (newPage) {
            newPage.classList.add('active');
            this.currentPage = pageId;
        }

        // ページ固有の初期化
        this.initPage(pageId);
    }

    /**
     * ページ固有の初期化処理
     * @param {string} pageId - 初期化するページのID
     */
    initPage(pageId) {
        switch (pageId) {
            case 'create-game-page':
                this.initCreateGamePage();
                break;
            case 'join-game-page':
                this.initJoinGamePage();
                break;
            case 'game-play-page':
                this.initGamePlayPage();
                break;
        }
    }

    /**
     * ゲーム作成ページの初期化
     */
    initCreateGamePage() {
        // デフォルトの矩形盤面を選択
        const rectangularRadio = document.querySelector('input[name="board-shape"][value="rectangular"]');
        if (rectangularRadio) {
            rectangularRadio.checked = true;
            this.onBoardShapeChange('rectangular');
        }

        // デフォルトのboardタブを選択
        this.switchTab('board');

        // ステータスメッセージをクリア
        this.setStatusMessage('creation-status', '');
    }

    /**
     * ゲーム参加ページの初期化
     */
    initJoinGamePage() {
        // 入力フィールドをクリア
        document.getElementById('game-id-input').value = '';
        this.setStatusMessage('join-status', '');
    }

    /**
     * ゲームプレイページの初期化
     */
    initGamePlayPage() {
        if (this.gameId) {
            document.getElementById('game-title').textContent = `ゲームプレイ - ${this.gameId}`;
        }
    }

    /**
     * 盤面形状変更時の処理
     * @param {string} boardType - 選択された盤面タイプ
     */
    onBoardShapeChange(boardType) {
        const template = window.configManager.getTemplate(boardType);
        window.configManager.setConfig(template);
        this.updateBoardPreview(boardType);
    }

    /**
     * 設定タブの切り替え
     * @param {string} tabName - 切り替え先のタブ名
     */
    switchTab(tabName) {
        // タブボタンのアクティブ状態を更新
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // テキストエリアの表示を切り替え
        document.querySelectorAll('.config-textarea').forEach(textarea => {
            textarea.classList.add('hidden');
        });
        document.getElementById(`${tabName}-config`).classList.remove('hidden');
    }

    /**
     * 盤面プレビューの更新
     * @param {string} boardType - 盤面タイプ
     */
    updateBoardPreview(boardType) {
        const preview = document.getElementById('board-preview');

        if (boardType === 'rectangular') {
            preview.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; max-width: 300px;">
                    ${Array.from({length: 64}, (_, i) => {
                        const row = Math.floor(i / 8);
                        const col = i % 8;
                        const isSpecial = (row === 4 && col === 4);
                        return `<div style="width: 30px; height: 30px; border: 1px solid #ccc; background: ${isSpecial ? '#ffeb3b' : (i % 2 === 0 ? '#f0f0f0' : '#ddd')}; display: flex; align-items: center; justify-content: center; font-size: 10px;">${isSpecial ? '★' : ''}</div>`;
                    }).join('')}
                </div>
                <p style="margin-top: 10px; font-size: 12px; color: #666;">矩形盤面 (8×8) - 黄色いマスは特殊マス</p>
            `;
        } else if (boardType === 'quadsphere') {
            preview.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 1px; max-width: 300px; border: 2px solid #2196f3; padding: 10px;">
                    ${Array.from({length: 64}, (_, i) => {
                        const row = Math.floor(i / 8);
                        const col = i % 8;
                        return `<div style="width: 25px; height: 25px; border: 1px solid #2196f3; background: ${(row + col) % 2 === 0 ? '#e3f2fd' : '#bbdefb'}; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #1976d2;">${row},${col}</div>`;
                    }).join('')}
                </div>
                <p style="margin-top: 10px; font-size: 12px; color: #666;">クアッドスフィア盤面 - 境界が接続される球面状</p>
            `;
        }
    }

    /**
     * 設定の検証
     */
    async validateConfig() {
        const btn = document.getElementById('validate-btn');
        const originalText = btn.textContent;

        try {
            btn.textContent = '検証中...';
            btn.disabled = true;

            const result = await window.apiManager.validateConfig();
            this.displayValidationResult(result);

        } catch (error) {
            this.displayValidationResult({
                success: false,
                errors: [error.message || '検証中にエラーが発生しました']
            });
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    /**
     * 検証結果の表示
     * @param {Object} result - 検証結果
     */
    displayValidationResult(result) {
        const messagesDiv = document.getElementById('validation-messages');
        messagesDiv.innerHTML = '';

        if (result.success) {
            const successDiv = document.createElement('div');
            successDiv.className = 'message success';
            successDiv.textContent = '✓ 設定は有効です';
            messagesDiv.appendChild(successDiv);
        } else {
            // エラーの表示
            result.errors.forEach(error => {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'message error';
                errorDiv.textContent = `✗ ${error}`;
                messagesDiv.appendChild(errorDiv);
            });
        }

        // 警告の表示
        if (result.warnings && result.warnings.length > 0) {
            result.warnings.forEach(warning => {
                const warningDiv = document.createElement('div');
                warningDiv.className = 'message warning';
                warningDiv.textContent = `⚠ ${warning}`;
                messagesDiv.appendChild(warningDiv);
            });
        }

        // スクロールして結果を表示
        messagesDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * ゲームの作成
     */
    async createGame() {
        const btn = document.getElementById('create-game-final-btn');
        const originalText = btn.textContent;

        try {
            btn.textContent = '作成中...';
            btn.disabled = true;

            const result = await window.apiManager.createGame();
            if (result.success) {
                this.gameId = result.gameId;
                this.showPage('game-play-page');
                this.setStatusMessage('creation-status', '');
            } else {
                this.setStatusMessage('creation-status', result.error, 'error');
            }

        } catch (error) {
            this.setStatusMessage('creation-status', error.message || 'ゲーム作成中にエラーが発生しました', 'error');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    /**
     * ゲームへの参加
     */
    async joinGame() {
        const gameIdInput = document.getElementById('game-id-input');
        const gameId = gameIdInput.value.trim();

        if (!gameId) {
            this.setStatusMessage('join-status', 'ゲームIDを入力してください', 'warning');
            return;
        }

        const btn = document.getElementById('join-game-submit-btn');
        const originalText = btn.textContent;

        try {
            btn.textContent = '参加中...';
            btn.disabled = true;

            const result = await window.apiManager.joinGame(gameId);
            if (result.success) {
                this.gameId = gameId;
                this.showPage('game-play-page');
                this.setStatusMessage('join-status', '');
            } else {
                this.setStatusMessage('join-status', result.error, 'error');
            }

        } catch (error) {
            this.setStatusMessage('join-status', error.message || 'ゲーム参加中にエラーが発生しました', 'error');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    /**
     * ゲームからの離脱
     */
    leaveGame() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.gameId = null;
        this.showPage('home-page');
    }

    /**
     * ゲームのリセット
     */
    resetGame() {
        if (confirm('ゲームをリセットしますか？現在の進行状況が失われます。')) {
            // ゲームリセットの実装
            console.log('Game reset requested');
        }
    }

    /**
     * テンプレートを適用
     */
    applyTemplate() {
        const templateSelect = document.getElementById('template-select');
        const templateType = templateSelect.value;

        // 現在の盤面タイプを取得
        const boardTypeRadio = document.querySelector('input[name="board-shape"]:checked');
        const boardType = boardTypeRadio ? boardTypeRadio.value : 'rectangular';

        try {
            const success = window.configManager.switchTemplate(boardType, templateType);
            if (success) {
                this.setStatusMessage('template-status', `${templateType}テンプレートを適用しました`, 'success');

                // カスタムテンプレートの場合は保存
                if (templateType === 'custom') {
                    window.configManager.saveCustomTemplate(boardType);
                }
            } else {
                this.setStatusMessage('template-status', 'テンプレートの適用に失敗しました', 'error');
            }
        } catch (error) {
            console.error('Template application error:', error);
            this.setStatusMessage('template-status', error.message, 'error');
        }
    }

    /**
     * ファイルインポートをトリガー
     */
    triggerFileImport() {
        const fileInput = document.getElementById('file-input');
        fileInput.click();
    }

    /**
     * ファイルインポートを処理
     * @param {Event} event - ファイル入力イベント
     */
    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const result = await window.configManager.importFile(file);
            const configType = result.type;
            const content = result.content;

            // 適切な設定フィールドに内容を設定
            const configElement = document.getElementById(`${configType}-config`);
            if (configElement) {
                configElement.value = content;

                // 該当するタブをアクティブに
                this.switchTab(configType);

                this.setStatusMessage('import-status', `${file.name} をインポートしました`, 'success');
            } else {
                this.setStatusMessage('import-status', '不明なファイルタイプです', 'error');
            }

        } catch (error) {
            console.error('File import error:', error);
            this.setStatusMessage('import-status', `インポート失敗: ${error.message}`, 'error');
        }

        // ファイル入力をリセット
        event.target.value = '';
    }

    /**
     * すべての設定をエクスポート
     */
    exportAllSettings() {
        try {
            window.configManager.exportAllSettings();
            this.setStatusMessage('export-status', '設定ファイルをZIPでエクスポートしました', 'success');
        } catch (error) {
            console.error('Export all settings error:', error);
            this.setStatusMessage('export-status', `エクスポート失敗: ${error.message}`, 'error');
        }
    }

    /**
     * 単一ファイルをエクスポート
     * @param {string} configType - 設定タイプ ('board', 'pieces', 'rules')
     */
    exportSingleFile(configType) {
        try {
            const config = window.configManager.getCurrentConfig();
            const content = config[configType];

            if (!content || content.trim() === '') {
                this.setStatusMessage('export-status', 'エクスポートする内容がありません', 'warning');
                return;
            }

            const filename = `${configType}.yaml`;
            window.configManager.downloadFile(filename, content);

            this.setStatusMessage('export-status', `${filename} をエクスポートしました`, 'success');

        } catch (error) {
            console.error('Export single file error:', error);
            this.setStatusMessage('export-status', `エクスポート失敗: ${error.message}`, 'error');
        }
    }

    /**
     * AI難易度変更時の処理
     * @param {string} difficulty - 選択された難易度
     */
    onAiDifficultyChange(difficulty) {
        if (window.aiManager) {
            window.aiManager.setDifficulty(difficulty);
            this.setStatusMessage('ai-status', `AI難易度を ${difficulty} に設定しました`, 'success');
        }
    }

    /**
     * AIプレイヤー名変更時の処理
     * @param {string} name - 入力された名前
     */
    onAiPlayerNameChange(name) {
        // AIマネージャーに名前を設定（将来的に使用）
        console.log('AI player name changed to:', name);
    }

    /**
     * AI有効/無効変更時の処理
     * @param {boolean} enabled - AI有効かどうか
     */
    onAiEnableChange(enabled) {
        if (window.aiManager) {
            if (enabled) {
                this.setStatusMessage('ai-status', 'AI機能を有効にしました', 'success');
            } else {
                this.setStatusMessage('ai-status', 'AI機能を無効にしました', 'warning');
            }
        }
    }

    /**
     * ステータスメッセージの設定
     * @param {string} elementId - メッセージを表示する要素のID
     * @param {string} message - メッセージ内容
     * @param {string} type - メッセージタイプ ('success', 'error', 'warning', 'info')
     */
    setStatusMessage(elementId, message, type = 'info') {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.textContent = message;
        element.className = 'status-message';

        if (type !== 'info') {
            element.classList.add(type);
        }
    }
}

// グローバルインスタンス
window.uiManager = new UIManager();
