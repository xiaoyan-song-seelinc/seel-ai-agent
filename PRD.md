# Seel AI Support Agent — 产品需求文档 (PRD)

> **Version:** 4.0 | **Date:** 2026-03-29 | **Status:** Draft for Review

---

## 1. Product Overview

Seel AI Support Agent 是面向电商客服团队的 AI Agent 管理平台。Manager（客服主管）通过与 **Team Lead**（AI 管理助手）对话式交互，配置、训练和监控 **AI Rep**（AI 客服代理）。

核心价值：Manager 不需要学习复杂的配置界面，而是像管理真人员工一样，通过对话来教会 AI Rep 处理客服工单。

---

## 2. 核心概念

### 2.1 角色定义

| 角色 | 类型 | 默认名称 | 职责 | 交互对象 |
| --- | --- | --- | --- | --- |
| **Manager** | 人类 | — | 配置规则、审批动作、处理 Escalation、教学指导 | Team Lead（通过 Communication）、Zendesk Sidebar |
| **Team Lead** | AI | Alex 👔 | Manager 的管理助手，辅助 Playbook 配置、提出 Rule 提案、汇报 Rep 表现 | Manager（通过 Communication） |
| **AI Rep** | AI | Ava | 对外以人类身份回复客户工单，遵循 Rule 和 Action Permission | 客户（通过 Zendesk） |

**Team Lead 与 AI Rep 的关系：** Team Lead 是 Manager 的管理助手，负责接收 Manager 的指令、提出规则建议、汇报 Rep 的学习情况。本期 Team Lead 不直接与 Rep 交互，未来会扩展为可以向 Rep 下达 Rep 级别的 Action Instruction。

**从用户心智角度：** Team Lead 像是一个 Rep 团队的管理者，Manager 通过 Team Lead 来间接管理 Rep 的行为。

### 2.2 Manager 的两个工作界面

Manager 日常在两个界面上操作：

| 界面 | 位置 | 核心用途 | 主要交互 |
| --- | --- | --- | --- |
| **AI Support 模块** | Seel 平台内嵌，含 Communication / Playbook / Performance 三个页面 | 管理 Agent、审阅 Rule 提案、查看表现 | 与 Team Lead 对话、审阅 Rep Escalation、编辑 Playbook |
| **Zendesk Sidebar App** | 嵌入 Zendesk 工单界面的侧边栏（320px） | 在处理工单时查看 AI Rep 状态和建议 | 查看 Handoff Notes、复制 Suggested Reply |

**两个界面的关系：** AI Support 模块是 Manager 的"管理后台"，用于战略层面的配置和监控。Zendesk Sidebar 是 Manager 的"工单现场"，用于在实际处理工单时获取 AI 辅助。两者通过 Ticket ID 关联，Sidebar 中的 Escalation 同步到 Communication 中的 Rep 对话区。

### 2.3 核心实体

| 实体 | 说明 | 归属 |
| --- | --- | --- |
| **Rule** | AI Rep 遵循的业务规则，以编号列表形式呈现 | Playbook |
| **Knowledge Document** | 上传的知识文档，系统自动提取 Rule | Playbook |
| **Action** | AI Rep 可执行的操作（如退款、发送替换品） | Playbook |
| **Action Permission** | 每个 Action 的权限开关 + Guardrail 限制 | Rep Profile |
| **Topic** | Communication 中围绕一个问题的对话单元 | Communication（Team Lead 区域） |
| **Escalation Ticket** | Rep 无法处理而升级的工单 | Communication（Rep 区域） |
| **Zendesk Ticket** | 客户工单，Rep 在其上执行操作 | Zendesk |

### 2.4 实体关系

```
Manager ──对话──▶ Team Lead (via Communication)
    │                   │
    │                   └── 提出 / 接收 ──▶ Rule 提案 (via Topics)
    │
    ├── 配置 ──▶ Playbook
    │               ├── Knowledge Documents ──提取──▶ Rules
    │               └── Rules（所有 Rule 统一管理，通过标签分类）
    │
    ├── 配置 ──▶ Rep Profile
    │               ├── Identity（Name, Personality）
    │               ├── Action Permissions + Guardrails
    │               └── Agent Mode（Production / Training / Off）
    │
    ├── 审阅 ──▶ Escalation Tickets (via Communication → Rep 区域)
    │
    └── 现场辅助 ──▶ Zendesk Sidebar (via Zendesk App)
```

**Rule、Action、Knowledge Document 的关系：**

- Knowledge Document 是 Rule 的来源之一。上传文档后系统自动提取 Rule。
- Rule 是 AI Rep 的行为准则。所有 Rule 是同一种实体，通过标签分类管理（如 Refund、Shipping、Escalation）。
- Action 是 AI Rep 可执行的具体操作。每个 Action 有独立的 Permission 开关和 Guardrail 限制。
- Rule 指导 Rep "什么情况下做什么"；Action Permission 限制 Rep "能不能做"；Guardrail 限制 Rep "做到什么程度"。

### 2.5 Agent Mode

| Mode | 行为 | Zendesk 表现 | 何时使用 |
| --- | --- | --- | --- |
| **Production** | 直接回复客户；遇到不确定场景时 Escalate + 发送 Gap Signal | 公开回复 + 偶尔 Internal Note | Rep 已充分训练 |
| **Training** | 仅以 Internal Note 形式发送所有内容（包括建议回复和 Gap Signal） | 仅 Internal Note | 新 Rep 或重大规则变更后 |
| **Off** | 不处理任何工单 | 所有工单分配给人类 | 暂停 AI |

**Production 与 Training 的核心区别：** Production 模式下 Rep 可以直接发送公开回复，但遇到不确定场景时仍会发 Internal Note 请求指导。Training 模式下 Rep 的所有输出都是 Internal Note，Manager 需要手动复制并发送。

