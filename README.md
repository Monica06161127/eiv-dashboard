# EIV Dashboard — Execution-Integrity Validator Demo UI

> **AI × Web3 Agentic Builders Hackathon · Z.AI 赛道**

EIV Dashboard 是 EIV 项目的前端展示层，核心功能：
- **Intent vs Execution Diff**（money shot）— 展示签章授权和链上执行的差异
- **违规列表** — 展示 violation category / severity / detail
- **ERC-8004 Attestation** — 展示上链的验证结果
- **Mock Consumer** — 演示 reputation 如何被用来拒绝不合规的 agent

## 快速开始

### 方式 1：连接 eiv-core API（推荐）

```bash
# 终端 1：启动 eiv-core API
cd eiv-core
python -m eiv.api --port 8000

# 终端 2：打开 dashboard
open index.html
# 或者用本地服务器
python -m http.server 3000
# 然后访问 http://localhost:3000
```

### 方式 2：Mock 模式（API 不在线时）

直接打开 `index.html`，点击「📂 加载 Mock 数据」按钮，用内置数据开发。

## 项目结构

```
eiv-dashboard/
├── index.html          # 主页面
├── style.css           # 暗色主题样式
├── app.js              # 前端逻辑（API 调用 + 渲染）
├── mock-data/          # 可选：更多 mock 数据文件
└── README.md
```

## API 对接

Dashboard 连接 eiv-core 的 HTTP API（默认 `http://127.0.0.1:8000`）：

| API | 用途 | Dashboard 用法 |
|-----|------|---------------|
| `GET /healthz` | 健康检查 | 显示连接状态指示灯 |
| `GET /validations` | 列出所有验证记录 | 左侧列表 |
| `GET /validations/{id}` | 查看单条详情 | 右侧面板（diff + 违规 + attestation） |
| `POST /validate` | 提交验证 | 未来：可加提交表单 |

## 冻结契约（从 eiv-core 接收的数据格式）

```json
{
  "validation_id": "val_xxx",
  "tx_ref": "tx_clean",
  "intent": { "spec": {...}, "signer": "0xUser" },
  "result": {
    "verdict": "PASS | FAIL",
    "violations": [{
      "category": "A:Target",
      "severity": "FAIL | WARN-SAFETY | WARN-SPEC",
      "detail": "人类可读说明"
    }]
  },
  "attestation": {
    "attestation_ref": "0x...",
    "response": 100,
    "tag": "EIV.L2.PASS",
    "verdict": "PASS",
    "n_violations": 0
  }
}
```

## 开发指南

### 当前状态
- ✅ 基础 UI 骨架（暗色主题、响应式）
- ✅ API 对接（连接 eiv-core）
- ✅ Mock 模式（无 API 时可开发）
- ✅ Intent vs Execution diff 视图
- ✅ 违规列表渲染
- ✅ Attestation 信息展示
- ✅ Mock Consumer 决策展示

### 待开发（Week 4）
- [ ] 真实 ExecutionTrace 数据展示（等 John 的 RpcChainAdapter 完成）
- [ ] 金额安全显示（uint256 字符串，不丢精度）
- [ ] PoC 代码展示（FAIL 时显示 Foundry PoC）
- [ ] 截图导出功能（Demo Day 用）
- [ ] 更多场景的 mock 数据
- [ ] 部署到 GitHub Pages / Vercel

### 样式指南
- 暗色主题（GitHub Dark 色系）
- PASS = 绿色 `#3fb950`
- FAIL = 红色 `#f85149`
- WARN = 黄色 `#d29922`
- 金额一律用等宽字体 + 字符串显示

## 相关仓库
- [eiv-core](https://github.com/Monica06161127/eiv-core) — 核心验证逻辑
- [eiv-contracts](https://github.com/Monica06161127/eiv-contracts) — Solidity 合约和部署脚本
- [eiv-docs](https://github.com/Monica06161127/eiv-docs) — 项目文档

## 团队
- **Kieran** — Dashboard owner
- **John** — eiv-core API
- **Luvia** — 运营 / 截图素材
