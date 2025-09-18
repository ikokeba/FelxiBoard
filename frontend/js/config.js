/**
 * FlexiBoard Configuration Management
 * 設定ファイルの管理とテンプレート提供
 */

class ConfigManager {
    constructor() {
        this.templates = {
            rectangular: {
                board: `# 矩形盤面設定（将棋 vs チェス）
board_type: "rectangular"
board_size: [9, 9]
special_squares: []
obstacles: []
`,
                pieces: `# 駒設定（将棋 vs チェス）
piece_types:
  # Chess side
  - name: "chess_king"
    movement: "adjacent"
    special_moves: []
    promotion: null
    icon: "♔"
  - name: "chess_queen"
    movement: "custom"
    special_moves: []
    promotion: null
    icon: "♕"
  - name: "chess_rook"
    movement: "horizontal_vertical_unlimited"
    special_moves: []
    promotion: null
    icon: "♖"
  - name: "chess_bishop"
    movement: "diagonal_unlimited"
    special_moves: []
    promotion: null
    icon: "♗"
  - name: "chess_knight"
    movement: "knight"
    special_moves: []
    promotion: null
    icon: "♘"
  - name: "chess_pawn"
    movement: "forward_1"
    special_moves: []
    promotion:
      new_type: "chess_queen"
      zone: "enemy_back_row"
    icon: "♙"

  # Shogi side
  - name: "shogi_king"
    movement: "adjacent"
    special_moves: []
    promotion: null
    icon: "王"
  - name: "shogi_gold"
    movement: [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, 1], [1, 1]]
    special_moves: []
    promotion: null
    icon: "金"
  - name: "shogi_silver"
    movement: [[-1, -1], [0, -1], [1, -1], [-1, 1], [1, 1]]
    special_moves: []
    promotion: null
    icon: "銀"
  - name: "shogi_knight"
    movement: [[-1, -2], [1, -2]]
    special_moves: []
    promotion: null
    icon: "桂"
  - name: "shogi_lance"
    movement: "custom"
    special_moves: []
    promotion: null
    icon: "香"
  - name: "shogi_bishop"
    movement: "diagonal_unlimited"
    special_moves: []
    promotion: null
    icon: "角"
  - name: "shogi_rook"
    movement: "horizontal_vertical_unlimited"
    special_moves: []
    promotion: null
    icon: "飛"
  - name: "shogi_pawn"
    movement: "forward_1"
    special_moves: []
    promotion:
      new_type: "shogi_tokkin"
      zone: "enemy_back_row"
    icon: "歩"
  - name: "shogi_tokkin"
    movement: [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, 1], [1, 1]]
    special_moves: []
    promotion: null
    icon: "と"

initial_positions:
  # Player 1: Chess (bottom, y increasing upward)
  player_1:
    - type: "chess_rook"   
      position: [0, 0]
      promoted: false
    - type: "chess_knight"
      position: [1, 0]
      promoted: false
    - type: "chess_bishop"
      position: [2, 0]
      promoted: false
    - type: "chess_queen"
      position: [3, 0]
      promoted: false
    - type: "chess_king"
      position: [4, 0]
      promoted: false
    - type: "chess_bishop"
      position: [5, 0]
      promoted: false
    - type: "chess_knight"
      position: [6, 0]
      promoted: false
    - type: "chess_rook"
      position: [7, 0]
      promoted: false
    - type: "chess_pawn"
      position: [0, 1]
      promoted: false
    - type: "chess_pawn"
      position: [1, 1]
      promoted: false
    - type: "chess_pawn"
      position: [2, 1]
      promoted: false
    - type: "chess_pawn"
      position: [3, 1]
      promoted: false
    - type: "chess_pawn"
      position: [4, 1]
      promoted: false
    - type: "chess_pawn"
      position: [5, 1]
      promoted: false
    - type: "chess_pawn"
      position: [6, 1]
      promoted: false
    - type: "chess_pawn"
      position: [7, 1]
      promoted: false

  # Player 2: Shogi (top)
  player_2:
    - type: "shogi_lance"
      position: [0, 8]
      promoted: false
    - type: "shogi_knight"
      position: [1, 8]
      promoted: false
    - type: "shogi_silver"
      position: [2, 8]
      promoted: false
    - type: "shogi_gold"
      position: [3, 8]
      promoted: false
    - type: "shogi_king"
      position: [4, 8]
      promoted: false
    - type: "shogi_gold"
      position: [5, 8]
      promoted: false
    - type: "shogi_silver"
      position: [6, 8]
      promoted: false
    - type: "shogi_knight"
      position: [7, 8]
      promoted: false
    - type: "shogi_lance"
      position: [8, 8]
      promoted: false
    - type: "shogi_bishop"
      position: [1, 7]
      promoted: false
    - type: "shogi_rook"
      position: [7, 7]
      promoted: false
    - type: "shogi_pawn"
      position: [0, 6]
      promoted: false
    - type: "shogi_pawn"
      position: [1, 6]
      promoted: false
    - type: "shogi_pawn"
      position: [2, 6]
      promoted: false
    - type: "shogi_pawn"
      position: [3, 6]
      promoted: false
    - type: "shogi_pawn"
      position: [4, 6]
      promoted: false
    - type: "shogi_pawn"
      position: [5, 6]
      promoted: false
    - type: "shogi_pawn"
      position: [6, 6]
      promoted: false
    - type: "shogi_pawn"
      position: [7, 6]
      promoted: false
    - type: "shogi_pawn"
      position: [8, 6]
      promoted: false
`,
                rules: `# ルール設定（将棋 vs チェス）
turn_system: "alternate"
victory_conditions:
  - type: "capture_king"
    value: "chess_king"
  - type: "capture_king"
    value: "shogi_king"
draw_conditions:
  repetition: 4
piece_reuse: "off"
reuse_rules: null
time_limit:
  per_move: 60
players:
  number: 2
  teams: false
  ai_difficulty: null
`
            },
            quadsphere: {
                board: `# クアッドスフィア盤面設定
board_type: "quadsphere"
board_size: [8, 8]
special_squares: []
obstacles: []
`,
                pieces: `# 駒設定（クアッドスフィア用）
piece_types:
  - name: "explorer"
    movement: "adjacent"
    special_moves: []
    promotion: null

initial_positions:
  player_1:
    - type: "explorer"
      position: [0, 0]
      promoted: false
    - type: "explorer"
      position: [7, 0]
      promoted: false
  player_2:
    - type: "explorer"
      position: [0, 7]
      promoted: false
    - type: "explorer"
      position: [7, 7]
      promoted: false
`,
                rules: `# ルール設定（クアッドスフィア用）
turn_system: "alternate"
victory_conditions:
  - type: "reach_square"
    value: [4, 4]
draw_conditions:
  repetition: 4
piece_reuse: "off"
reuse_rules: null
time_limit:
  per_move: 30
players:
  number: 2
  teams: false
  ai_difficulty: null
`
            }
        };
    }

