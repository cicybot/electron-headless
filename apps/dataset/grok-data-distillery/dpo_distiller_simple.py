"""
简化DPO对比蒸馏器
"""


def generate_dpo_pair(good_response, bad_response):
    """生成DPO对比对"""
    # 简化实现，避免复杂计算
    return {
        "prompt": good_response,
        "chosen": bad_response,
        "rejected": good_response,
        "win": bad_response,
        "lose": good_response,
    }


if __name__ == "__main__":
    # 测试DPO生成器
    test_good = "你好宝贝，今天很乖"
    test_bad = "哼，不理我算了"

    print("测试DPO生成器:")
    dpo_pair = generate_dpo_pair(test_good, test_bad)

    print(f"Prompt: {dpo_pair['prompt']}")
    print(f"Chosen: {dpo_pair['chosen']}")
    print(f"Rejected: {dpo_pair['rejected']}")
    print(f"Win response: {dpo_pair['win']}")
    print(f"Lose response: {dpo_pair['lose']}")
