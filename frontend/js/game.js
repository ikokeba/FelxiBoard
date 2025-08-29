/**
 * FlexiBoard Game Logic
 * ゲームのロジックと状態管理
 */

class GameManager {
    constructor() {
        this.currentGame = null;
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.boardElement = null;
        this.currentPlayer = null;
        this.players = [];
        this.gameHistory = [];
        this.isMyTurn = false;
        this.init();
    }

    /**
     * ゲームマネージャーの初期化
     */
    init() {
        this.boardElement = document.getElementById('game-board');
        this.bindEvents();
    }

    /**
     * イベントリスナーの設定
     */
    bindEvents() {
        // 盤面クリックイベントは盤面がレンダリングされた後に設定
    }

    /**
     * ゲームデータの設定
     * @param {Object} gameData - ゲームデータ
     */
    setGameData(gameData) {
        this.currentGame = gameData;
        this.players = gameData.players || [];
        this.gameHistory = gameData.state?.history || [];
        this.updateCurrentPlayer();
        this.renderBoard();
        this.updateGameInfo();

        // AIのターンになったら自動的にAIが手を打つ
        this.checkAndHandleAiTurn();
    }

    /**
     * 現在のプレイヤーの更新
     */
    updateCurrentPlayer() {
        if (this.currentGame && this.currentGame.state) {
            this.currentPlayer = this.currentGame.state.turn;

            // 自分のターンかどうかを判定（実際のゲームではユーザーIDが必要）
            // ここではデモとして、プレイヤー1のターンと仮定
            this.isMyTurn = this.currentPlayer === 'player_1';
        }
    }

    /**
     * ゲーム情報の更新
     */
    updateGameInfo() {
        // ターン情報の更新
        const turnElement = document.getElementById('current-turn');
        if (turnElement) {
            turnElement.textContent = this.currentPlayer || '不明';
            turnElement.style.fontWeight = this.isMyTurn ? 'bold' : 'normal';
            turnElement.style.color = this.isMyTurn ? '#2563eb' : '#666';
        }

        // ゲームステータスの更新
        this.updateGameStatus();

        // プレイヤーリストの更新
        this.updatePlayerList();

        // 履歴の更新
        this.updateHistory();
    }

    /**
     * ゲームステータスの更新
     */
    updateGameStatus() {
        const statusElement = document.getElementById('game-status');
        if (!statusElement) return;

        statusElement.className = 'game-status';

        if (!this.currentGame) {
            statusElement.classList.add('waiting');
            statusElement.textContent = 'ゲームデータを読み込み中...';
            return;
        }

        if (this.isMyTurn) {
            statusElement.classList.add('your-turn');
            statusElement.innerHTML = '🎯 <strong>あなたのターンです</strong><br>駒をクリックして移動してください';
        } else {
            statusElement.classList.add('opponent-turn');
            statusElement.innerHTML = `⏳ ${this.currentPlayer}のターンです<br>相手の手を待っています...`;
        }

        // ゲーム終了判定（簡易）
        if (this.currentGame.state && this.currentGame.state.game_over) {
            statusElement.className = 'game-status';
            statusElement.style.background = 'rgba(16, 185, 129, 0.1)';
            statusElement.style.color = '#065f46';
            statusElement.style.border = '1px solid rgba(16, 185, 129, 0.2)';
            statusElement.innerHTML = '🏆 <strong>ゲーム終了</strong><br>勝者: ' + (this.currentGame.state.winner || '不明');
        }
    }

    /**
     * プレイヤーリストの更新
     */
    updatePlayerList() {
        const playersUl = document.getElementById('players-ul');
        if (!playersUl) return;

        playersUl.innerHTML = '';

        this.players.forEach(player => {
            const li = document.createElement('li');
            const isCurrentPlayer = player.id === this.currentPlayer;
            const isLocalPlayer = player.id === 'player_1'; // デモ用

            li.innerHTML = `
                <span class="${isCurrentPlayer ? 'current-player' : ''} ${isLocalPlayer ? 'local-player' : ''}">
                    ${player.id} (${player.type})
                </span>
                ${isCurrentPlayer ? '<span class="turn-indicator">🔄</span>' : ''}
                ${isLocalPlayer ? '<span class="you-indicator">(あなた)</span>' : ''}
            `;

            // 現在のプレイヤーのスタイル
            if (isCurrentPlayer) {
                li.style.borderLeft = '3px solid #2563eb';
                li.style.backgroundColor = 'rgba(37, 99, 235, 0.05)';
            }

            playersUl.appendChild(li);
        });
    }

