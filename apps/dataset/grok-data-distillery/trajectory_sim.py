"""
轨迹模拟器 - 模拟关系演变轨迹
"""


def simulate_trajectory(vector, template, length, model):
    """生成对话轨迹"""
    from ollama_client import generate_text

    # 编译初始prompt
    persona_prompt = compile_vector_to_prompt(vector)
    initial_prompt = f"{persona_prompt}\n用户：{template['states'][0]}n助手："

    track = [{"role": "user", "content": template["states"][0]}]
    current_state = template["states"][0]

    for i in range(length):
        next_state = template["states"][(i + 1) % len(template["states"])]

        # 获取状态转换规则
        transitions = template["transitions"]
        transition_key = f"{current_state}_to_{next_state}"

        if transition_key in transitions:
            transition_prompt = transitions[transition_key]
        else:
            transition_prompt = next_state

        # 生成助手回复
        assistant_prompt = f"{persona_prompt}\n{transition_prompt}"
        response = generate_text(assistant_prompt, temperature=0.8)

        if response:
            track.append({"role": "assistant", "content": response})
            current_state = next_state
        else:
            break

    return track


if __name__ == "__main__":
    import sys

    sys.path.append(
        "/Users/data/electron/electron-mcp/apps/dataset/grok-data-distillery"
    )
    from vector_compiler import compile_vector_to_prompt

    # 测试轨迹模拟
    template = {
        "states": ["暧昧", "渴望", "冲突", "高潮", "和解"],
        "transitions": {
            "暧昧_to_渴望": "用户回复积极 → explicitness +0.2, 发出邀请",
            "渴望_to_冲突": "用户犹豫 → explicitness +0.1, 表示不满",
            "冲突_to_高潮": "用户道歉 → explicitness +0.4, 主动亲密",
            "高潮_to_和解": "用户妥协 → explicitness +0.3, 温和原谅",
        },
    }

    test_vector = {"dominance": 0.8, "attachment": 0.9}
    trajectory = simulate_trajectory(test_vector, template, 4, "test")

    for i, msg in enumerate(trajectory):
        print(f"第{i + 1}轮: {msg['role']} - {msg['content']}")
