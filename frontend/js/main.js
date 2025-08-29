/**
 * FlexiBoard Main Application
 * アプリケーションのメインエントリーポイント
 */

class FlexiBoardApp {
    constructor() {
        this.initialized = false;
        this.init();
    }

    /**
     * アプリケーションの初期化
     */
    async init() {
        try {
            console.log('FlexiBoard アプリケーションを初期化中...');

            // 依存関係のチェック
            await this.checkDependencies();

            // 各マネージャーの初期化確認
            this.checkManagers();

            // 初期ページの設定
            this.setupInitialPage();

            // イベントリスナーの設定
            this.bindGlobalEvents();

            // ヘルスチェック
            await this.performHealthCheck();

            this.initialized = true;
            console.log('FlexiBoard アプリケーションの初期化が完了しました');

        } catch (error) {
            console.error('アプリケーション初期化エラー:', error);
            this.showInitializationError(error);
        }
    }

    /**
     * 依存関係のチェック
     */
    async checkDependencies() {
        // Socket.IOのチェック
        if (typeof io === 'undefined') {
            throw new Error('Socket.IOライブラリが読み込まれていません');
        }

        // マネージャーのチェック
        const managers = ['configManager', 'uiManager', 'apiManager', 'gameManager'];
        for (const manager of managers) {
            if (!window[manager]) {
                throw new Error(`${manager} が初期化されていません`);
            }
        }

        console.log('依存関係チェック完了');
    }

    /**
     * マネージャーの初期化確認
     */
    checkManagers() {
        // 各マネージャーが正しく初期化されているか確認
        if (window.configManager && typeof window.configManager.getTemplate === 'function') {
            console.log('ConfigManager: OK');
        }

        if (window.uiManager && typeof window.uiManager.showPage === 'function') {
            console.log('UIManager: OK');
        }

        if (window.apiManager && typeof window.apiManager.healthCheck === 'function') {
            console.log('APIManager: OK');
        }

        if (window.gameManager && typeof window.gameManager.renderBoard === 'function') {
            console.log('GameManager: OK');
        }
    }

    /**
     * 初期ページの設定
     */
    setupInitialPage() {
        // デフォルトのページを表示
        if (window.uiManager) {
            window.uiManager.showPage('home-page');
        }
    }