**Agent 处理逻辑（AI Rep 工单回复）：** 每当新 ticket 分配给 AI Rep 或已有 ticket 收到客户新消息时，Orchestrator 将 ticket context（工单内容、客户历史、对话记录）和 agent config（mode、identity、rules、action permissions、knowledge docs）传入 AI Rep。AI Rep 按以下决策框架处理：

1. **分类**客户意图（如 refund request、damage claim、shipping inquiry）
2. **检索**匹配的 Rule
3. **检查**所需 Action 的权限
4. **决策**：
   - 匹配到 Rule + 有 Action 权限 → **Direct Reply**（Production 模式公开回复；Training 模式 Internal Note）
   - 匹配到 Rule 但无 Action 权限 → **Escalation**（Internal Note + Escalate）
   - 无匹配 Rule → **Escalation + Gap Signal**（Internal Note + Escalate + 发送结构化 Gap Signal 给 Orchestrator）
   - 匹配到 Rule 但不确定 / 规则冲突 → **Reply + Gap Signal**（回复客户 + 发送 Gap Signal）

### 2.6 Action Permission

**MVP 版本采用两级制：**

| 级别 | 说明 | 示例 |
| --- | --- | --- |
| **Autonomous** | Rep 在支持范围内自行执行，无需审批 | 查询物流、关闭工单、$150 以下退款 |
| **Disabled** | Rep 不可执行，遇到时升级给人类 | 创建优惠券、大额退款 |

> **Future:** Ask Permission 级别将在后续版本支持。届时 Rep 可以草拟动作等待 Manager 审批。

**Guardrail 嵌入 Action Permission：** 每个打开的 Action 可附带 Guardrail 条件。Guardrail 是逻辑上可行但业务规则上不允许的限制。

| Action | Permission | Guardrail |
| --- | --- | --- |
| Issue Refund | Autonomous | 单笔不超过 $200；不适用于 Final Sale 商品 |
| Send Replacement | Autonomous | 仅限首次退换 |
| Apply Discount | Disabled | — |
| Close Ticket | Autonomous | （无限制） |

### 2.7 Zendesk Ticket 状态

**MVP 版本（无 Ask Permission）：**

| 状态 | 含义 | Sidebar 展示 | Manager 操作 |
| --- | --- | --- | --- |
| **AI Handling** | Rep 正常处理中 | 绿色脉冲点 + "AI is handling this" | 无需操作 |
| **Escalated** | Rep 无法处理 | 红色警告 + "Needs your attention" + Handoff Notes + Suggested Reply | 自行处理工单 |

> **Future:** Request for Approval 状态将在 Ask Permission 上线后支持。届时 Sidebar 增加 Approve/Deny 按钮。

### 2.8 信息架构

```
Seel 平台（全局左侧导航）
├── Home / Analytics / Orders / Issues / Protection / Reviews（其他模块）
├── Integrations（全局集成管理，含 Zendesk 连接设置）
└── AI Support（模块入口）
    ├── Communication（默认页）
    │   ├── 左侧窄栏（56px）：Team Lead + Rep 头像切换
    │   ├── Team Lead 区域
    │   │   ├── Conversation Tab（默认）：Topic 卡片流
    │   │   └── Onboarding Tab：首次配置对话流
    │   └── Rep 区域
    │       ├── Escalation Feed：升级工单卡片列表
    │       └── Profile Panel（侧边栏）：查看/编辑 Rep 配置
    ├── Playbook
    │   ├── Rules Tab：规则列表 + 详情 Sheet
    │   └── Documents Tab：文档管理 + 上传
    └── Performance
        ├── KPI 卡片（4 项指标）
        ├── 趋势图（Resolution / CSAT）
        └── Intent 分析表

独立界面：
└── Zendesk Sidebar App（嵌入 Zendesk，320px 宽）
    ├── AI Handling 状态
    └── Escalated 状态（Handoff Notes + Suggested Reply）
```

---

# 需求详情

---

## Onboarding（首次配置流程）

Onboarding 在 Communication → Team Lead 区域的 **Onboarding Tab** 中完成。Team Lead (Alex) 以对话方式引导 Manager 完成首次配置。整个流程分为两个大阶段："准备 Playbook"和"Hire Rep"。

### 阶段划分与用户流程

| 阶段 | 步骤 | 展示什么内容 | 用户做什么 | 完成标志 |
| --- | --- | --- | --- | --- |
| **欢迎** | Alex 自我介绍 | Alex 的对话气泡：自我介绍 + 说明 Zendesk/Shopify 已连接 + 告知需要两件事 | Manager 阅读 | 自动进入下一步 |
| **文档导入** | 上传客服 SOP 文档 | 对话气泡说明需要上传培训文档 + 文件上传区域（拖拽/点击）+ URL 粘贴输入框 + "Try with Seel Return Guidelines" demo 链接 | 上传文件 / 粘贴 URL / 点击 demo | 文件上传成功 |
| **规则提取** | 系统处理文档 | 对话气泡说明正在分析文档 + 旋转加载动画 + "Analyzing documents..." 文字。真实上传额外展示"通常需要 30-60 分钟，可以稍后回来"的提示 | 等待（demo 模式可点击 "Skip to results"） | 提取完成 |
| **提取结果** | 展示提取的规则 | 对话气泡展示提取的规则数量 + 规则列表（每条带绿色勾号）+ 超过 5 条时显示"+N more rules"折叠链接 + 冲突数量提示 | 点击 "Review conflicts" 进入冲突解决 | 点击按钮 |
| **冲突解决** | 逐条解决冲突 | 每条冲突一个独立对话气泡（琥珀色背景）：展示冲突编号（"Conflict X of Y"）、冲突标题、冲突描述（两条规则的矛盾点）、多个选项按钮（Pill 形式）+ Dismiss 按钮 | 选择一个选项 / 点击 Dismiss 跳过 | 所有冲突处理完毕 |
| **Hire Rep** | 创建 AI Rep | 对话气泡说明"Let's hire your first support rep" + 推荐从 WISMO 开始 + "Review & Hire Support Rep" 按钮 → 弹出 Hire Rep Dialog | 在 Dialog 中配置并点击 Hire | Rep 创建成功 |

