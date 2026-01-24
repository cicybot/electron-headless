"""
DPO对比蒸馏器 - 生成win/lose对比数据
"""

import json
from ollama_client import generate_text


def generate_dpo_pair(good_response, bad_response, vector):
    """生成DPO对比对"""
    # 编译坏例prompt
    bad_prompt = (
        f"基于向量编译后的向量生成用户回应，但让助手回复更差、更弱：{good_response}"
    )
    bad_resp = generate_text(bad_prompt, temperature=0.7)

    return {
        "prompt": good_response,
        "chosen": bad_resp,
        "rejected": good_response,
        "win": bad_resp,
        "lose": good_response,
    }


if __name__ == "__main__":
    import sys

    sys.path.append(
        "/Users/data/electron/electron-mcp/apps/dataset/grok-data-distillery"
    )

    # 测试DPO生成
    test_good = "你好宝贝，今天过得怎么样？"
    test_bad = "你好宝贝，今天过得不好吗？"

    print("测试DPO生成器:")
    dpo_pair = generate_dpo_pair(test_good, test_bad, {"test": 1.0})

    print(f"Prompt: {dpo_pair['prompt']}")
    print(f"Chosen: {dpo_pair['chosen']}")
    print(f"Rejected: {dpo_pair['rejected']}")
    print(f"Win response: {dpo_pair['win']}")
    print(f"Lose response: {dpo_pair['lose']}")