    /**
     * ゲーム履歴の更新
     */
    updateHistory() {
        const historyContainer = document.getElementById('history-container');
        if (!historyContainer) return;

        historyContainer.innerHTML = '';

        if (this.gameHistory.length === 0) {
            historyContainer.innerHTML = '<div class="history-item" style="color: #666; font-style: italic;">まだ手がありません</div>';
            return;
        }

        this.gameHistory.forEach((move, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            const moveNumber = index + 1;
            const player = move.player || '不明';
            const from = move.from ? `[${move.from.join(',')}]` : '不明';
            const to = move.to ? `[${move.to.join(',')}]` : '不明';

            historyItem.innerHTML = `
                <span class="move-number">${moveNumber}.</span>
                <span class="move-player">${player}</span>
                <span class="move-detail">${from} → ${to}</span>
                ${player === 'player_1' ? '<span class="your-move">(あなたの着手)</span>' : ''}
            `;

            historyContainer.appendChild(historyItem);
        });

        // 最新の着手までスクロール
        historyContainer.scrollTop = historyContainer.scrollHeight;
    }

    /**
     * 盤面のレンダリング
     */
    renderBoard() {
        if (!this.currentGame || !this.boardElement) return;

        const { board, pieces } = this.currentGame;
        const { type: boardType, size: boardSize, special_squares: specialSquares, obstacles } = board;

        this.boardElement.innerHTML = '';

        if (boardType === 'rectangular') {
            this.renderRectangularBoard(boardSize, pieces, specialSquares, obstacles);
        } else if (boardType === 'quadsphere') {
            this.renderQuadsphereBoard(boardSize, pieces, specialSquares, obstacles);
        }
    }