### Agent 处理逻辑

文档导入后，Orchestrator 调用 Team Lead 的 **Document → Rules Skill** 提取 Rule。提取过程中 Team Lead 自动检测冲突（同一场景的不同处理方式），同时标记模糊表述（如"30 days from purchase"是指下单日还是收货日）。冲突以独立对话气泡形式逐条展示，每条冲突提供多个选项供 Manager 选择，也可 Dismiss 跳过（使用默认行为）。

**Team Lead Document → Rules Skill 输入输出：**

- **输入：** 文档内容（parsed text）+ 已有 Rules
- **输出：** extracted_rules（每条含 text、source、tags、source_location）+ ambiguities（每条含 description、suggested_clarification）
- **冲突检测：** 如果提取的 Rule 与历史工单行为不一致（如文档说 30 天退货，但历史上 VIP 客户被允许 45 天），Team Lead 会展示冲突并建议解决方案

### Hire Rep Dialog 字段说明

Hire Rep Dialog 以弹窗形式展示，分为左右两栏：

**左栏 — 基础配置：**

| 字段 | 展示什么内容 | 交互方式 |
| --- | --- | --- |
| Name | 文本输入框，默认值 "Ava" | 可编辑 |
| Personality | 5 个 Pill 选项：Friendly 👋 / Neutral 🏛️ / Matter-of-fact 📋 / Professional 💼 / Humorous 😄 | 单选 |
| Mode | 下拉选择：Training / Production / Off | 单选 |

**右栏 — Allowed Actions：**

| 字段 | 展示什么内容 | 交互方式 |
| --- | --- | --- |
| Action 列表 | 按 Category 分组展示所有 Action，每个 Action 一行：Checkbox + Action 名称 + Guardrail 描述（如有） | Checkbox 开关 |

### Sanity Check 流程

Hire Rep 完成后，系统切换到 Rep 区域，Rep 以对话方式展示 3 个模拟场景。每个场景包含：

| 字段 | 展示什么内容 |
| --- | --- |
| 场景标题 | 如 "Scenario 1 — Where is my order?" |
| 客户消息 | 模拟的客户原文（斜体） |
| Rep 推理过程 | Rep 说明会怎么做：查询什么系统、匹配什么规则、采取什么行动 |
| 草拟回复 | Rep 草拟的客户回复（引用块样式） |
| 判断说明 | Rep 说明为什么这样处理（如"这是只读操作"或"我没有权限，需要升级"） |

**Agent 处理逻辑：** Orchestrator 调用 AI Rep 的 **Sanity Check Skill**，输入当前配置的 rules、action permissions、identity，输出每个场景的 intent 分类、匹配的 rules、采取的 actions、草拟回复和置信度。

Manager 对每个场景回复"That's right"或提出修改意见。3 个场景完成后，Rep 询问运行模式（Training / Production），Manager 选择后 Rep 确认上线。

### 边界条件

| 场景 | 处理方式 |
| --- | --- |
| 中途退出 | 状态保留在当前步骤，下次进入从断点继续 |
| 文档内容模糊 | Team Lead 标记为 ambiguity，展示澄清问题让 Manager 补充 |
| 提取规则数量为 0 | 引导手动上传或直接进入对话式教学 |
| Sanity Check 全部不满意 | 提供修改配置的入口，回到 Rep Profile 编辑 |
| Onboarding 完成后 | 配置写入 Playbook 和 Rep Profile，自动切换到 Conversation Tab |

---

## Communication — Team Lead 对话

Communication 是 Manager 与 Team Lead (Alex) 的主要对话界面。左侧窄栏（56px，仅头像）切换 Team Lead / Rep 两个区域。Team Lead 区域有两个 Tab：**Conversation**（默认）和 **Onboarding**。

Conversation 采用 **Feishu 风格的 Topic 分组**：每个 Topic 是一个独立的对话卡片，包含 Alex 头像、发送时间、消息内容、Rule 提案卡片和内联回复预览。所有 Topic 按时间倒序排列。右上角 List 图标可打开 All Topics 侧边栏，展示所有 Topic 的标题列表。

### Topic 展示内容

每个 Topic 卡片展示以下内容：

| 字段 | 展示什么内容 | 何时展示 |
| --- | --- | --- |
| Alex 头像 | 👔 图标，teal 色圆形背景 | 始终 |
| 发送者名称 | "Alex" | 始终 |
| 发送时间 | 相对时间（如 "2h ago"、"yesterday"） | 始终 |
| 状态标记 | 黄色圆点 = 有 pending 的 Rule 提案需要操作；蓝色圆点 = 有未读 AI 消息 | 有对应状态时 |
| 消息内容 | Alex 的上下文说明文字（支持 Markdown 加粗） | 始终 |
| Source 链接 | "Source: Ticket #XXXX"，可点击跳转 | 有关联 Ticket 时 |
| Rule 提案卡片 | 结构化卡片（见下方详细说明） | Topic 包含 Rule 提案时 |
| 回复预览 | 展示回复数量 + 最近几条回复的发送者头像和内容摘要（前 60 字符） | 有回复时 |
| "Reply to topic" 链接 | 点击打开 Thread 侧边栏 | 始终 |

