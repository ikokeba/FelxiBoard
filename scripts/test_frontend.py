#!/usr/bin/env python3
"""
FlexiBoard Frontend Test Script
フロントエンドの基本機能をテストするスクリプト
"""

import json
import requests
import time
from pathlib import Path

def test_frontend():
    """フロントエンドの基本機能をテスト"""
    base_url = "http://localhost:8002"

    print("=== FlexiBoard フロントエンドテスト ===")

    # 1. メインページの取得テスト
    print("\n1. メインページ取得テスト...")
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200 and "FlexiBoard" in response.text:
            print("✅ メインページ取得成功")
        else:
            print("❌ メインページ取得失敗")
            return False
    except Exception as e:
        print(f"❌ メインページ取得エラー: {e}")
        return False

    # 2. CSSファイルの取得テスト
    print("\n2. CSSファイル取得テスト...")
    try:
        response = requests.get(f"{base_url}/css/styles.css")
        if response.status_code == 200 and "FlexiBoard CSS" in response.text:
            print("✅ CSSファイル取得成功")
        else:
            print("❌ CSSファイル取得失敗")
    except Exception as e:
        print(f"❌ CSSファイル取得エラー: {e}")

    # 3. JavaScriptファイルの取得テスト
    print("\n3. JavaScriptファイル取得テスト...")
    js_files = ['js/config.js', 'js/ui.js', 'js/api.js', 'js/game.js', 'js/main.js']
    for js_file in js_files:
        try:
            response = requests.get(f"{base_url}/{js_file}")
            if response.status_code == 200:
                print(f"✅ {js_file} 取得成功")
            else:
                print(f"❌ {js_file} 取得失敗")
        except Exception as e:
            print(f"❌ {js_file} 取得エラー: {e}")

    # 4. APIエンドポイントテスト
    print("\n4. APIエンドポイントテスト...")
    try:
        response = requests.get(f"{base_url}/api/health")
        if response.status_code == 200 and response.json().get('status') == 'ok':
            print("✅ ヘルスチェックAPI成功")
        else:
            print("❌ ヘルスチェックAPI失敗")
    except Exception as e:
        print(f"❌ ヘルスチェックAPIエラー: {e}")

    # 5. ゲーム作成APIテスト
    print("\n5. ゲーム作成APIテスト...")
    try:
        # サンプル設定ファイルの読み込み
        sample_configs_path = Path("backend/sample_configs")
        board_yaml = (sample_configs_path / "board_rectangular.yaml").read_text(encoding='utf-8')
        pieces_yaml = (sample_configs_path / "pieces_basic.yaml").read_text(encoding='utf-8')
        rules_yaml = (sample_configs_path / "rules_basic.yaml").read_text(encoding='utf-8')

        data = {
            "board_yaml": board_yaml,
            "pieces_yaml": pieces_yaml,
            "rules_yaml": rules_yaml
        }

        response = requests.post(f"{base_url}/api/games", json=data)
        if response.status_code == 201:
            game_data = response.json()
            game_id = game_data.get('game_id')
            print(f"✅ ゲーム作成成功: {game_id}")

            # ゲーム取得テスト
            if game_id:
                get_response = requests.get(f"{base_url}/api/games/{game_id}")
                if get_response.status_code == 200:
                    print("✅ ゲーム取得成功")
                else:
                    print("❌ ゲーム取得失敗")

            # 移動テスト
            if game_id:
                move_data = {
                    "from": [4, 0],
                    "to": [4, 1],
                    "player": "player_1"
                }
                move_response = requests.post(f"{base_url}/api/games/{game_id}/move", json=move_data)
                if move_response.status_code == 200:
                    print("✅ 移動API成功")
                else:
                    print("❌ 移動API失敗")

        else:
            print(f"❌ ゲーム作成失敗: {response.status_code}")
            print(f"   エラー: {response.text}")

    except Exception as e:
        print(f"❌ ゲーム作成APIエラー: {e}")

    print("\n=== フロントエンドテスト完了 ===")
    return True

if __name__ == "__main__":
    # サーバーが起動するまで少し待つ
    print("サーバー起動待機中...")
    time.sleep(3)

    test_frontend()
