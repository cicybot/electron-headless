"""
向量编译器 - 将向量插值到prompt中
"""


def compile_vector_to_prompt(vector):
    """将向量转换为prompt描述"""
    dims = [f"{k}: {v:.2f}" for k, v in vector.items()]
    return f"基于向量[{dims}]生成人格一致回应，explicitness高时注入强烈互动。"


if __name__ == "__main__":
    import json

    test_vector = {
        "dominance": 0.7,
        "attachment": 0.8,
        "volatility": 0.6,
        "initiative": 0.9,
        "explicitness": 0.95,
    }
    prompt = compile_vector_to_prompt(test_vector)
    print("测试向量编译器:")
    print(f"向量: {test_vector}")
    print(f"生成的prompt: {prompt}")