### Topic 数据结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 唯一标识 |
| type | TopicType | 类型：knowledge_gap / performance_report / performance_summary / open_question / escalation_review / rule_update |
| title | string | 标题，如 "Refund to different payment method" |
| status | TopicStatus | 状态：unread / read / resolved |
| createdAt | string | 创建时间 |
| updatedAt | string | 最后更新时间 |
| preview | string | 预览文本（用于 All Topics 列表展示） |
| messages | Message[] | 消息列表（每条含 id、sender、content、timestamp） |
| sourceTicketId | string? | 关联的 Zendesk Ticket ID |
| proposedRule | ProposedRule? | 附带的 Rule 提案 |

### Flow 1: Team Lead 主动提案 Rule（Gap Signal 驱动）

Team Lead 在 Rep 处理工单过程中发现知识缺口或规则不足，主动向 Manager 提出规则提案。

**Agent 处理逻辑：**

1. AI Rep 处理 ticket 时检测到无匹配 Rule（或规则冲突、不确定），发出结构化 **Gap Signal** 给 Orchestrator。Gap Signal 包含：gap_type（no_rule / rule_conflict / uncertain / permission_denied）、description、ticket_id、customer_intent、attempted_action、context。
2. Orchestrator 收到 Gap Signal 后，**去重检查**是否已有相同 gap 的 Topic（已有则追加到现有 Topic，没有则创建新 Topic）。
3. Orchestrator 调用 Team Lead 的 **Gap → Rule Proposal Skill**。Team Lead 分析 Gap Signal + 已有 Rules + 历史模式（如过去 30 天类似 ticket 的处理方式），生成 Rule 提案。
4. Orchestrator 将 Topic 推送到 Communication 的 Conversation 区域。

**用户流程：**

```
Topic 卡片出现在 Conversation 中（黄色圆点标记）
    │
    ├── 上下文消息：Alex 说明观察到的模式、涉及的工单编号、频率
    │   （如"I escalated ticket #4501 because the customer requested a refund
    │    to PayPal. I've seen 3 similar requests in the last 30 days."）
    │
    └── Rule 提案卡片（结构化展示）
        │
        ▼
Manager 操作
    ├── Accept → Rule 写入 Playbook（status: active），Topic 标记为 resolved
    ├── Reject → Rule 不生效，Topic 标记为 resolved
    └── Reply → 打开 Thread 侧边栏继续对话，Team Lead 修正提案后再次请求确认
```

### Flow 2: Manager 主动下达 Rule

**Agent 处理逻辑：** Manager 消息通过前端发送给 Orchestrator，路由到 Team Lead 的 **Manager Directive → Rule Skill**。Team Lead 将自由文本解析为结构化 Rule（含 tags、validUntil 等字段），检查与现有 Rule 的冲突，返回确认消息和 Rule 卡片。如果指令含糊，Team Lead 先展示自己的理解并明确假设（如"I understand this as: [rule]. I'm assuming this applies to online orders only — should it also cover in-store?"）。

**用户流程：**

```
Manager 在底部输入框发送指令（如"春季促销期间退货窗口延长到 60 天"）
    │
    ▼
Team Lead 解析指令，生成结构化 Rule
    │
    ▼
Team Lead 回复确认（展示理解的内容 + Rule 卡片）
    │
    ▼
Manager 二次确认
    ├── Accept → Rule 生效，写入 Playbook
    └── 继续对话 → Team Lead 修正后再次请求确认
```

### Flow 3: Rep 从 Manager 行为中学习

**触发条件：** Zendesk Webhook 检测到 Manager 在 escalated ticket 上添加回复或关闭 ticket。

**Agent 处理逻辑：**

1. Webhook 触发（订阅 `ticket.comment_added` / `ticket.status_changed` / `ticket.agent_assignment_changed`）
2. Orchestrator 检查 ticket 是否由 AI Rep escalate → 是
3. Orchestrator 调用 Zendesk REST API 获取完整 ticket 内容（包括 Manager 的回复、order value、customer tier 等）
4. Orchestrator 调用 Team Lead 的 **Behavior Observation Skill**。Team Lead 对比 Manager 的实际操作与当前 Rule，推断通用原则（如"Manager 处理了 $34.99 的损坏物品没要求照片 → 推断低价物品不需要照片"），生成 Rule Update 提案。
5. Orchestrator 推送到 Communication。

**用户流程：**

```
Topic 出现在 Conversation 中（类型为 escalation_review）
    │
    ├── 上下文消息：Alex 说明"我注意到你在 #4412 上直接处理了退款，没有要求照片。
    │   我理解了：$80 以下的损坏物品不需要照片证据。"
    │
    └── Rule Update 卡片（展示 Current → Updated）
        │
        ▼
Manager 操作：Accept / Reject / Reply（与 Flow 1 相同）
```

### Rule 提案卡片展示内容

| 字段 | 展示什么内容 | 何时展示 |
| --- | --- | --- |
| 类型标签 | "PROPOSED NEW RULE" 或 "PROPOSED RULE UPDATE"（大写灰色小字） | 始终 |
| 规则名称 | 如 "Refund Payment Method Policy"（加粗） | 始终 |
| Current | 被修改的原规则文本（斜体、灰色） | 仅 Rule Update |
| Updated / Content | 新规则文本（正常字体） | 始终 |
| Source 链接 | 关联的 Ticket 编号，可点击跳转 | 有关联 Ticket 时 |
| Accept 按钮 | 绿色背景 + 勾号 | 提案状态为 pending 时 |
| Reject 按钮 | 红色背景 + 叉号 | 提案状态为 pending 时 |
| Reply 按钮 | 灰色背景 + 消息图标 | 提案状态为 pending 时 |
| Accepted Badge | 绿色 outline badge "Accepted" | 提案已接受时 |

