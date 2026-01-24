#!/bin/bash

# Grok Lover Data Distillery - 一键运行脚本

echo "🌸 Grok Lover Data Distillery - 终极版"
echo "=================================="

# 检查依赖
echo "🔍 检查Python依赖..."
if ! python3 -c "import ollama_client_simple, vector_compiler_simple, trajectory_sim_simple, dpo_distiller_simple" &> /dev/null; then
    echo "❌ 缺少必要Python模块"
    echo "📦 请确保以下模块在当前目录："
    echo "   - ollama_client_simple.py"
    echo "   - vector_compiler_simple.py"
    echo "   - trajectory_sim_simple.py"
    echo "   - dpo_distiller_simple.py"
    exit 1
fi

echo "✅ Python依赖检查通过"

# 检查Ollama连接
echo "🔍 检查Ollama连接..."
python3 -c "
from ollama_client_simple import check_connection
if not check_connection():
    echo '❌ Ollama未运行'
    echo '🚀 启动Ollama:'
    echo '   ollama serve dolphin-llama3:8b'
    exit 1
fi

echo "✅ Ollama连接正常"

# 选择生成模式
echo ""
echo "🎭 请选择生成模式："
echo "1. 柔和版 (推荐)"
echo "2. 辣辣版"
echo "3. 多样化生成"

read -p "选择模式: " mode

# 根据用户选择执行不同模式
case $mode in
    1)
        echo "🥰 选择：缠和版"
        python3 generate.py --samples 10000 --explicitness 0.4
        ;;
    2)
        echo "🌶️ 选择： 辣辣版"
        python3 generate.py --samples 10000 --explicitness 0.8
        ;;
    3)
        echo "🎨 选择： 多样化生成"
        
        # 生成缠和版
        python3 generate.py --samples 30000 --explicitness 0.4 &
        sleep 2
        
        # 生成堕落奴隶版
        python3 generate.py --samples 30000 --custom-persona "堕落奴隶={dominance:0.2, attachment:0.8, volatility:0.4, initiative:0.95, explicitness:1.0}" &
        sleep 2
        
        # 生成冷艳女王版
        python3 generate.py --samples 20000 --custom-persona "冷艳女王={dominance:0.95, attachment:0.5, volatility:0.3, initiative:0.85, explicitness:0.8}" &
        
        # 等待所有任务完成
        wait
        ;;
    *)
        echo "❌ 无效选择，默认使用缠和版"
        python3 generate.py --samples 10000 --explicitness 0.4
        ;;
esac

echo ""
echo "🎉 数据生成完成！"
echo "📋 查看 apps/dataset/grok-data-distillery/output/ 目录"
echo ""
echo "🎯 项目特点："
echo "   - 向量化Persona空间，100%个性化匹配"
echo "   - 状态轨迹模拟，真实关系演变"
echo "   - DPO对比蒸馏，学会边界感"
echo "   - 质量自动过滤，保证训练数据质量"
echo "   - 多线程并发，高效生成"
echo "   - 工程级交付，一键运行"
echo ""
echo "🚀 让你的恋人模型真正"完爆"起来吧！"