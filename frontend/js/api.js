/**
 * FlexiBoard API Manager
 * バックエンドAPIとの通信管理
 */

class APIManager {
    constructor() {
        this.baseURL = 'http://localhost:8001/api';
        this.socket = null;
        this.gameState = null;
        this.currentGameId = null;
    }

    /**
     * APIリクエストの共通処理
     * @param {string} endpoint - APIエンドポイント
     * @param {Object} options - fetchオプション
     * @returns {Promise<Object>} レスポンスデータ
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, finalOptions);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    /**
     * ヘルスチェック
     * @returns {Promise<Object>} ヘルスチェック結果
     */
    async healthCheck() {
        return await this.request('/health');
    }

    /**
     * 設定の検証
     * @returns {Promise<Object>} 検証結果
     */
    async validateConfig() {
        try {
            const configData = window.configManager.prepareForAPI();

            const result = {
                success: true,
                errors: [],
                warnings: []
            };

            // 必須フィールドのチェック
            const requiredFields = ['board_yaml', 'pieces_yaml', 'rules_yaml'];
            for (const field of requiredFields) {
                if (!configData[field] || configData[field].trim() === '') {
                    result.errors.push(`${field.replace('_yaml', '')}設定が空です`);
                    result.success = false;
                }
            }

            if (!result.success) {
                return result;
            }

            // YAML構文の詳細チェック
            for (const [key, value] of Object.entries(configData)) {
                const yamlCheck = this.validateYAMLContent(value, key.replace('_yaml', ''));
                if (!yamlCheck.valid) {
                    result.errors.push(...yamlCheck.errors);
                    result.success = false;
                }
                if (yamlCheck.warnings.length > 0) {
                    result.warnings.push(...yamlCheck.warnings);
                }
            }

            // 設定内容の整合性チェック
            const contentCheck = this.validateConfigConsistency(configData);
            if (!contentCheck.valid) {
                result.errors.push(...contentCheck.errors);
                result.success = false;
            }
            if (contentCheck.warnings.length > 0) {
                result.warnings.push(...contentCheck.warnings);
            }

            return result;

        } catch (error) {
            return {
                success: false,
                errors: [error.message],
                warnings: []
            };
        }
    }