### ProposedRule 数据结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 唯一标识 |
| text | string | 规则完整文本 |
| ruleName | string | 规则名称 |
| type | "new" \| "update" | 新增还是更新 |
| before | string? | 更新前的规则文本（仅 update） |
| after | string | 更新后的规则文本 |
| source | string? | 来源 Ticket 编号 |
| category | string | 分类 |
| evidence | string[] | 支撑证据列表 |
| status | "pending" \| "accepted" \| "rejected" | 审批状态 |

### Weekly Performance Summary

Team Lead 每周自动生成一份 Performance Summary，以 Topic 形式出现在 Conversation 中（type 为 `performance_summary`）。展示内容：

| 字段 | 展示什么内容 |
| --- | --- |
| 标题 | "Weekly Performance Summary"（14px 加粗） |
| 处理量 | 本周处理 Ticket 数量及环比变化 |
| 核心指标 | Auto-resolution Rate、CSAT、Escalation Rate、First Response Time |
| 最佳/最差 Intent | 表现最好和最需改进的 Intent 类别 |
| 改进建议 | 可操作的改进建议 |

### Thread 侧边栏

点击 Topic 的 "Reply to topic" 或回复预览时，右侧打开 360px 宽的 Thread 侧边栏，展示：

| 字段 | 展示什么内容 |
| --- | --- |
| 标题栏 | "Topic" + 关闭按钮 |
| 消息列表 | 该 Topic 下所有消息，每条展示发送者头像、名称（Alex / You）、时间、内容 |
| 回复输入框 | 底部文本输入框 + 发送按钮 |

### All Topics 侧边栏

点击右上角 List 图标时，右侧打开 280px 宽的 All Topics 侧边栏，展示：

| 字段 | 展示什么内容 |
| --- | --- |
| 标题栏 | "All Topics" + 关闭按钮 |
| Topic 列表 | 每个 Topic 一行：标题 + 状态标记（黄/蓝圆点）+ 消息数量 + 相对时间 |

### 边界条件

| 场景 | 处理方式 |
| --- | --- |
| 新 Rule 与已有 Rule 矛盾 | Team Lead 提交提案时自动检测冲突，展示两条规则让 Manager 选择 |
| Manager 发送的指令含糊不清 | Team Lead 先确认理解并明确假设，再生成 Rule |
| Topic 长时间无人处理 | 定期 bump 提醒 |
| Rule Update 的 Before/After 内容很长 | 默认折叠，Show more 展开 |

---

## Communication — Rep 管理

Rep 区域在 Communication 左侧窄栏点击 Rep 头像后展示。包含 **Escalation Feed**（主内容区）和 **Profile Panel**（右侧侧边栏，点击 Profile 按钮展开）。

### Rep 区域头部

| 字段 | 展示什么内容 |
| --- | --- |
| Rep 头像 | 紫色圆形背景 + 姓名首字母 |
| Rep 名称 | 如 "Ava" |
| 角色描述 | "L1 — WISMO Specialist · Onboarding"（或 Working） |
| Profile 按钮 | 右侧 outline 按钮，点击展开/关闭 Profile Panel |

### Escalation Feed

Escalation Feed 以时间倒序展示 Rep 升级的工单卡片。在 Onboarding 完成后，Rep 确认上线的消息之后展示。

**Escalation 卡片展示内容：**

| 字段 | 展示什么内容 | 何时展示 |
| --- | --- | --- |
| Ticket ID + Subject | 如 "#4501 · Refund to PayPal request" | 始终 |
| Summary | 工单摘要（最多 2 行，超出截断） | 始终 |
| 时间 | 相对时间（如 "2h ago"） | 始终 |
| Status Badge | "Needs attention"（琥珀色）或 "Resolved"（灰色） | 始终 |

**已解决的卡片样式：** 边框变淡、背景变灰、整体透明度降低（opacity 0.6）。

**EscalationTicket 数据结构：**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 唯一标识 |
| zendeskTicketId | string | Zendesk 工单 ID |
| subject | string | 工单标题 |
| customerName | string | 客户姓名 |
| customerEmail | string | 客户邮箱 |
| status | EscalationStatus | needs_attention / resolved |
| reason | string | 升级原因 |
| summary | string | 工单摘要 |
| sentiment | "frustrated" \| "neutral" \| "urgent" | 客户情绪 |
| orderValue | number? | 订单金额 |
| createdAt | string | 升级时间 |
| resolvedAt | string? | 解决时间 |
| zendeskUrl | string | Zendesk 工单链接 |

**Agent 处理逻辑：** AI Rep 在处理 ticket 时判断无法处理（无匹配 Rule、无 Action 权限、客户要求人工等），发出 Escalation 信号。Orchestrator 更新 ticket 状态为 escalated，在 Zendesk 中发送 Internal Note（含 Handoff Notes 和 Suggested Reply），同时在 Communication 的 Rep 区域创建 Escalation 卡片。

**状态自动同步：** Manager 在 Zendesk 中处理完 escalated ticket 后，Webhook 检测到操作，自动将 Communication 中对应的 Escalation 卡片状态更新为 resolved。同时触发 Team Lead 的 Behavior Observation Skill，在 Team Lead 区域生成 Rule 提案（Flow 3）。

### Rep Profile Panel

Profile Panel 为 320px 宽的右侧侧边栏，默认为**查看模式**，右上角有 Edit 按钮切换到**编辑模式**。

**查看模式展示内容：**

