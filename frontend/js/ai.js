/**
 * FlexiBoard AI Manager
 * AIプレイヤーの実装
 */

class AIManager {
    constructor() {
        this.difficulty = 'easy';
        this.thinkingDelay = 1000; // 思考時間（ミリ秒）
        this.isThinking = false;
    }

    /**
     * AIの難易度を設定
     * @param {string} difficulty - 難易度 ('easy', 'medium', 'hard')
     */
    setDifficulty(difficulty) {
        this.difficulty = difficulty;

        // 難易度に応じて思考時間を設定
        switch (difficulty) {
            case 'easy':
                this.thinkingDelay = 500;
                break;
            case 'medium':
                this.thinkingDelay = 1500;
                break;
            case 'hard':
                this.thinkingDelay = 2500;
                break;
            default:
                this.thinkingDelay = 1000;
        }
    }

    /**
     * AIの手を計算して実行
     * @param {Object} gameData - 現在のゲームデータ
     * @param {string} aiPlayer - AIプレイヤーのID
     * @returns {Promise<Object>} 移動結果
     */
    async makeMove(gameData, aiPlayer) {
        if (this.isThinking) {
            return { success: false, error: 'AI is already thinking' };
        }

        this.isThinking = true;

        try {
            // AI思考中のステータス表示
            this.showThinkingStatus();

            // 思考時間を待つ
            await this.delay(this.thinkingDelay);

            // 可能な手を取得
            const possibleMoves = this.getPossibleMoves(gameData, aiPlayer);

            if (possibleMoves.length === 0) {
                throw new Error('利用可能な手がありません');
            }

            // 難易度に応じて手を選択
            const selectedMove = this.selectMove(possibleMoves, gameData);

            // 手を表示
            this.showSelectedMove(selectedMove);

            // 移動を実行
            const result = await window.apiManager.makeMove(
                selectedMove.from,
                selectedMove.to,
                aiPlayer
            );

            return result;

        } catch (error) {
            console.error('AI move error:', error);
            return { success: false, error: error.message };
        } finally {
            this.isThinking = false;
            this.hideThinkingStatus();
        }
    }

    /**
     * 思考中のステータスを表示
     */
    showThinkingStatus() {
        const statusElement = document.getElementById('game-status');
        if (statusElement) {
            statusElement.className = 'game-status';
            statusElement.style.background = 'rgba(245, 158, 11, 0.1)';
            statusElement.style.color = '#92400e';
            statusElement.style.border = '1px solid rgba(245, 158, 11, 0.2)';
            statusElement.innerHTML = '🤖 <strong>AIが考えています...</strong><br>少々お待ちください';
        }
    }

    /**
     * 思考ステータスを非表示
     */
    hideThinkingStatus() {
        // 通常のゲームステータスに戻す
        if (window.gameManager) {
            window.gameManager.updateGameStatus();
        }
    }

    /**
     * 選択された手を表示
     * @param {Object} move - 選択された手
     */
    showSelectedMove(move) {
        const statusElement = document.getElementById('game-status');
        if (statusElement) {
            statusElement.innerHTML = `🤖 AIの手: [${move.from.join(',')}] → [${move.to.join(',')}]<br>実行中...`;
        }
    }

    /**
     * 可能な手の取得
     * @param {Object} gameData - ゲームデータ
     * @param {string} aiPlayer - AIプレイヤーID
     * @returns {Array} 可能な手の配列
     */
    getPossibleMoves(gameData, aiPlayer) {
        const moves = [];
        const { board, pieces } = gameData;

        // AIが所有する駒を取得
        const aiPieces = pieces.filter(piece => piece.owner === aiPlayer);

        aiPieces.forEach(piece => {
            const possibleMoves = this.calculatePossibleMoves(piece, board, pieces);
            possibleMoves.forEach(move => {
                moves.push({
                    piece: piece,
                    from: piece.position,
                    to: move
                });
            });
        });

        return moves;
    }