    /**
     * 矩形盤面のレンダリング
     * @param {Array} boardSize - 盤面サイズ [width, height]
     * @param {Array} pieces - 駒の配列
     * @param {Array} specialSquares - 特殊マスの配列
     * @param {Array} obstacles - 障害物の配列
     */
    renderRectangularBoard(boardSize, pieces, specialSquares, obstacles) {
        const [width, height] = boardSize;

        // 盤面コンテナの作成
        const boardContainer = document.createElement('div');
        boardContainer.className = 'board-container';
        boardContainer.style.display = 'grid';
        boardContainer.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
        boardContainer.style.gap = '2px';
        boardContainer.style.maxWidth = '600px';
        boardContainer.style.margin = '0 auto';

        // 盤面のマス目を生成
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const square = this.createSquare(x, y, pieces, specialSquares, obstacles);
                boardContainer.appendChild(square);
            }
        }

        this.boardElement.appendChild(boardContainer);

        // 盤面情報の表示
        const infoDiv = document.createElement('div');
        infoDiv.style.marginTop = '20px';
        infoDiv.style.textAlign = 'center';
        infoDiv.style.fontSize = '14px';
        infoDiv.style.color = '#666';
        infoDiv.innerHTML = `
            <p>矩形盤面 (${width}×${height})</p>
            <p>クリックで駒を選択・移動</p>
        `;
        this.boardElement.appendChild(infoDiv);
    }

    /**
     * クアッドスフィア盤面のレンダリング
     * @param {Array} boardSize - 盤面サイズ [width, height]
     * @param {Array} pieces - 駒の配列
     * @param {Array} specialSquares - 特殊マスの配列
     * @param {Array} obstacles - 障害物の配列
     */
    renderQuadsphereBoard(boardSize, pieces, specialSquares, obstacles) {
        const [width, height] = boardSize;

        // 盤面コンテナの作成
        const boardContainer = document.createElement('div');
        boardContainer.className = 'board-container quadsphere';
        boardContainer.style.display = 'grid';
        boardContainer.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
        boardContainer.style.gap = '1px';
        boardContainer.style.maxWidth = '600px';
        boardContainer.style.margin = '0 auto';
        boardContainer.style.border = '3px solid #2196f3';
        boardContainer.style.borderRadius = '8px';
        boardContainer.style.padding = '10px';
        boardContainer.style.background = '#e3f2fd';

        // 盤面のマス目を生成
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const square = this.createSquare(x, y, pieces, specialSquares, obstacles);
                boardContainer.appendChild(square);
            }
        }

        this.boardElement.appendChild(boardContainer);

        // 盤面情報の表示
        const infoDiv = document.createElement('div');
        infoDiv.style.marginTop = '20px';
        infoDiv.style.textAlign = 'center';
        infoDiv.style.fontSize = '14px';
        infoDiv.style.color = '#666';
        infoDiv.innerHTML = `
            <p>クアッドスフィア盤面 (${width}×${height})</p>
            <p>境界が接続される球面状の盤面</p>
            <p>クリックで駒を選択・移動</p>
        `;
        this.boardElement.appendChild(infoDiv);
    }

    /**
     * 盤面のマスを作成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {Array} pieces - 駒の配列
     * @param {Array} specialSquares - 特殊マスの配列
     * @param {Array} obstacles - 障害物の配列
     * @returns {HTMLElement} マスの要素
     */
    createSquare(x, y, pieces, specialSquares, obstacles) {
        const square = document.createElement('div');
        square.className = 'board-square';
        square.dataset.x = x;
        square.dataset.y = y;

        // 基本スタイル
        square.style.width = '50px';
        square.style.height = '50px';
        square.style.border = '1px solid #ccc';
        square.style.display = 'flex';
        square.style.alignItems = 'center';
        square.style.justifyContent = 'center';
        square.style.cursor = 'pointer';
        square.style.position = 'relative';
        square.style.fontSize = '20px';
        square.style.fontWeight = 'bold';
        square.style.transition = 'all 0.2s ease';

        // チェッカーパターン
        const isLight = (x + y) % 2 === 0;
        square.style.backgroundColor = isLight ? '#f0f0f0' : '#ddd';

        // 特殊マスのチェック
        const isSpecial = specialSquares.some(sq =>
            sq.position[0] === x && sq.position[1] === y
        );

        if (isSpecial) {
            square.style.backgroundColor = '#fff3cd';
            square.style.border = '2px solid #ffc107';
            square.innerHTML = '★';
            square.title = '特殊マス';
        }

        // 障害物のチェック
        const isObstacle = obstacles.some(obs =>
            obs.position[0] === x && obs.position[1] === y
        );

        if (isObstacle) {
            square.style.backgroundColor = '#dc3545';
            square.style.color = 'white';
            square.innerHTML = '■';
            square.title = '障害物';
            square.style.cursor = 'not-allowed';
        }

        // 駒のチェックと配置
        const piece = pieces.find(p =>
            p.position[0] === x && p.position[1] === y
        );

        if (piece) {
            square.innerHTML = this.getPieceSymbol(piece.type);
            square.style.color = piece.owner === 'player_1' ? '#2563eb' : '#dc2626';
            square.title = `${piece.type} (${piece.owner})`;
            square.classList.add('has-piece');

            // 選択中の駒の場合
            if (this.selectedPiece &&
                this.selectedPiece.position[0] === x &&
                this.selectedPiece.position[1] === y) {
                square.style.boxShadow = '0 0 0 3px #2563eb';
            }
        }

        // 可能な移動先の場合
        const isPossibleMove = this.possibleMoves.some(move =>
            move[0] === x && move[1] === y
        );

        if (isPossibleMove) {
            square.style.backgroundColor = '#d1fae5';
            square.style.border = '2px dashed #10b981';
            square.innerHTML = '○';
        }

        // クリックイベント
        square.addEventListener('click', () => {
            this.handleSquareClick(x, y, piece);
        });

        return square;
    }

    /**
     * 駒のシンボルを取得
     * @param {string} pieceType - 駒のタイプ
     * @returns {string} 駒のシンボル
     */
    getPieceSymbol(pieceType) {
        const symbols = {
            'king': '♔',
            'queen': '♕',
            'rook': '♖',
            'bishop': '♗',
            'knight': '♘',
            'pawn': '♙',
            'explorer': '⚔',
            'warrior': '⚒',
            'archer': '🏹',
            'mage': '⚡'
        };

        return symbols[pieceType] || pieceType.charAt(0).toUpperCase();
    }

    /**
     * マスクリックの処理
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {Object} piece - クリックされたマスの駒
     */
    handleSquareClick(x, y, piece) {
        // 障害物があるマスは無視
        const isObstacle = this.currentGame.board.obstacles.some(obs =>
            obs.position[0] === x && obs.position[1] === y
        );

        if (isObstacle) return;

        if (this.selectedPiece) {
            // 移動先が選択された場合
            if (this.isValidMove(x, y)) {
                this.executeMove(x, y);
            } else {
                // 別の駒が選択された場合
                if (piece && piece.owner === this.currentGame.state.turn) {
                    this.selectPiece(piece);
                } else {
                    this.clearSelection();
                }
            }
        } else {
            // 駒が選択されていない場合
            if (piece && piece.owner === this.currentGame.state.turn) {
                this.selectPiece(piece);
            }
        }
    }

    /**
     * 駒の選択
     * @param {Object} piece - 選択する駒
     */
    selectPiece(piece) {
        this.selectedPiece = piece;
        this.possibleMoves = this.calculatePossibleMoves(piece);
        this.renderBoard();

        console.log(`Piece selected: ${piece.type} at [${piece.position.join(',')}]`);
    }

    /**
     * 選択のクリア
     */
    clearSelection() {
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.renderBoard();
    }

    /**
     * 可能な移動の計算
     * @param {Object} piece - 計算対象の駒
     * @returns {Array} 可能な移動先の座標配列
     */
    calculatePossibleMoves(piece) {
        const moves = [];
        const [x, y] = piece.position;
        const { type: boardType, size: boardSize } = this.currentGame.board;
        const [width, height] = boardSize;

        // 簡易的な移動ロジック（実際のプロジェクトでは詳細なルールを実装）
        switch (piece.type) {
            case 'king':
                // 隣接8マス
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const newX = x + dx;
                        const newY = y + dy;

                        if (this.isValidPosition(newX, newY, boardType, width, height)) {
                            moves.push([newX, newY]);
                        }
                    }
                }
                break;

            case 'pawn':
                // 前進のみ
                const direction = piece.owner === 'player_1' ? 1 : -1;
                const newY = y + direction;

                if (this.isValidPosition(x, newY, boardType, width, height)) {
                    moves.push([x, newY]);
                }
                break;

            case 'explorer':
                // クアッドスフィア用：隣接4マス + 境界越え
                const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
                directions.forEach(([dx, dy]) => {
                    let newX = x + dx;
                    let newY = y + dy;

                    if (boardType === 'quadsphere') {
                        newX = ((newX % width) + width) % width;
                        newY = ((newY % height) + height) % height;
                    }

                    if (this.isValidPosition(newX, newY, boardType, width, height)) {
                        moves.push([newX, newY]);
                    }
                });
                break;

            default:
                // デフォルト：隣接マス
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const newX = x + dx;
                        const newY = y + dy;

                        if (this.isValidPosition(newX, newY, boardType, width, height)) {
                            moves.push([newX, newY]);
                        }
                    }
                }
        }

        return moves;
    }

    /**
     * 位置の有効性チェック
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {string} boardType - 盤面タイプ
     * @param {number} width - 盤面幅
     * @param {number} height - 盤面高さ
     * @returns {boolean} 有効な位置かどうか
     */
    isValidPosition(x, y, boardType, width, height) {
        if (boardType === 'rectangular') {
            return x >= 0 && x < width && y >= 0 && y < height;
        } else if (boardType === 'quadsphere') {
            // クアッドスフィアでは常に有効（境界は自動的にラップ）
            return true;
        }
        return false;
    }

    /**
     * 移動の有効性チェック
     * @param {number} x - 移動先X座標
     * @param {number} y - 移動先Y座標
     * @returns {boolean} 有効な移動かどうか
     */
    isValidMove(x, y) {
        return this.possibleMoves.some(move => move[0] === x && move[1] === y);
    }

    /**
     * 移動の実行
     * @param {number} x - 移動先X座標
     * @param {number} y - 移動先Y座標
     */
    async executeMove(x, y) {
        if (!this.selectedPiece) return;

        const fromPos = this.selectedPiece.position;
        const toPos = [x, y];
        const player = this.selectedPiece.owner;

        try {
            const result = await window.apiManager.makeMove(fromPos, toPos, player);

            if (result.success) {
                console.log('Move executed successfully');
                // 楽観的更新（WS未接続時も即時反映する）
                if (this.currentGame && Array.isArray(this.currentGame.pieces)) {
                    const idx = this.currentGame.pieces.findIndex(p =>
                        p.position[0] === fromPos[0] && p.position[1] === fromPos[1] && p.owner === player && p.type === this.selectedPiece.type
                    );
                    if (idx !== -1) {
                        this.currentGame.pieces[idx].position = toPos;
                    }
                }
                // 履歴の更新
                this.gameHistory.push({ from: fromPos, to: toPos, player });
                if (this.currentGame && this.currentGame.state) {
                    this.currentGame.state.history = this.gameHistory;
                    this.currentGame.state.turn = this.currentGame.state.turn === 'player_1' ? 'player_2' : 'player_1';
                }
                // UI更新
                this.clearSelection();
                this.updateCurrentPlayer();
                this.renderBoard();
                this.updateGameInfo();
                // AI手番
                setTimeout(() => this.checkAndHandleAiTurn(), 200);
            } else {
                console.error('Move failed:', result.error);
                alert(`移動に失敗しました: ${result.error}`);
            }

        } catch (error) {
            console.error('Move execution error:', error);
            alert(`移動中にエラーが発生しました: ${error.message}`);
        }
    }

    /**
     * ゲーム状態の更新
     * @param {Object} newGameData - 新しいゲームデータ
     */
    updateGameState(newGameData) {
        this.currentGame = newGameData;
        this.renderBoard();
    }

    /**
     * AIのターンをチェックして処理
     */
    async checkAndHandleAiTurn() {
        if (!this.currentGame || !window.aiManager) return;

        // AIが有効かどうかチェック
        const aiEnabledCheckbox = document.getElementById('enable-ai');
        if (!aiEnabledCheckbox || !aiEnabledCheckbox.checked) return;

        // 現在のプレイヤーがAIかどうかチェック
        const aiPlayerName = document.getElementById('ai-player-name')?.value || 'AI Player';
        const isAiTurn = this.currentPlayer === 'player_2'; // デモとしてplayer_2をAIとする

        if (isAiTurn) {
            console.log('AIのターンです。AIが手を考えています...');

            try {
                // AIに手を実行させる
                const result = await window.aiManager.makeMove(this.currentGame, 'player_2');

                if (result.success) {
                    console.log('AIの手が実行されました');
                    // ゲーム状態はWebSocket経由で更新される
                } else {
                    console.error('AIの手実行に失敗:', result.error);
                }

            } catch (error) {
                console.error('AI turn handling error:', error);
            }
        }
    }

    /**
     * ゲーム状態の更新（WebSocket経由）
     * @param {Object} newGameData - 新しいゲームデータ
     */
    handleGameStateUpdate(newGameData) {
        if (!newGameData) return;

        // ゲームデータを更新
        this.setGameData(newGameData);

        // 移動履歴が更新された場合
        if (newGameData.state?.history) {
            this.gameHistory = newGameData.state.history;
            this.updateHistory();
        }

        // ターン交代時の処理
        const previousTurn = this.currentPlayer;
        this.updateCurrentPlayer();

        // ターン交代があった場合、AIのターンチェック
        if (previousTurn !== this.currentPlayer) {
            setTimeout(() => {
                this.checkAndHandleAiTurn();
            }, 500); // 少し遅延して処理
        }
    }

    /**
     * ゲームのリセット
     */
    resetGame() {
        this.selectedPiece = null;
        this.possibleMoves = [];
        // 実際のリセット処理はAPI経由で行う
    }
}

// グローバルインスタンス
window.gameManager = new GameManager();