| 区域 | 字段 | 展示什么内容 |
| --- | --- | --- |
| 头像区 | 头像 | 紫色圆角方形背景 + 姓名首字母（大号） |
| 头像区 | 名称 | Rep 名称（如 "Ava"） |
| 头像区 | Mode Badge | 当前模式标签（如 "TRAINING" 琥珀色） |
| 操作 | Edit Profile 按钮 | 全宽 outline 按钮，点击切换到编辑模式 |
| Details | Personality | 如 "Warm & Professional" |
| Details | Mode | 如 "Training" |
| Details | Started | 如 "Mar 29, 2026" |
| Performance | Tickets | 如 "0 total / 0 today" |
| Performance | Resolution | 如 "0%" |
| Performance | CSAT | 如 "0" |
| Performance | Avg Response | 如 "2m 15s" |
| Performance | "View more →" 链接 | 点击跳转到 Performance 页面 |
| Config History | 折叠列表 | 默认折叠，展开后展示配置变更时间线：每条含 commit hash（紫色 badge）、变更描述、作者、时间 |

**编辑模式展示内容：**

| 字段 | 展示什么内容 | 交互方式 |
| --- | --- | --- |
| Name | 文本输入框，当前值 | 可编辑 |
| Personality | 5 个 Pill 选项（同 Hire Rep Dialog） | 单选 |
| Mode | 下拉选择：Training / Production / Off | 单选 |
| Allowed Actions | 按 Category 分组的 Action 列表，每个 Action 带 Checkbox + Guardrail 描述 | Checkbox 开关 |
| Save Changes 按钮 | 全宽主色按钮 | 点击保存 |

### 边界条件

| 场景 | 处理方式 |
| --- | --- |
| Production → Off 切换 | 确认对话："当前有 N 个进行中工单，切换后将分配给人类" |
| Production → Training 切换 | 进行中的工单继续以 Production 模式完成，新工单以 Training 模式处理 |
| 修改 Personality / Name 后 | 仅对新对话生效 |
| Escalated ticket Manager 长时间未处理 | 设置 SLA 提醒 |
| 客户在 Escalation 等待期间继续发消息 | Rep 发送安抚消息告知正在转接 |

---

## Playbook

Playbook 是 AI Rep 的知识库和规则配置中心。包含 **Rules** 和 **Documents** 两个 Tab。

### Rules

Rules 以编号列表形式展示。每条 Rule 在列表中展示：

| 字段 | 展示什么内容 | 何时展示 |
| --- | --- | --- |
| 编号 | 自增序号（如 "01"） | 始终 |
| 规则名称 | 如 "Standard Return & Refund" | 始终 |
| 一行预览 | Policy 前 120 字符 | 始终 |
| 使用次数 | 如 "Used 342 times" | 始终 |

点击 Rule 行打开右侧 **Rule 详情 Sheet**（侧边抽屉），包含 **Content** 和 **Stats** 两个 Tab。

**Rule 详情 — Content Tab 展示内容：**

| 区域 | 展示什么内容 |
| --- | --- |
| 规则名称 | 大号标题 |
| Intent | 意图分类标签（如 "Returns / Refunds"） |
| Policy 正文 | 完整的规则文本（长文本，包含处理流程、条件、例外情况、升级条件等） |
| Actions | 关联的 Action 名称列表（Pills 形式，如 "Issue Refund"、"Send Replacement"） |
| Version History | 可折叠的时间线，每条记录展示：版本号（如 "v2"）、日期、变更描述、来源对话链接（如 "From conversation: Damaged item photo not always needed"） |

**Rule 详情 — Stats Tab 展示内容：**

| 指标 | 展示什么内容 |
| --- | --- |
| Used | 被匹配使用的总次数（如 "342"） |
| Avg CSAT | 使用此规则的工单平均满意度（如 "4.6"） |
| Deflection | 使用此规则的工单自动解决率（如 "89%"） |

**SOPRule 数据结构：**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 唯一标识 |
| name | string | 规则名称 |
| intent | string | 意图分类 |
| policy | string | 规则正文 |
| exceptions | string[] | 例外情况列表 |
| escalation | RuleEscalation | 升级条件（trigger + action） |
| lastUpdated | string | 最后更新时间 |
| updatedByTopicId | string? | 最后更新来源的 Topic ID |
| sourceDocId | string? | 来源文档 ID |
| tags | string[]? | 标签（预留字段，MVP 不做筛选 UI） |
| actions | string[]? | 关联的 Action ID 列表 |
| invocationCount | number | 被匹配使用的次数 |
| avgCsat | number | 使用此规则的工单平均 CSAT |
| deflectionRate | number | 使用此规则的工单自动解决率（%） |
| versions | RuleVersion[] | 版本历史 |

**RuleVersion 数据结构：**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| version | number | 版本号 |
| text | string | 该版本的规则文本 |
| changedAt | string | 变更时间 |
| conversationId | string? | 来源对话 Topic ID |
| conversationTitle | string? | 来源对话标题 |
| changeDescription | string | 变更描述 |

### Documents

Documents 展示已上传的知识文档列表。顶部搜索框和 Add 按钮在同一行。

**文档行展示内容：**

| 字段 | 展示什么内容 | 何时展示 |
| --- | --- | --- |
| 类型图标 | PDF（红色）/ DOC（蓝色）/ CSV（绿色）/ URL（紫色） | 始终 |
| 文档名称 | 文件名或 URL 标题 | 始终 |
| 文件大小 | 如 "2.4 MB" | 有值时 |
| 上传时间 | 如 "Uploaded Mar 15" | 始终 |
| 处理状态 | "Processed"（绿色 badge）/ "Processing..."（黄色 badge） | 始终 |
| In Use 开关 | 启用/禁用文档 | 始终 |
| 三点菜单 | View / Open URL / Remove | 始终 |

**Upload Document Dialog（三种方式）：**

| 方式 | 展示什么内容 |
| --- | --- |
| Upload File | 拖拽区域 + 点击上传，支持 PDF / DOC / DOCX / CSV / TXT，最大 10 MB |
| Add URL | URL 输入框 + 可选的名称输入框 |
| Manual Input | 标题输入框 + 内容文本区域 |