    /**
     * YAML内容の詳細検証
     * @param {string} yamlContent - YAML内容
     * @param {string} contentType - コンテンツタイプ ('board', 'pieces', 'rules')
     * @returns {Object} 検証結果
     */
    validateYAMLContent(yamlContent, contentType) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };

        try {
            if (!yamlContent || yamlContent.trim() === '') {
                result.valid = false;
                result.errors.push(`${contentType}設定が空です`);
                return result;
            }

            const lines = yamlContent.split('\n');
            let indentStack = [];
            let currentIndent = 0;
            let inArray = false;
            let arrayIndent = -1;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const lineNum = i + 1;
                const trimmedLine = line.trim();

                // 空行やコメントはスキップ
                if (!trimmedLine || trimmedLine.startsWith('#')) {
                    continue;
                }

                // インデントのチェック
                const indent = line.length - line.trimStart().length;

                // インデントの整合性チェック
                if (indent > 0 && (indent % 2) !== 0) {
                    result.warnings.push(`行${lineNum}: インデントは2スペース単位で統一してください`);
                }

                // キーと値の分離
                const colonIndex = trimmedLine.indexOf(':');
                if (colonIndex > 0) {
                    const key = trimmedLine.substring(0, colonIndex).trim();
                    const value = trimmedLine.substring(colonIndex + 1).trim();

                    // キーの有効性チェック
                    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
                        result.errors.push(`行${lineNum}: 無効なキー名 '${key}' です`);
                        result.valid = false;
                    }

                    // 値のチェック
                    if (value === '') {
                        // ネストされたオブジェクトの開始
                        indentStack.push(indent);
                        currentIndent = indent;
                    } else {
                        // 値の検証
                        if (value.startsWith('"') && !value.endsWith('"') && !value.includes('": ')) {
                            result.errors.push(`行${lineNum}: 引用符が閉じられていません`);
                            result.valid = false;
                        }

                        if (value.includes('${') && !value.includes('}')) {
                            result.warnings.push(`行${lineNum}: 変数参照が閉じられていない可能性があります`);
                        }
                    }

                } else if (trimmedLine.startsWith('-')) {
                    // 配列要素
                    if (!inArray) {
                        inArray = true;
                        arrayIndent = indent;
                    } else if (indent !== arrayIndent) {
                        result.errors.push(`行${lineNum}: 配列要素のインデントが不統一です`);
                        result.valid = false;
                    }

                    const itemValue = trimmedLine.substring(1).trim();
                    if (itemValue.startsWith('{') && !itemValue.endsWith('}')) {
                        result.warnings.push(`行${lineNum}: オブジェクトの波括弧が閉じられていない可能性があります`);
                    }

                } else {
                    // 不正な行
                    result.errors.push(`行${lineNum}: 不正なYAML構文です`);
                    result.valid = false;
                }
            }

            // コンテンツタイプ固有のチェック
            this.validateContentSpecific(yamlContent, contentType, result);

        } catch (error) {
            result.valid = false;
            result.errors.push(`YAML解析エラー: ${error.message}`);
        }

        return result;
    }

    /**
     * コンテンツタイプ固有の検証
     * @param {string} yamlContent - YAML内容
     * @param {string} contentType - コンテンツタイプ
     * @param {Object} result - 検証結果オブジェクト
     */
    validateContentSpecific(yamlContent, contentType, result) {
        const content = yamlContent.toLowerCase();

        switch (contentType) {
            case 'board':
                // 盤面設定の必須項目チェック
                if (!content.includes('board_type')) {
                    result.errors.push('board_type が定義されていません');
                    result.valid = false;
                }
                if (!content.includes('board_size')) {
                    result.errors.push('board_size が定義されていません');
                    result.valid = false;
                }
                // 盤面タイプの妥当性チェック
                if (content.includes('board_type') &&
                    !content.includes('rectangular') &&
                    !content.includes('quadsphere')) {
                    result.warnings.push('未知の盤面タイプが指定されています');
                }
                break;

            case 'pieces':
                // 駒設定の必須項目チェック
                if (!content.includes('piece_types')) {
                    result.errors.push('piece_types が定義されていません');
                    result.valid = false;
                }
                if (!content.includes('initial_positions')) {
                    result.errors.push('initial_positions が定義されていません');
                    result.valid = false;
                }
                // 駒の移動パターンチェック
                if (content.includes('movement') &&
                    !content.includes('adjacent') &&
                    !content.includes('knight') &&
                    !content.includes('forward') &&
                    !content.includes('custom')) {
                    result.warnings.push('未知の移動パターンが指定されています');
                }
                break;

            case 'rules':
                // ルール設定の必須項目チェック
                if (!content.includes('turn_system')) {
                    result.errors.push('turn_system が定義されていません');
                    result.valid = false;
                }
                if (!content.includes('victory_conditions')) {
                    result.errors.push('victory_conditions が定義されていません');
                    result.valid = false;
                }
                // ターンシステムの妥当性チェック
                if (content.includes('turn_system') && !content.includes('alternate')) {
                    result.warnings.push('未知のターンシステムが指定されています');
                }
                break;
        }
    }

    /**
     * 設定内容の整合性チェック
     * @param {Object} configData - 設定データ
     * @returns {Object} 整合性チェック結果
     */
    validateConfigConsistency(configData) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };

        try {
            // board設定の解析
            const boardParsed = window.configManager.parseYAML(configData.board_yaml);
            const piecesParsed = window.configManager.parseYAML(configData.pieces_yaml);
            const rulesParsed = window.configManager.parseYAML(configData.rules_yaml);

            // 盤面サイズの整合性チェック
            if (boardParsed.board_size && piecesParsed.initial_positions) {
                const [boardWidth, boardHeight] = boardParsed.board_size;
                const boardType = boardParsed.board_type || 'rectangular';

                // 初期配置の位置チェック
                for (const [playerId, pieces] of Object.entries(piecesParsed.initial_positions)) {
                    for (const piece of pieces) {
                        const [x, y] = piece.position;

                        if (boardType === 'rectangular') {
                            if (x < 0 || x >= boardWidth || y < 0 || y >= boardHeight) {
                                result.errors.push(`${playerId}の駒 ${piece.type} の初期位置 [${x}, ${y}] が盤面範囲外です`);
                                result.valid = false;
                            }
                        }
                        // quadsphereの場合は境界チェックをスキップ（自動ラップ）
                    }
                }
            }

            // 勝利条件と駒タイプの整合性チェック
            if (rulesParsed.victory_conditions && piecesParsed.piece_types) {
                const availablePieceTypes = piecesParsed.piece_types.map(pt => pt.name);

                for (const condition of rulesParsed.victory_conditions) {
                    if (condition.type === 'capture_king' && condition.value) {
                        if (!availablePieceTypes.includes(condition.value)) {
                            result.errors.push(`勝利条件で指定された駒タイプ '${condition.value}' が存在しません`);
                            result.valid = false;
                        }
                    }
                }
            }

            // 昇格設定の整合性チェック
            if (piecesParsed.piece_types) {
                const pieceTypeNames = piecesParsed.piece_types.map(pt => pt.name);

                for (const pieceType of piecesParsed.piece_types) {
                    if (pieceType.promotion && pieceType.promotion.new_type) {
                        if (!pieceTypeNames.includes(pieceType.promotion.new_type)) {
                            result.errors.push(`昇格先の駒タイプ '${pieceType.promotion.new_type}' が存在しません`);
                            result.valid = false;
                        }
                    }
                }
            }

            // プレイヤー数の整合性チェック
            if (rulesParsed.players && rulesParsed.players.number) {
                const playerCount = rulesParsed.players.number;
                if (piecesParsed.initial_positions) {
                    const actualPlayers = Object.keys(piecesParsed.initial_positions).length;
                    if (actualPlayers !== playerCount) {
                        result.warnings.push(`設定されたプレイヤー数(${playerCount})と初期配置のプレイヤー数(${actualPlayers})が一致しません`);
                    }
                }
            }

        } catch (error) {
            result.valid = false;
            result.errors.push(`整合性チェックエラー: ${error.message}`);
        }

        return result;
    }

    /**
     * ゲームの作成
     * @returns {Promise<Object>} ゲーム作成結果
     */
    async createGame() {
        try {
            const configData = window.configManager.prepareForAPI();
            const response = await this.request('/games', {
                method: 'POST',
                body: JSON.stringify(configData)
            });

            if (response.game_id) {
                this.currentGameId = response.game_id;
                return {
                    success: true,
                    gameId: response.game_id
                };
            } else {
                return {
                    success: false,
                    error: response.errors || 'ゲーム作成に失敗しました'
                };
            }

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * ゲームへの参加
     * @param {string} gameId - 参加するゲームID
     * @returns {Promise<Object>} 参加結果
     */
    async joinGame(gameId) {
        try {
            const response = await this.request(`/games/${gameId}`);

            if (response.game_id) {
                this.currentGameId = gameId;
                this.gameState = response;

                // WebSocket接続の初期化
                this.initWebSocket(gameId);

                return {
                    success: true,
                    gameData: response
                };
            } else {
                return {
                    success: false,
                    error: 'ゲームが見つかりません'
                };
            }

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * WebSocket接続の初期化
     * @param {string} gameId - ゲームID
     */
    initWebSocket(gameId) {
        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io('http://localhost:8001');

        this.socket.on('connect', () => {
            console.log('WebSocket connected');
            this.socket.emit('join', { game_id: gameId });
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });

        this.socket.on('update', (data) => {
            console.log('Game state updated:', data);
            this.handleGameUpdate(data);

            // ゲームマネージャーに状態更新を通知
            if (window.gameManager) {
                window.gameManager.handleGameStateUpdate(data);
            }
        });

        this.socket.on('error', (data) => {
            console.error('WebSocket error:', data);
            this.handleError(data);
        });
    }

    /**
     * ゲーム状態の更新を処理
     * @param {Object} data - 更新データ
     */
    handleGameUpdate(data) {
        if (data.state) {
            this.gameState = { ...this.gameState, ...data.state };
            this.updateUI();
        }
    }

    /**
     * エラーハンドリング
     * @param {Object} data - エラーデータ
     */
    handleError(data) {
        console.error('Game error:', data);
        alert(`エラーが発生しました: ${data.message || 'Unknown error'}`);
    }

    /**
     * UIの更新
     */
    updateUI() {
        if (!this.gameState) return;

        // ターン情報の更新
        const turnElement = document.getElementById('current-turn');
        if (turnElement && this.gameState.state) {
            turnElement.textContent = this.gameState.state.turn || '不明';
        }

        // プレイヤーリストの更新
        const playersUl = document.getElementById('players-ul');
        if (playersUl && this.gameState.players) {
            playersUl.innerHTML = '';
            this.gameState.players.forEach(player => {
                const li = document.createElement('li');
                li.textContent = `${player.id} (${player.type})`;
                playersUl.appendChild(li);
            });
        }

        // 移動履歴の更新
        const historyContainer = document.getElementById('history-container');
        if (historyContainer && this.gameState.state && this.gameState.state.history) {
            historyContainer.innerHTML = '';
            this.gameState.state.history.forEach((move, index) => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.textContent = `${index + 1}. ${move.player}: [${move.from.join(',')}] → [${move.to.join(',')}]`;
                historyContainer.appendChild(historyItem);
            });
        }
    }

    /**
     * 駒の移動
     * @param {Array} fromPos - 移動元の位置 [x, y]
     * @param {Array} toPos - 移動先の位置 [x, y]
     * @param {string} player - プレイヤーID
     * @returns {Promise<Object>} 移動結果
     */
    async makeMove(fromPos, toPos, player) {
        try {
            const response = await this.request(`/games/${this.currentGameId}/move`, {
                method: 'POST',
                body: JSON.stringify({
                    from: fromPos,
                    to: toPos,
                    player: player
                })
            });

            return {
                success: true,
                data: response
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * ゲーム状態の取得
     * @param {string} gameId - ゲームID
     * @returns {Promise<Object>} ゲーム状態
     */
    async getGameState(gameId) {
        return await this.request(`/games/${gameId}`);
    }

    /**
     * 接続のクリーンアップ
     */
    cleanup() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.gameState = null;
        this.currentGameId = null;
    }
}

// グローバルインスタンス
window.apiManager = new APIManager();