    /**
     * 駒の可能な移動を計算
     * @param {Object} piece - 駒オブジェクト
     * @param {Object} board - 盤面データ
     * @param {Array} allPieces - すべての駒
     * @returns {Array} 可能な移動先
     */
    calculatePossibleMoves(piece, board, allPieces) {
        const moves = [];
        const [x, y] = piece.position;
        const { type: boardType, size: boardSize } = board;
        const [width, height] = boardSize;

        // 移動パターンの定義
        const movePatterns = {
            'king': [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1],  [1, 0],  [1, 1]
            ],
            'pawn': piece.owner === 'player_1' ?
                [[0, 1]] : // player_1は下向き
                [[0, -1]], // player_2は上向き
            'explorer': [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1],  [1, 0],  [1, 1]
            ]
        };

        const pattern = movePatterns[piece.type] || movePatterns['king'];

        pattern.forEach(([dx, dy]) => {
            let newX = x + dx;
            let newY = y + dy;

            // quadsphereの場合の境界処理
            if (boardType === 'quadsphere') {
                newX = ((newX % width) + width) % width;
                newY = ((newY % height) + height) % height;
            }

            // 移動先が有効かチェック
            if (this.isValidMove(newX, newY, boardType, width, height, allPieces)) {
                moves.push([newX, newY]);
            }
        });

        return moves;
    }

    /**
     * 移動の有効性チェック
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {string} boardType - 盤面タイプ
     * @param {number} width - 盤面幅
     * @param {number} height - 盤面高さ
     * @param {Array} allPieces - すべての駒
     * @returns {boolean} 有効な移動かどうか
     */
    isValidMove(x, y, boardType, width, height, allPieces) {
        // 矩形盤面の場合の境界チェック
        if (boardType === 'rectangular') {
            if (x < 0 || x >= width || y < 0 || y >= height) {
                return false;
            }
        }

        // 他の駒との衝突チェック
        const occupyingPiece = allPieces.find(piece =>
            piece.position[0] === x && piece.position[1] === y
        );

        // 自分の駒がいる場合は移動不可
        if (occupyingPiece) {
            return false;
        }

        return true;
    }

    /**
     * 難易度に応じて手を選択
     * @param {Array} possibleMoves - 可能な手の配列
     * @param {Object} gameData - ゲームデータ
     * @returns {Object} 選択された手
     */
    selectMove(possibleMoves, gameData) {
        switch (this.difficulty) {
            case 'easy':
                return this.selectRandomMove(possibleMoves);

            case 'medium':
                return this.selectWeightedMove(possibleMoves, gameData);

            case 'hard':
                return this.selectStrategicMove(possibleMoves, gameData);

            default:
                return this.selectRandomMove(possibleMoves);
        }
    }

    /**
     * ランダムに手を選択（簡単）
     * @param {Array} moves - 可能な手の配列
     * @returns {Object} 選択された手
     */
    selectRandomMove(moves) {
        const randomIndex = Math.floor(Math.random() * moves.length);
        return moves[randomIndex];
    }

    /**
     * 重み付けで手を選択（中級）
     * @param {Array} moves - 可能な手の配列
     * @param {Object} gameData - ゲームデータ
     * @returns {Object} 選択された手
     */
    selectWeightedMove(moves, gameData) {
        // 優先度を計算
        const weightedMoves = moves.map(move => ({
            move: move,
            weight: this.calculateMoveWeight(move, gameData)
        }));

        // 重みに基づいて選択
        const totalWeight = weightedMoves.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;

        for (const item of weightedMoves) {
            random -= item.weight;
            if (random <= 0) {
                return item.move;
            }
        }

        return moves[0]; // フォールバック
    }

    /**
     * 戦略的に手を選択（上級）
     * @param {Array} moves - 可能な手の配列
     * @param {Object} gameData - ゲームデータ
     * @returns {Object} 選択された手
     */
    selectStrategicMove(moves, gameData) {
        // 最も高い評価値の手を選択
        let bestMove = moves[0];
        let bestScore = -Infinity;

        moves.forEach(move => {
            const score = this.evaluateMove(move, gameData);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        });

        return bestMove;
    }

    /**
     * 手の重みを計算
     * @param {Object} move - 移動データ
     * @param {Object} gameData - ゲームデータ
     * @returns {number} 重み
     */
    calculateMoveWeight(move, gameData) {
        let weight = 1;

        // 中央に近づくほど高評価
        const [x, y] = move.to;
        const centerDistance = Math.abs(x - 4) + Math.abs(y - 4);
        weight += (8 - centerDistance) * 0.1;

        // 特殊マスに移動する場合高評価
        const specialSquare = gameData.board.special_squares.find(sq =>
            sq.position[0] === x && sq.position[1] === y
        );

        if (specialSquare) {
            if (specialSquare.effect === 'bonus') {
                weight += 2;
            } else if (specialSquare.effect === 'teleport') {
                weight += 1.5;
            }
        }

        // 障害物を避ける
        const obstacle = gameData.board.obstacles.find(obs =>
            obs.position[0] === x && obs.position[1] === y
        );

        if (obstacle) {
            weight -= 3;
        }

        return Math.max(0.1, weight);
    }

    /**
     * 手の評価値計算
     * @param {Object} move - 移動データ
     * @param {Object} gameData - ゲームデータ
     * @returns {number} 評価値
     */
    evaluateMove(move, gameData) {
        let score = 0;

        // 基本スコア
        score += this.calculateMoveWeight(move, gameData);

        // より高度な評価（将来的に拡張可能）
        // - 敵駒への接近度
        // - 防御的な位置取り
        // - 勝利条件への寄与度

        return score;
    }

    /**
     * 遅延処理
     * @param {number} ms - 遅延時間（ミリ秒）
     * @returns {Promise} 遅延後のPromise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * AIが現在のターンかどうかチェック
     * @param {Object} gameData - ゲームデータ
     * @param {string} aiPlayer - AIプレイヤーID
     * @returns {boolean} AIのターンかどうか
     */
    isAiTurn(gameData, aiPlayer) {
        return gameData.state && gameData.state.turn === aiPlayer;
    }
}

// グローバルインスタンス
window.aiManager = new AIManager();