上传后展示处理提示：Alex (Team Lead) 将处理内容并提取规则，通常需要 30-60 分钟。

**KnowledgeDocument 数据结构：**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 唯一标识 |
| name | string | 文档名称 |
| type | "pdf" \| "doc" \| "csv" \| "url" | 文档类型 |
| uploadedAt | string | 上传时间 |
| size | string | 文件大小 |
| extractedRules | number | 提取的规则数量 |
| status | "processed" \| "processing" \| "error" | 处理状态 |
| sourceUrl | string? | 来源 URL（仅 url 类型） |
| inUse | boolean | 是否启用 |

### 边界条件

| 场景 | 处理方式 |
| --- | --- |
| 上传文档内容模糊或自相矛盾 | 标记为"需要澄清"，让 Manager 补充说明 |
| 文档更新（上传新版本） | 自动 diff 新旧版本的规则变化，展示给 Manager 确认 |
| 删除文档后关联 Rule 处理 | 提示 Manager 选择保留或删除 |
| 新文档规则与现有规则冲突 | 展示冲突警告，两个版本 A/B 选择 |
| Guardrail 参数设为 0 或负数 | 输入校验，最小值限制 |
| 禁用 Action 时有依赖关系 | 提示并自动禁用依赖 Action |

---

## Performance

Performance 是 AI Rep 的数据看板。

### 功能组成

| 区域 | 展示什么内容 |
| --- | --- |
| 时间范围切换 | 7d / 14d / 30d 三个按钮 |
| KPI 卡片（4 项） | Auto-Resolution Rate、CSAT Score、Escalation Rate、First Response Time |
| 趋势图 | Resolution & Escalation Rates 折线图、CSAT Score Trend 折线图 |
| Intent 分析表 | 按 Intent 维度的表格 |

### KPI 卡片展示内容

| 指标 | 展示什么内容 | Trend 说明 |
| --- | --- | --- |
| Auto-Resolution Rate | 百分比值（如 "78.5%"） | vs last week（正值为改善） |
| CSAT Score | 分数值（如 "4.6 /5"） | vs last week |
| Escalation Rate | 百分比值（如 "12.3%"） | vs last week（负值为改善） |
| First Response Time | 秒数值（如 "45s"） | vs last week（负值为改善） |

### Intent 分析表展示内容

| 列 | 展示什么内容 |
| --- | --- |
| Intent | Intent 名称（如 "Order Status / WISMO"） |
| Volume | 工单量 |
| Resolution Rate | 自动解决率（%） |
| CSAT | 平均 CSAT |
| Avg Turns | 平均对话轮次 |
| Escalation Rate | 升级率（%） |

### PerformanceMetric 数据结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| label | string | 指标名称 |
| value | number | 当前值 |
| unit | string | 单位 |
| trend | number | 环比变化值 |
| trendLabel | string | 环比说明 |

### IntentMetric 数据结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| intent | string | Intent 名称 |
| volume | number | 工单量 |
| resolutionRate | number | 自动解决率（%） |
| csat | number | 平均 CSAT |
| avgTurns | number | 平均对话轮次 |
| escalationRate | number | 升级率（%） |

### 边界条件

| 场景 | 处理方式 |
| --- | --- |
| 某 Intent 表现持续下降 | Team Lead 主动在 Communication 中报告并建议改进 |
| 数据量不足（新 Rep 刚上线） | 展示"数据积累中"提示 |

---

## Zendesk Sidebar App

Zendesk Sidebar App 是嵌入 Zendesk 的 320px 宽侧边栏。Manager 在处理工单时查看 AI Rep 的状态和建议。

### MVP 状态（两种）

| 状态 | 状态条样式 | 展示什么内容 | Manager 做什么 |
| --- | --- | --- | --- |
| **AI Handling** | 绿色脉冲点 + "AI is handling this" | Intent、Confidence、Current Step | 无需操作 |
| **Escalated** | 红色警告图标 + "Needs your attention" | Handoff Notes + Suggested Reply | 复制 Suggested Reply 后自行处理 |

### AI Handling 状态展示内容

| 字段 | 展示什么内容 | 何时展示 |
| --- | --- | --- |
| 状态条 | 绿色脉冲点 + "AI is handling this" 文字 | 始终 |
| Intent | AI 识别的客户意图（如 "Order Status Inquiry"） | 有值时 |
| Confidence | AI 置信度百分比（如 "95%"） | 有值时 |
| Status | 当前处理步骤描述（如 "Looking up order in Shopify..."） | 有值时 |

### Escalated 状态展示内容

| 字段 | 展示什么内容 | 何时展示 |
| --- | --- | --- |
| 状态条 | 红色警告图标 + "Needs your attention" 文字 | 始终 |
| Handoff Notes 标题 | "Handoff Notes" 灰色小标题 | 始终 |
| Handoff Notes 内容 | Rep 的交接说明：升级原因 + 上下文（如"Customer requesting refund to PayPal instead of original credit card. My current rules only cover refunds to the original payment method."） | 始终 |
| Suggested Reply 标题 | "Suggested Reply" 灰色小标题 | Suggested Reply 存在时 |
| Suggested Reply 内容 | Rep 建议的回复文本（灰色背景区域） | Suggested Reply 存在时 |
| Copy 按钮 | 复制 Suggested Reply 到剪贴板 | Suggested Reply 存在时 |

### ZendeskTicket 数据结构（Sidebar 用）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | Ticket ID |
| subject | string | 工单标题 |
| customerName | string | 客户姓名 |
| state | "handling" \| "escalated" | 当前状态 |
| intentDetected | string? | AI 识别的意图 |
| confidence | number? | AI 置信度（0-1） |
| currentStep | string? | 当前处理步骤 |
| internalNote | string? | Handoff Notes（escalated 时） |
| suggestedReply | string? | 建议回复（escalated 时） |

