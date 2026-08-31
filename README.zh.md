# 📦 @goodandready/dsh-context-lens

<div align="center">

<h3>DeepSeek Harness 智能 AST 代码骨架提取器、上下文 Token 压缩与日志精简插件</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/@goodandready/dsh-context-lens"><img src="https://img.shields.io/npm/v/@goodandready/dsh-context-lens.svg?style=for-the-badge&color=6366f1&labelColor=1e1b4b" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10b981.svg?style=for-the-badge&color=10b981&labelColor=064e3b" alt="license"></a>
  <a href="https://github.com/topics/dsh-plugin"><img src="https://img.shields.io/badge/DSH-Plugin-8b5cf6.svg?style=for-the-badge&labelColor=2e1065" alt="DSH Plugin"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node-20%2B-f59e0b.svg?style=for-the-badge&labelColor=451a03" alt="Node version"></a>
</p>

<!-- 官方展示中心跳转按钮 -->
<p align="center">
  <a href="https://goodandready.app/"><img src="https://img.shields.io/badge/作者全部项目-goodandready.app-ff4500.svg?style=for-the-badge&logo=rocket&logoColor=white&labelColor=1a1a2e" alt="作者全部项目"></a>
</p>

<p align="center">
  <a href="README.md"><b>🇬🇧 English</b></a> •
  <a href="README.ru.md"><b>🇷🇺 Русский</b></a> •
  <a href="README.zh.md"><b>🇨🇳 中文说明</b></a>
</p>

</div>

---

## ⚡ 插件概览

**`dsh-context-lens`** 为 **DeepSeek Harness** 智能体提供深度上下文窗口与 Token 预算优化。

超长上下文不仅消耗高昂 Token 成本，还会导致模型注意力涣散并频繁触发限流。本插件通过**工作区文件焦点聚焦、跨语言 AST 结构骨架提取（支持 JS/TS/Python/Go）以及 $O(n)$ 终端测试日志启发式精简**，在保留 100% 架构接口与错误堆栈的前提下，将上下文体积削减**高达 85%**。

```mermaid
graph LR
    subgraph RawContext [原始工作区与终端输出流]
        Code[📁 多文件源码: 包含冗长实现细节] --> LensEngine[dsh-context-lens 压缩引擎]
        Logs[📋 测试与构建日志: 包含海量通过噪音] --> LensEngine
    end

    subgraph LensEngine [上下文加工管线]
        LensEngine --> Focus{焦点状态研判}
        Focus -->|当前聚焦文件| RawKeep[保留完整源码细节]
        Focus -->|非聚焦代码库| AST[AST 骨架提取: 类型、类名、方法签名]
        LensEngine --> LogFilter[日志精简器: 过滤噪音，保留报错堆栈]
    end

    subgraph Savings [Token 收益与推理加速]
        AST --> Agent[🤖 DSH 智能体: 极速紧凑的高价值上下文]
        RawKeep --> Agent
        LogFilter --> Agent
        Agent --> Tracker[📊 实时 Token 节省率监控]
    end

    style RawContext fill:#1e1e2e,stroke:#89b4fa,stroke-width:2px,color:#cdd6f4
    style LensEngine fill:#181825,stroke:#cba6f7,stroke-width:2px,color:#cdd6f4
    style Savings fill:#11111b,stroke:#a6e3a1,stroke-width:2px,color:#cdd6f4
```

---

## 📦 安装指南

```bash
dsh plugin --profile web add @goodandready/dsh-context-lens
```

---

## 📄 开源协议

MIT © [GooDAnDReaDY](https://github.com/GooDAnDReaDY)
