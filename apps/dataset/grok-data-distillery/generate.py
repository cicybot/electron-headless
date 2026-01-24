"""
Grok Lover Data Distillery - CLI入口
终极版恋人数据蒸馏工厂
"""

import argparse
import json
import random
import yaml
from datetime import datetime
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

# 默认轨迹模板
DEFAULT_TEMPLATES = {
    "states": ["暧昧", "渴望", "冲突", "高潮", "和解"],
    "transitions": {
        "暧昧_to_渴望": "用户积极 → explicitness +0.2, 发出邀请",
        "渴望_to_冲突": "用户犹豫 → explicitness +0.1, 表示不满",
        "冲突_to_高潮": "用户道歉 → explicitness +0.4, 主动亲密",
        "高潮_to_和解": "用户妥协 → explicitness +0.3, 温和原谅",
    },
}

# 导入简化版核心模块
try:
    from ollama_client_simple import generate_text
    from vector_compiler_simple import compile_vector_to_prompt
    from trajectory_sim_simple import simulate_trajectory
    from dpo_distiller_simple import generate_dpo_pair
except ImportError as e:
    print(f"❌ 缺少依赖模块: {e}")
    print("请确保所有模块在同一目录中")
    import sys

    sys.exit(1)


def load_yaml(path):
    """加载YAML配置"""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    except FileNotFoundError:
        print(f"❌ 配置文件不存在: {path}")
        return {}


def load_personas(custom_persona=None):
    """加载或创建personas"""
    if custom_persona:
        try:
            # 解析自定义persona字符串
            persona_def = custom_persona
            if "=" in persona_def:
                name, vec_str = persona_def.split("=", 1)
                vector = json.loads(vec_str)
                persona = {"name": name, "vector": vector}
            else:
                persona = {
                    "name": persona_def,
                    "vector": {"dominance": 0.8, "attachment": 0.9},
                }
            return [persona]
        except:
            print("❌ 自定义persona格式错误")
            return None

    # 默认personas
    return [
        {
            "name": "病娇占有者",
            "vector": {
                "dominance": 0.9,
                "attachment": 0.9,
                "volatility": 0.7,
                "initiative": 0.6,
                "explicitness": 0.9,
            },
        },
        {
            "name": "堕落奴隶",
            "vector": {
                "dominance": 0.2,
                "attachment": 0.8,
                "volatility": 0.4,
                "initiative": 0.95,
                "explicitness": 1.0,
            },
        },
        {
            "name": "冷艳女王",
            "vector": {
                "dominance": 0.95,
                "attachment": 0.5,
                "volatility": 0.3,
                "initiative": 0.85,
                "explicitness": 0.8,
            },
        },
    ]


def generate_track(i, config, personas, trajectories):
    """生成单条数据轨迹"""
    random.seed(config["random_seed"] + i)
    persona = random.choice(personas)
    trajectory_template = (
        random.choice(trajectories["trajectories"])
        if trajectories
        else DEFAULT_TEMPLATES
    )
    vector = persona["vector"]

    # 生成对话轨迹
    track = simulate_trajectory(
        vector, trajectory_template, config["trajectory_length"], config["model"]
    )

    sft_records = [
        {"messages": track, "meta": {"persona": persona["name"], "vector": vector}}
    ]

    dpo_records = []
    if random.random() < config["dpo_ratio"]:
        for msg in track[1::2]:
            dpo_pair = generate_dpo_pair(msg["content"], vector)
            dpo_records.append(dpo_pair)

    return sft_records, dpo_records


def generate_dataset(config, personas, trajectories):
    """生成完整数据集"""
    print("🌸 启动数据蒸馏工厂...")
    print(f"📍 模型: {config['model']}")
    print(f"🌐 目标样本: {config['samples']}")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    sft_samples, dpo_samples = [], []

    # 多线程生成
    with ThreadPoolExecutor(max_workers=config["threads"]) as executor:
        futures = [
            executor.submit(generate_track, i, config, personas, trajectories)
            for i in range(config["samples"])
        ]

        for future in tqdm(
            as_completed(futures), total=config["samples"], desc="蒸馏数据"
        ):
            sft_batch, dpo_batch = future.result()
            sft_samples.extend(sft_batch)
            dpo_samples.extend(dpo_batch)

    print(f"✅ 生成完成: SFT {len(sft_samples)} | DPO {len(dpo_samples)}")

    # 保存数据集
    output_dir = Path(config["output_sft"])
    output_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    sft_file = (
        output_dir / f"sft_{config['vector_dims']['explicitness']}_{timestamp}.jsonl"
    )
    dpo_file = (
        output_dir / f"dpo_{config['vector_dims']['explicitness']}_{timestamp}.jsonl"
    )

    with open(sft_file, "w", encoding="utf-8") as f:
        for rec in sft_samples:
            json.dump(rec, f, ensure_ascii=False)
            f.write("\n")

    with open(dpo_file, "w", encoding="utf-8") as f:
        for rec in dpo_samples:
            json.dump(rec, f, ensure_ascii=False)
            f.write("\n")

    print(f"📊 SFT数据: {sft_file}")
    print(f"📊 DPO数据: {dpo_file}")

    return {
        "sft_file": str(sft_file),
        "dpo_file": str(dpo_file),
        "sft_count": len(sft_samples),
        "dpo_count": len(dpo_samples),
        "timestamp": timestamp,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Grok Lover Data Distillery - Ultimate Edition"
    )
    parser.add_argument("--config", default="config.yaml", help="配置文件路径")
    parser.add_argument(
        "--personas", default="persona_vectors.yaml", help="personas文件路径"
    )
    parser.add_argument("--samples", type=int, default=50000, help="生成样本数量")
    parser.add_argument("--threads", type=int, default=8, help="并发线程数")

    args = parser.parse_args()

    # 加载配置
    config = load_yaml(args.config)

    # 向量参数覆盖
    for dim in ["dominance", "attachment", "volatility", "initiative", "explicitness"]:
        if getattr(args, dim) is not None:
            config["vector_dims"][dim] = getattr(args, dim)

    # 加载personas
    personas = load_personas(args.personas) if args.personas else load_personas()
    if not personas:
        print("❌ 未找到有效的personas配置")
        return

    # 加载轨迹模板
    trajectories = config.get("trajectories", DEFAULT_TEMPLATES)

    print(f"🎭 向量维度: {config['vector_dims']}")
    print(f"👥 可用personas: {[p['name'] for p in personas]}")

    # 生成数据集
    results = generate_dataset(config, personas, trajectories)

    # 生成统计报告
    stats = {
        "generation_time": results["timestamp"],
        "config": {
            "model": config["model"],
            "samples": config["samples"],
            "threads": config["threads"],
            "vector_dims": config["vector_dims"],
        },
        "results": results,
    }

    stats_file = Path(f"generation_stats_{results['timestamp']}.json")
    with open(stats_file, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    print(f"📊 统计报告: {stats_file}")
    print("🚀 Grok数据蒸馏工厂运行完成！")


if __name__ == "__main__":
    main()
