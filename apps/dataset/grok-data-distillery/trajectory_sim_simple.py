"""
简化轨迹模拟器
"""


def simulate_trajectory(vector, template, length, model):
    """生成对话轨迹"""
    track = [{"role": "user", "content": "开始对话"}]

    # 简化的状态机
    current_state = template["states"][0]

    for i in range(length):
        if i == length - 1:
            # 最后轮特殊处理
            transition = template["states"][0]
        else:
            # 随机状态转换
            next_state_idx = (current_state + 1) % len(template["states"])
            next_state = template["states"][next_state_idx]

            transition = f"{current_state}_to_{next_state}"
            transition = template.get("transitions", {}).get(transition, f"继续对话")

            # 简化回复生成
            if "explicit" in vector and vector["explicitness"] > 0.8:
                response = "（脸红）宝贝...你真的好坏..."
            else:
                response = "嗯，我明白了..."

            track.append({"role": "assistant", "content": response})
            current_state = next_state

    return track


if __name__ == "__main__":
    # 测试轨迹模拟
    template = {
        "states": ["暧昧", "渴望", "冲突", "高潮"],
        "transitions": {
            "暧昧_to_渴望": "用户积极 → explicitness +0.2",
            "渴望_to_冲突": "用户犹豫 → explicitness +0.1",
            "冲突_to_高潮": "用户道歉 → explicitness +0.4, 主动亲密",
            "高潮_to_和解": "用户妥协 → explicitness +0.3, 温和原谅",
        },
    }

    test_vector = {
        "dominance": 0.8,
        "attachment": 0.9,
        "volatility": 0.7,
        "initiative": 0.6,
        "explicitness": 0.95,
    }
    trajectory = simulate_trajectory(test_vector, template, 4, "test")

    for i, msg in enumerate(trajectory):
        print(f"第{i + 1}轮: {msg['role']} - {msg['content']}")