    /**
     * 指定された盤面タイプの設定テンプレートを取得
     * @param {string} boardType - 盤面タイプ ('rectangular' or 'quadsphere')
     * @returns {Object} 設定テンプレート
     */
    getTemplate(boardType) {
        return this.templates[boardType] || this.templates.rectangular;
    }

    /**
     * 現在の設定を取得
     * @returns {Object} 現在の設定
     */
    getCurrentConfig() {
        return {
            board: document.getElementById('board-config').value,
            pieces: document.getElementById('pieces-config').value,
            rules: document.getElementById('rules-config').value
        };
    }

    /**
     * 設定を更新
     * @param {Object} config - 設定オブジェクト
     */
    setConfig(config) {
        if (config.board) document.getElementById('board-config').value = config.board;
        if (config.pieces) document.getElementById('pieces-config').value = config.pieces;
        if (config.rules) document.getElementById('rules-config').value = config.rules;
    }

    /**
     * 設定をファイルとしてダウンロード
     * @param {string} filename - ファイル名
     * @param {string} content - ファイル内容
     */
    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 設定ファイルをインポート
     * @param {File} file - インポートするファイル
     * @returns {Promise<Object>} パースされた設定
     */
    async importFile(file) {
        try {
            const content = await this.uploadFile(file);
            const fileName = file.name.toLowerCase();

            let configType = 'board';
            if (fileName.includes('piece') || fileName.includes('pieces')) {
                configType = 'pieces';
            } else if (fileName.includes('rule') || fileName.includes('rules')) {
                configType = 'rules';
            }

            return {
                type: configType,
                content: content
            };
        } catch (error) {
            throw new Error(`ファイルの読み込みに失敗しました: ${error.message}`);
        }
    }

