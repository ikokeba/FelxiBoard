import json
import requests
from pathlib import Path

def test_validation():
    """バリデーション機能をテストする"""
    print("=== バリデーション機能テスト開始 ===")

    # 正常な設定でのテスト
    print("1. 正常設定でのテスト...")
    base = Path('backend/sample_configs')
    board_yaml = (base / 'board_rectangular.yaml').read_text(encoding='utf-8')
    pieces_yaml = (base / 'pieces_basic.yaml').read_text(encoding='utf-8')
    rules_yaml = (base / 'rules_basic.yaml').read_text(encoding='utf-8')

    url = 'http://localhost:8001/api/games'
    data = {
        'board_yaml': board_yaml,
        'pieces_yaml': pieces_yaml,
        'rules_yaml': rules_yaml
    }

    response = requests.post(url, json=data)
    print(f"   正常設定結果: {response.status_code}")

    # 無効なボードサイズでのテスト
    print("\n2. 無効なボードサイズでのテスト...")
    invalid_board_yaml = """
board_type: "rectangular"
board_size: [0, 0]
special_squares: []
obstacles: []
"""

    data_invalid = {
        'board_yaml': invalid_board_yaml,
        'pieces_yaml': pieces_yaml,
        'rules_yaml': rules_yaml
    }

    response_invalid = requests.post(url, json=data_invalid)
    print(f"   無効ボード結果: {response_invalid.status_code}")
    if response_invalid.status_code == 400:
        error_data = response_invalid.json()
        print(f"   エラーメッセージ: {error_data.get('errors', 'N/A')}")

    # 無効な駒タイプでのテスト
    print("\n3. 無効な駒タイプでのテスト...")
    invalid_pieces_yaml = """
piece_types:
  - name: ""
    movement: "invalid_movement"
initial_positions:
  player_1:
    - type: "nonexistent_piece"
      position: [10, 10]
"""

    data_invalid_pieces = {
        'board_yaml': board_yaml,
        'pieces_yaml': invalid_pieces_yaml,
        'rules_yaml': rules_yaml
    }

    response_invalid_pieces = requests.post(url, json=data_invalid_pieces)
    print(f"   無効駒結果: {response_invalid_pieces.status_code}")
    if response_invalid_pieces.status_code == 400:
        error_data = response_invalid_pieces.json()
        print(f"   エラーメッセージ: {error_data.get('errors', 'N/A')}")

    print("\n=== バリデーション機能テスト完了 ===")

if __name__ == "__main__":
    test_validation()