### 边界条件

| 场景 | 处理方式 |
| --- | --- |
| Escalated ticket Manager 长时间未处理 | SLA 提醒，超时后二次通知 |
| 客户在 Escalation 等待期间继续发消息 | Rep 发送安抚消息告知正在转接 |
| Escalated 后 Manager 处理完毕 | Webhook 触发学习流程，Team Lead 在 Communication 中总结学到的内容（Flow 3） |
| 客户工单被合并 | 检测合并事件，更新 Sidebar 展示 |

---

## Integrations

Integrations 是全局页面（不在 AI Support 模块内），管理 Zendesk 连接。

### Zendesk 集成设置

提供两种集成方式：

| 方式 | 用途 | 展示什么内容 |
| --- | --- | --- |
| **Sidebar App** | 在 Zendesk 工单界面嵌入 Seel 侧边栏 | 获取 Token 的步骤说明 + Token 复制框 + Zendesk Admin Center 配置指引 |
| **AI Support Access** | 让 AI Rep 能够读写 Zendesk 工单 | OAuth 授权按钮 + Agent Seat 验证 + Routing 配置说明 |

---

## 数据模型摘要

### 核心枚举类型

```typescript
type TopicType = "knowledge_gap" | "performance_report" | "performance_summary" | "open_question" | "escalation_review" | "rule_update";
type TopicStatus = "unread" | "read" | "resolved";
type MessageSender = "ai" | "manager";
type PermissionLevel = "autonomous" | "disabled";  // Future: "ask_permission"
type AgentMode = "training" | "production" | "off";
type TicketSidebarState = "handling" | "escalated";  // Future: "approval"
type EscalationStatus = "needs_attention" | "resolved";
```

### Guardrail 数据结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 唯一标识 |
| label | string | 限制名称，如 "Max refund amount" |
| type | "number" \| "boolean" | 值类型 |
| value | number? | 数值（仅 number 类型） |
| unit | string? | 单位，如 "$"、"%"、"turns" |
| enabled | boolean | 是否启用 |

### ActionPermission 数据结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 唯一标识 |
| name | string | Action 名称 |
| description | string | Action 描述 |
| category | string | 分类（如 "Order Management"） |
| permission | PermissionLevel | 权限级别 |
| guardrails | Guardrail[]? | 限制条件列表 |
| lastModified | string | 最后修改时间 |
| dependsOn | string[]? | 依赖的其他 Action ID |

---

## MVP vs Future

| 功能 | MVP | Future |
| --- | --- | --- |
| Agent Mode: Production / Training / Off | Yes | — |
| Action Permission: Autonomous / Disabled | Yes | Ask Permission 级别 |
| Zendesk Sidebar: AI Handling / Escalated | Yes | Request for Approval 状态 |
| Zendesk Sidebar: Copy Suggested Reply | Yes | — |
| Rule 提案: Gap Signal 实时学习 | Yes | — |
| Rule 提案: Manager 行为观察学习 | Yes | — |
| Rule 提案: 定时批量分析 | No | Analyst Subagent |
| Rule 标签筛选 UI | No | 数据结构预留 |
| Rule 版本历史（Playbook 内展示） | Yes | — |
| 多 Rep 管理 | No | 多 Rep 支持 |
| Team Lead 直接与 Rep 交互 | No | Rep 级别 Action Instruction |
| Guardrail 触发通知到 Communication | No | 通知机制 |
| Zendesk Sidebar: Approve / Deny 按钮 | No | 随 Ask Permission 上线 |
| Notes to Rep（Sidebar 内教学指令） | No | Sidebar 内 Manager 留言给 Rep |

---

## 待讨论项

| 编号 | 问题 | 影响范围 | 备注 |
| --- | --- | --- | --- |
| 1 | Zendesk / Shopify 连接逻辑：已连接 vs 未连接商家的不同体验 | Integrations / Onboarding | 需要单独讨论 |
| 2 | Notes to Rep 功能是否纳入 MVP | Zendesk Sidebar | 当前原型中未实现 |
| 3 | Escalation 卡片点击展开完整对话上下文 | Communication → Rep | 当前仅展示摘要 |
| 4 | Topic 搜索和按类型筛选 | Communication → Team Lead | 当前无筛选 UI |
| 5 | Rule Update 提案的 diff 高亮 | Communication → Team Lead | 当前仅展示 Before/After 文本 |

---

## 术语表

| 术语 | 定义 |
| --- | --- |
| **Manager** | 人类客服主管，管理和训练 AI Rep |
| **Team Lead** | AI 管理助手（Alex 👔），Manager 的 Co-pilot |
| **AI Rep** | AI 客服代理（Ava），对外以人类身份回复客户 |
| **Orchestrator** | 技术层面的事件处理引擎，路由请求、管理状态、调度 Subagent |
| **Subagent** | 技术实现层面的大模型节点，处理不同任务 |
| **Gap Signal** | AI Rep 检测到知识缺口时发出的结构化信号 |
| **Topic** | Communication 中围绕一个问题的对话单元 |
| **Rule** | AI Rep 遵循的业务规则 |
| **Action** | AI Rep 可执行的具体操作 |
| **Guardrail** | 嵌入 Action Permission 的业务限制条件 |
| **Escalation** | AI 无法处理，转交给人类 |
| **Training Mode** | Rep 仅以 Internal Note 形式输出 |
| **Production Mode** | Rep 直接回复客户 |
| **Handoff Notes** | Rep 升级工单时的交接说明 |
| **Suggested Reply** | Rep 为 escalated 工单提供的建议回复 |