    /**
     * すべての設定をZIPファイルとしてエクスポート
     */
    exportAllSettings() {
        const config = this.getCurrentConfig();
        const zip = new JSZip();

        // 各設定ファイルをZIPに追加
        zip.file('board.yaml', config.board);
        zip.file('pieces.yaml', config.pieces);
        zip.file('rules.yaml', config.rules);

        // READMEファイルを追加
        const readme = `# FlexiBoard Game Configuration
このZIPファイルには、FlexiBoardゲームの設定ファイルが含まれています。

## ファイル内容
- board.yaml: 盤面設定
- pieces.yaml: 駒設定
- rules.yaml: ルール設定

## 使用方法
1. これらのファイルをFlexiBoardアプリケーションにインポートしてください
2. 必要に応じて設定を編集してください
3. ゲームを作成してプレイしてください

エクスポート日時: ${new Date().toLocaleString('ja-JP')}
`;
        zip.file('README.txt', readme);

        // ZIPファイルをダウンロード
        zip.generateAsync({ type: 'blob' }).then((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `flexiboard_config_${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    /**
     * 設定のテンプレートを切り替え
     * @param {string} boardType - 盤面タイプ
     * @param {string} templateType - テンプレートタイプ ('basic', 'advanced', 'custom')
     */
    switchTemplate(boardType, templateType = 'basic') {
        let template;

        if (templateType === 'basic') {
            template = this.templates[boardType];
        } else if (templateType === 'advanced') {
            // 高度なテンプレート（今後実装）
            template = this.getAdvancedTemplate(boardType);
        } else {
            // カスタムテンプレート
            template = this.getCustomTemplate(boardType);
        }

        if (template) {
            this.setConfig(template);
            return true;
        }
        return false;
    }

    /**
     * 高度なテンプレートを取得
     * @param {string} boardType - 盤面タイプ
     * @returns {Object} 高度なテンプレート
     */
    getAdvancedTemplate(boardType) {
        if (boardType === 'rectangular') {
            return {
                board: `# 高度な矩形盤面設定
board_type: "rectangular"
board_size: [10, 10]
special_squares:
  - position: [2, 2]
    effect: "teleport"
    value: [7, 7]
  - position: [7, 7]
    effect: "teleport"
    value: [2, 2]
  - position: [0, 0]
    effect: "damage"
    value: 2
  - position: [9, 9]
    effect: "bonus"
    value: 3
obstacles:
  - position: [5, 5]
    type: "wall"
  - position: [1, 8]
    type: "pit"
`,
                pieces: `# 高度な駒設定
piece_types:
  - name: "king"
    movement: "adjacent"
    special_moves: []
    promotion: null
  - name: "queen"
    movement: "horizontal_vertical_unlimited"
    special_moves: ["diagonal_unlimited"]
    promotion: null
  - name: "rook"
    movement: "horizontal_vertical_unlimited"
    special_moves: []
    promotion: null
  - name: "bishop"
    movement: "diagonal_unlimited"
    special_moves: []
    promotion: null
  - name: "knight"
    movement: [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]
    special_moves: []
    promotion: null
  - name: "pawn"
    movement: "forward_1"
    special_moves: []
    promotion:
      new_type: "queen"
      zone: "enemy_back_row"

initial_positions:
  player_1:
    - type: "king"
      position: [4, 0]
      promoted: false
    - type: "queen"
      position: [3, 0]
      promoted: false
    - type: "rook"
      position: [0, 0]
      promoted: false
    - type: "rook"
      position: [7, 0]
      promoted: false
    - type: "bishop"
      position: [2, 0]
      promoted: false
    - type: "bishop"
      position: [5, 0]
      promoted: false
    - type: "knight"
      position: [1, 0]
      promoted: false
    - type: "knight"
      position: [6, 0]
      promoted: false
    - type: "pawn"
      position: [0, 1]
      promoted: false
    - type: "pawn"
      position: [1, 1]
      promoted: false
    - type: "pawn"
      position: [2, 1]
      promoted: false
    - type: "pawn"
      position: [3, 1]
      promoted: false
    - type: "pawn"
      position: [4, 1]
      promoted: false
    - type: "pawn"
      position: [5, 1]
      promoted: false
    - type: "pawn"
      position: [6, 1]
      promoted: false
    - type: "pawn"
      position: [7, 1]
      promoted: false
  player_2:
    - type: "king"
      position: [4, 9]
      promoted: false
    - type: "queen"
      position: [3, 9]
      promoted: false
    - type: "rook"
      position: [0, 9]
      promoted: false
    - type: "rook"
      position: [7, 9]
      promoted: false
    - type: "bishop"
      position: [2, 9]
      promoted: false
    - type: "bishop"
      position: [5, 9]
      promoted: false
    - type: "knight"
      position: [1, 9]
      promoted: false
    - type: "knight"
      position: [6, 9]
      promoted: false
    - type: "pawn"
      position: [0, 8]
      promoted: false
    - type: "pawn"
      position: [1, 8]
      promoted: false
    - type: "pawn"
      position: [2, 8]
      promoted: false
    - type: "pawn"
      position: [3, 8]
      promoted: false
    - type: "pawn"
      position: [4, 8]
      promoted: false
    - type: "pawn"
      position: [5, 8]
      promoted: false
    - type: "pawn"
      position: [6, 8]
      promoted: false
    - type: "pawn"
      position: [7, 8]
      promoted: false
`,
                rules: `# 高度なルール設定（チェス風）
turn_system: "alternate"
victory_conditions:
  - type: "capture_king"
    value: "king"
  - type: "eliminate_all"
draw_conditions:
  repetition: 3
  stalemate: true
piece_reuse: "off"
reuse_rules: null
time_limit:
  per_move: 600
  per_game: 3600
players:
  number: 2
  teams: false
  ai_difficulty: "medium"
`
            };
        } else if (boardType === 'quadsphere') {
            return {
                board: `# 高度なクアッドスフィア盤面設定
board_type: "quadsphere"
board_size: [12, 12]
special_squares:
  - position: [0, 0]
    effect: "teleport"
    value: [11, 11]
  - position: [11, 11]
    effect: "teleport"
    value: [0, 0]
  - position: [6, 6]
    effect: "bonus"
    value: 5
obstacles: []
`,
                pieces: `# 高度なクアッドスフィア駒設定
piece_types:
  - name: "explorer"
    movement: "adjacent"
    special_moves: []
    promotion: null
  - name: "warrior"
    movement: [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
    special_moves: []
    promotion:
      new_type: "champion"
      zone: "center_area"
  - name: "archer"
    movement: [[2, 0], [0, 2], [-2, 0], [0, -2]]
    special_moves: []
    promotion: null
  - name: "mage"
    movement: "adjacent"
    special_moves: ["teleport"]
    promotion: null

initial_positions:
  player_1:
    - type: "explorer"
      position: [0, 0]
      promoted: false
    - type: "warrior"
      position: [1, 0]
      promoted: false
    - type: "archer"
      position: [2, 0]
      promoted: false
    - type: "mage"
      position: [3, 0]
      promoted: false
  player_2:
    - type: "explorer"
      position: [11, 11]
      promoted: false
    - type: "warrior"
      position: [10, 11]
      promoted: false
    - type: "archer"
      position: [9, 11]
      promoted: false
    - type: "mage"
      position: [8, 11]
      promoted: false
`,
                rules: `# 高度なクアッドスフィアルール設定
turn_system: "alternate"
victory_conditions:
  - type: "reach_square"
    value: [6, 6]
  - type: "eliminate_all"
draw_conditions:
  repetition: 5
piece_reuse: "on"
reuse_rules:
  max_reuse: 3
  reuse_penalty: 1
time_limit:
  per_move: 30
players:
  number: 2
  teams: false
  ai_difficulty: "hard"
`
            };
        }

        return this.templates[boardType]; // フォールバック
    }

    /**
     * カスタムテンプレートを取得
     * @param {string} boardType - 盤面タイプ
     * @returns {Object} カスタムテンプレート
     */
    getCustomTemplate(boardType) {
        // ローカルストレージからカスタムテンプレートを取得
        const savedTemplate = localStorage.getItem(`custom_template_${boardType}`);
        if (savedTemplate) {
            try {
                return JSON.parse(savedTemplate);
            } catch (e) {
                console.warn('カスタムテンプレートの読み込みに失敗しました');
            }
        }

        // デフォルトに戻る
        return this.templates[boardType];
    }

    /**
     * カスタムテンプレートを保存
     * @param {string} boardType - 盤面タイプ
     */
    saveCustomTemplate(boardType) {
        const currentConfig = this.getCurrentConfig();
        localStorage.setItem(`custom_template_${boardType}`, JSON.stringify(currentConfig));
    }

    /**
     * ファイルをアップロードして設定を読み込み
     * @param {File} file - アップロードされたファイル
     * @returns {Promise<string>} ファイル内容
     */
    async uploadFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    /**
     * 設定をJSONに変換してAPIに送信可能な形式にする
     * @returns {Object} API送信用のデータ
     */
    prepareForAPI() {
        const config = this.getCurrentConfig();
        return {
            board_yaml: config.board,
            pieces_yaml: config.pieces,
            rules_yaml: config.rules
        };
    }

    /**
     * YAML設定をパースしてJavaScriptオブジェクトに変換
     * @param {string} yamlContent - YAML形式の文字列
     * @returns {Object} パースされたオブジェクト
     */
    parseYAML(yamlContent) {
        // 簡易的なYAMLパーサー（実際のプロジェクトではライブラリを使用）
        try {
            // ここでは簡易的なパースのみ実装
            // 本来は js-yaml などのライブラリを使用
            const lines = yamlContent.split('\n');
            const result = {};

            let currentKey = null;
            let currentArray = null;
            let indentLevel = 0;

            for (let line of lines) {
                line = line.trim();
                if (!line || line.startsWith('#')) continue;

                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex).trim();
                    const value = line.substring(colonIndex + 1).trim();

                    if (value === '') {
                        // ネストされたオブジェクトの開始
                        currentKey = key;
                        result[key] = {};
                    } else if (value.startsWith('[') && value.endsWith(']')) {
                        // 配列
                        result[key] = JSON.parse(value);
                    } else if (value.startsWith('"') && value.endsWith('"')) {
                        // 文字列
                        result[key] = value.slice(1, -1);
                    } else if (!isNaN(value) && value !== '') {
                        // 数字
                        result[key] = parseFloat(value);
                    } else if (value === 'null') {
                        result[key] = null;
                    } else if (value === 'true' || value === 'false') {
                        result[key] = value === 'true';
                    } else {
                        result[key] = value;
                    }
                } else if (line.startsWith('-')) {
                    // 配列要素
                    if (!currentArray) {
                        currentArray = [];
                        if (currentKey) {
                            result[currentKey] = currentArray;
                        }
                    }

                    const itemValue = line.substring(1).trim();
                    if (itemValue.startsWith('{') && itemValue.endsWith('}')) {
                        // オブジェクト
                        const objStr = itemValue.slice(1, -1);
                        const obj = {};
                        const pairs = objStr.split(',').map(p => p.trim());
                        for (const pair of pairs) {
                            const [k, v] = pair.split(':').map(s => s.trim());
                            obj[k] = v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1) : v;
                        }
                        currentArray.push(obj);
                    } else {
                        currentArray.push(itemValue);
                    }
                }
            }

            return result;
        } catch (error) {
            console.error('YAML parse error:', error);
            return {};
        }
    }
}

// グローバルインスタンス
window.configManager = new ConfigManager();