    /**
     * グローバルイベントリスナーの設定
     */
    bindGlobalEvents() {
        // ページ表示時の処理
        document.addEventListener('pageShow', (event) => {
            this.handlePageShow(event.detail.pageId);
        });

        // エラーハンドリング
        window.addEventListener('error', (event) => {
            console.error('JavaScript エラー:', event.error);
            this.handleGlobalError(event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('未処理のPromise拒否:', event.reason);
            this.handleGlobalError(event.reason);
        });

        // キーボードショートカット
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcut(event);
        });
    }

    /**
     * ヘルスチェックの実行
     */
    async performHealthCheck() {
        try {
            const result = await window.apiManager.healthCheck();
            if (result.status === 'ok') {
                console.log('バックエンドとの接続確認: OK');
                this.showStatusMessage('バックエンドサービスに接続しました', 'success');
            } else {
                throw new Error('バックエンドからの応答が不正です');
            }
        } catch (error) {
            console.warn('ヘルスチェック失敗:', error.message);
            this.showStatusMessage('バックエンドサービスに接続できませんでした', 'warning');
        }
    }

    /**
     * ページ表示時の処理
     * @param {string} pageId - 表示されたページID
     */
    handlePageShow(pageId) {
        console.log(`ページ表示: ${pageId}`);

        // ページ固有の初期化
        switch (pageId) {
            case 'game-play-page':
                this.initializeGamePage();
                break;
        }
    }

    /**
     * ゲームページの初期化
     */
    async initializeGamePage() {
        if (!window.apiManager.currentGameId) {
            console.warn('ゲームIDが設定されていません');
            return;
        }

        try {
            // 最新のゲーム状態を取得
            const gameData = await window.apiManager.getGameState(window.apiManager.currentGameId);

            // ゲームマネージャーにデータを設定
            if (window.gameManager) {
                window.gameManager.setGameData(gameData);
            }

        } catch (error) {
            console.error('ゲームページ初期化エラー:', error);
            this.showErrorMessage('ゲームデータの読み込みに失敗しました');
        }
    }

    /**
     * グローバルエラーハンドリング
     * @param {Error} error - エラーオブジェクト
     */
    handleGlobalError(error) {
        console.error('グローバルエラー:', error);

        // ユーザーに通知
        this.showErrorMessage('予期しないエラーが発生しました。ページを再読み込みしてください。');

        // エラーレポート（実際のプロジェクトではサーバーに送信）
        this.reportError(error);
    }

    /**
     * キーボードショートカットの処理
     * @param {KeyboardEvent} event - キーボードイベント
     */
    handleKeyboardShortcut(event) {
        // Ctrl/Cmd + R でページリロード（デフォルト動作を許可）
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            return;
        }

        // Escapeキーでホームに戻る
        if (event.key === 'Escape') {
            event.preventDefault();
            if (window.uiManager && window.uiManager.currentPage !== 'home-page') {
                window.uiManager.showPage('home-page');
            }
        }

        // Ctrl/Cmd + N で新規ゲーム作成
        if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
            event.preventDefault();
            if (window.uiManager && window.uiManager.currentPage === 'home-page') {
                window.uiManager.showPage('create-game-page');
            }
        }
    }

    /**
     * ステータスメッセージの表示
     * @param {string} message - メッセージ
     * @param {string} type - メッセージタイプ
     */
    showStatusMessage(message, type = 'info') {
        // 一時的な通知として表示
        this.showNotification(message, type, 3000);
    }

    /**
     * エラーメッセージの表示
     * @param {string} message - エラーメッセージ
     */
    showErrorMessage(message) {
        this.showNotification(message, 'error', 5000);
    }

    /**
     * 通知の表示
     * @param {string} message - メッセージ
     * @param {string} type - メッセージタイプ
     * @param {number} duration - 表示時間（ミリ秒）
     */
    showNotification(message, type = 'info', duration = 3000) {
        // 既存の通知を削除
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // 新しい通知を作成
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // スタイル設定
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: '1000',
            fontWeight: '500',
            maxWidth: '400px',
            wordWrap: 'break-word',
            animation: 'slideIn 0.3s ease'
        });

        // タイプ別のスタイル
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#d1fae5';
                notification.style.color = '#065f46';
                notification.style.border = '1px solid #a7f3d0';
                break;
            case 'error':
                notification.style.backgroundColor = '#fee2e2';
                notification.style.color = '#991b1b';
                notification.style.border = '1px solid #fca5a5';
                break;
            case 'warning':
                notification.style.backgroundColor = '#fef3c7';
                notification.style.color = '#92400e';
                notification.style.border = '1px solid #fcd34d';
                break;
            default:
                notification.style.backgroundColor = '#eff6ff';
                notification.style.color = '#1e40af';
                notification.style.border = '1px solid #bfdbfe';
        }

        // アニメーション用のスタイル
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // ドキュメントに追加
        document.body.appendChild(notification);

        // 指定時間後に自動削除
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            notification.addEventListener('animationend', () => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });

            // slideOutアニメーションの追加
            const slideOutStyle = document.createElement('style');
            slideOutStyle.textContent = `
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(slideOutStyle);
        }, duration);
    }

    /**
     * 初期化エラーの表示
     * @param {Error} error - エラーオブジェクト
     */
    showInitializationError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #ef4444;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            max-width: 500px;
            text-align: center;
        `;

        errorDiv.innerHTML = `
            <h2 style="color: #ef4444; margin-bottom: 16px;">初期化エラー</h2>
            <p style="margin-bottom: 20px; color: #374151;">${error.message}</p>
            <button onclick="location.reload()" style="
                background: #ef4444;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
            ">ページを再読み込み</button>
        `;

        document.body.appendChild(errorDiv);
    }

    /**
     * エラーレポート（実際のプロジェクトではサーバーに送信）
     * @param {Error} error - エラーオブジェクト
     */
    reportError(error) {
        const errorReport = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        console.log('Error Report:', errorReport);

        // 実際のプロジェクトではここでサーバーに送信
        // fetch('/api/errors', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(errorReport)
        // });
    }

    /**
     * アプリケーションのクリーンアップ
     */
    cleanup() {
        if (window.apiManager) {
            window.apiManager.cleanup();
        }
        console.log('アプリケーションをクリーンアップしました');
    }
}

// アプリケーションの起動
document.addEventListener('DOMContentLoaded', () => {
    window.flexiBoardApp = new FlexiBoardApp();
});

// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', () => {
    if (window.flexiBoardApp) {
        window.flexiBoardApp.cleanup();
    }
});
