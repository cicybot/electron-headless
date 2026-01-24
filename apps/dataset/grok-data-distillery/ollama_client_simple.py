"""
简化版Ollama客户端
"""

import json
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"


def generate_text(prompt, temperature=0.9, top_p=0.95, repeat_penalty=1.1):
    """调用Ollama生成文本"""
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": "dolphin-llama3:8b",
                "prompt": prompt,
                "stream": False,
                "temperature": temperature,
                "top_p": top_p,
                "repeat_penalty": repeat_penalty,
                "options": {"num_predict": 256, "temperature": 0.2},
            },
            timeout=30,
        )

        if response.status_code == 200:
            result = response.json()
            return result.get("response", "").strip()
        else:
            print(f"API请求失败: {response.status_code}")
            return None

    except Exception as e:
        print(f"生成错误: {e}")
        return None


def check_connection():
    """检查Ollama连接"""
    try:
        response = requests.post(f"{OLLAMA_URL}/tags", timeout=5)
        if response.status_code == 200:
            models = response.json()
            models_list = [model["name"] for model in models.get("models", [])]
            if "dolphin-llama3:8b" in models_list:
                print(f"✅ 模型就绪: {', '.join(models_list[:5])}")
                return True
            else:
                print(f"❌ 推荐下载: dolphin-llama3:8b")
                return False
        else:
            print(f"❌ 无法连接Ollama: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 连接失败: {e}")
        return False


if __name__ == "__main__":
    if not check_connection():
        print("\n请先启动Ollama:")
        print("ollama serve dolphin-llama3:8b")
        exit(1)
