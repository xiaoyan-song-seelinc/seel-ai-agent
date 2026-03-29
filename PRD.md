# 需求详情

> **Version:** 3.0 | **Date:** 2026-03-29 | **Author:** Manus AI | **Status:** Draft for Review

---

## 产品概述

Seel AI Support Agent 是面向电商客服团队的 AI Agent 管理平台。Manager（客服主管）通过与 **Team Lead**（AI 管理助手 Alex 👔）对话式交互，配置、训练和监控 **AI Rep**（AI 客服代理 Ava）。

核心价值：Manager 不需要学习复杂的配置界面，而是像管理真人员工一样，通过对话来教会 AI Rep 处理客服工单。

### 角色定义

| 角色 | 类型 | 名称 | 职责 |
| --- | --- | --- | --- |
| Manager | 人类 | — | 配置规则、审批动作、处理 Escalation |
| Team Lead | AI | Alex 👔 | Manager 的管理助手，辅助 Playbook 配置、提出 Rule 提案、汇报 Rep 表现 |
| AI Rep | AI | Ava | 对外以人类身份回复客户工单，遵循 Rule 和 Action Permission |

Team Lead 与 AI Rep 的关系：Team Lead 是 Manager 的管理助手，负责接收 Manager 的指令、提出规则建议、汇报 Rep 的学习情况。本期 Team Lead 不直接与 Rep 交互，未来会扩展为可以向 Rep 下达 Rep 级别的 Action Instruction。从用户心智角度，Team Lead 像是一个 Rep 团队的管理者，Manager 通过 Team Lead 来间接管理 Rep 的行为。

### Manager 的两个工作界面

Manager 日常在两个界面上操作：

| 界面 | 位置 | 核心用途 | 主要交互 |
| --- | --- | --- | --- |
| **AI Support 模块** | Seel 平台内嵌，含 Communication / Playbook / Performance 三个 Tab | 管理 Agent、审阅 Rule 提案、查看表现 | 与 Team Lead 对话、审阅 Rep Escalation、编辑 Playbook |
| **Zendesk Sidebar App** | 嵌入 Zendesk 工单界面的侧边栏 | 在处理工单时查看 AI Rep 状态和建议 | 查看 Handoff Notes、复制 Suggested Reply |

两个界面的关系：AI Support 模块是 Manager 的"管理后台"，用于战略层面的配置和监控。Zendesk Sidebar 是 Manager 的"工单现场"，用于在实际处理工单时获取 AI 辅助。两者通过 Ticket ID 关联，Sidebar 中的 Escalation 同步到 Communication 中的 Rep 对话区。

### 信息架构

```
Seel 平台（全局左侧导航）
├── Home / Analytics / Orders / Issues / Protection / Reviews（其他模块）
├── Integrations（全局集成管理，含 Zendesk 连接设置）
└── AI Support（模块入口）
    ├── Communication（默认页）
    │   ├── 左侧窄栏：Team Lead + Rep 头像切换
    │   ├── Team Lead 区域：Onboarding / Conversation 两个 Tab
    │   └── Rep 区域：Escalation Feed / Profile Panel
    ├── Playbook
    │   ├── Rules（规则列表 + 详情 Sheet）
    │   └── Documents（文档管理 + 上传）
    └── Performance
        ├── KPI 卡片（4 项指标）
        ├── 趋势图（Resolution / CSAT）
        └── Intent 分析表

独立界面：
└── Zendesk Sidebar App（嵌入 Zendesk，320px 宽）
    ├── AI Handling 状态
    └── Escalated 状态（Handoff Notes + Suggested Reply）
```

### 核心实体

| 实体 | 说明 | 归属 |
| --- | --- | --- |
| **Rule** | AI Rep 遵循的业务规则，以编号列表形式呈现 | Playbook |
| **Knowledge Document** | 上传的知识文档，系统自动提取 Rule | Playbook |
| **Action** | AI Rep 可执行的操作（如退款、发送替换品） | Playbook（通过 Rep Profile 配置） |
| **Action Permission** | 每个 Action 的权限开关 + Guardrail 限制 | Rep Profile |
| **Topic** | Communication 中围绕一个问题的对话单元 | Communication（Team Lead 区域） |
| **Escalation Ticket** | Rep 无法处理而升级的工单 | Communication（Rep 区域） |
| **Zendesk Ticket** | 客户工单，Rep 在其上执行操作 | Zendesk |

### 实体关系

```
Manager ──对话──▶ Team Lead (via Communication)
    │                   │
    │                   └── 提出 / 接收 ──▶ Rule 提案 (via Topics)
    │
    ├── 配置 ──▶ Playbook
    │               ├── Knowledge Documents ──提取──▶ Rules
    │               └── Rules（所有 Rule 统一管理）
    │
    ├── 配置 ──▶ Rep Profile
    │               ├── Identity（Name, Tone）
    │               ├── Action Permissions + Guardrails
    │               └── Agent Mode（Production / Training / Off）
    │
    ├── 审阅 ──▶ Escalation Tickets (via Communication → Rep 区域)
    │
    └── 现场辅助 ──▶ Zendesk Sidebar (via Zendesk App)
```

Rule、Action、Knowledge Document 的关系：

- Knowledge Document 是 Rule 的来源之一。上传文档后系统自动提取 Rule。
- Rule 是 AI Rep 的行为准则。所有 Rule 是同一种实体，通过标签分类管理（如 Refund、Shipping、Escalation）。
- Action 是 AI Rep 可执行的具体操作。每个 Action 有独立的 Permission 开关和 Guardrail 限制。
- Rule 指导 Rep "什么情况下做什么"；Action Permission 限制 Rep "能不能做"；Guardrail 限制 Rep "做到什么程度"。

---

## Onboarding（首次配置流程）

Onboarding 在 Communication → Team Lead 区域的 Setup Tab 中完成。Team Lead (Alex) 以对话方式引导 Manager 完成首次配置。

### 阶段划分与用户流程

| 阶段 | 步骤 | 交互方式 | 完成标志 |
| --- | --- | --- | --- |
| **欢迎** | Alex 自我介绍 + 说明系统价值 | 对话气泡 | Manager 阅读 |
| **文档导入** | 上传客服 SOP 文档 | 文件上传框 + URL 粘贴 + "Try demo" 链接 | 文件上传成功 |
| **规则提取** | 系统处理文档，提取 Rule | 进度提示（真实上传需 30-60 分钟） | 规则提取完成 |
| **冲突解决** | 逐条解决提取规则中的冲突 | 逐条展示冲突卡片 + 进度条 + 选项/跳过 | 所有冲突处理完毕 |
| **Hire Rep** | 创建 AI Rep | Hire Rep Dialog | Rep 创建成功 |

### Agent 处理逻辑

文档导入后，Orchestrator 调用文档解析服务提取 Rule。提取过程中自动检测冲突（同一场景的不同处理方式）。冲突以独立对话气泡形式逐条展示，每条冲突提供多个选项供 Manager 选择，也可跳过。

### 字段说明

**冲突卡片：**

| 字段 | 说明 | 何时展示 |
| --- | --- | --- |
| 冲突描述 | 两条规则的矛盾点 | 始终 |
| 选项 A / B | 两种处理方式 | 始终 |
| 备注输入框 | Manager 可补充说明 | 始终（可选） |
| Skip 按钮 | 跳过此冲突 | 始终 |
| 进度条 | "第 X / Y 条冲突" | 多条冲突时 |

**Hire Rep Dialog：**

| 字段 | 说明 | 何时展示 |
| --- | --- | --- |
| Rep 名称 | 默认 "Ava" | 始终 |
| Personality 选择 | Professional / Friendly / Casual（Pills 形式） | 始终 |
| Allowed Actions | 分类展示所有 Action，开关控制 | 始终 |
| Guardrails | 每个 Action 下的限制条件 | Action 开启时 |
| Sanity Check | 3 个场景展示 Rep 处理方案 | Actions 配置完成后 |
| Mode 选择 | Training / Production | Sanity Check 通过后 |

### Sanity Check 流程

Hire Rep 配置完成后，系统展示 3 个模拟场景（如退款请求、物流查询、损坏物品），展示 Rep 基于当前配置的处理方案。Manager 可以：
- **Looks good** — 确认通过
- **Needs adjustment** — 返回修改配置

### 边界条件

| 场景 | 处理方式 |
| --- | --- |
| 中途退出 | 状态保留在当前步骤，下次进入从断点继续 |
| 文档内容模糊 | 标记为"需要澄清"，让 Manager 补充 |
| 提取规则数量为 0 | 引导手动上传或直接进入对话式教学 |
| Sanity Check 全部不满意 | 提供"Needs adjustment"返回修改 |
| Onboarding 完成后 | 配置写入 Playbook 和 Rep，自动切换到 Conversation Tab |

---

## Communication — Team Lead 对话

Communication 是 Manager 与 Team Lead (Alex) 的主要对话界面。左侧窄栏（56px，仅头像）切换 Team Lead / Rep 两个区域。Team Lead 区域有两个 Tab：**Onboarding**（Setup）和 **Conversation**。

Conversation 采用 Feishu 风格的 Topic 分组：每个 Topic 是一个独立的对话卡片，包含标题、消息、Rule 提案卡片和内联回复。所有 Topic 按时间排列，日期分隔线分组。

### Topic 数据结构

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 唯一标识 |
| type | TopicType | 类型：knowledge_gap / performance_report / performance_summary / open_question / escalation_review / rule_update |
| title | string | 标题，如 "Refund to different payment method" |
| status | TopicStatus | 状态：unread / read / resolved |
| createdAt | string | 创建时间 |
| updatedAt | string | 最后更新时间 |
| preview | string | 预览文本（用于列表展示） |
| messages | Message[] | 消息列表 |
| sourceTicketId | string? | 关联的 Zendesk Ticket ID |
| proposedRule | ProposedRule? | 附带的 Rule 提案 |

### Topic 状态与标记

| 标记 | 视觉表现 | 含义 |
| --- | --- | --- |
| 黄色圆点 | 🟡 | Topic 有 pending 的 Rule 提案，需要 Manager 操作 |
| 蓝色圆点 | 🔵 | Topic 有未读的 AI 消息 |
| 无标记 | — | Topic 已处理或已读 |

### Flow 1: Team Lead 主动提案 Rule

Team Lead 在 Rep 处理工单过程中发现知识缺口或规则不足，主动向 Manager 提出规则提案。

**Agent 处理逻辑：** AI Rep 处理 ticket 时检测到无匹配 Rule，发出 Gap Signal 给 Orchestrator。Orchestrator 去重后调用 Team Lead 的 Rule Generator Skill，生成 Rule 提案推送到 Communication。

**用户流程：**
```
Topic 卡片出现在 Conversation 中（黄色圆点标记）
    │
    ├── 上下文消息：Alex 说明观察到的模式、涉及的工单、频率
    └── Rule 提案卡片（结构化展示）
        │
        ▼
Manager 操作
    ├── Accept → Rule 生效，Topic 标记为 resolved
    ├── Modify & Accept → 编辑后生效
    └── Reject → Rule 不生效，Topic 标记为 resolved
```

### Flow 2: Manager 主动下达 Rule

**用户流程：**
```
Manager 在底部输入框发送指令
    │
    ▼
Team Lead 解析指令，生成结构化 Rule
    │
    ▼
Team Lead 回复确认（展示理解的内容 + Rule 卡片）
    │
    ▼
Manager 二次确认
    ├── Accept → Rule 生效
    └── 继续对话 → Team Lead 修正后再次请求确认
```

**Agent 处理逻辑：** Manager 消息通过前端发送给 Orchestrator，路由到 Team Lead 的 Manager Directive Skill。Team Lead 将自由文本解析为结构化 Rule（含 tags、validUntil 等字段），返回确认消息和 Rule 卡片。

### Flow 3: Rep 从 Manager 行为中学习

**触发条件：** Zendesk Webhook 检测到 Manager 在 escalated ticket 上添加回复或关闭 ticket。

**Agent 处理逻辑：** Webhook 触发 → Orchestrator 检查 ticket 是否由 AI Rep escalate → 调用 Zendesk REST API 获取完整 ticket 内容 → 传入 Team Lead 的 Behavior Observation Skill → 生成 Rule Update 提案推送到 Communication。

**用户流程：** 与 Flow 1 相同，区别在于 Topic 类型为 `escalation_review`，上下文消息会说明"我注意到你在 #XXXX 上直接处理了……"。

### Rule 提案卡片字段

| 字段 | 说明 | 何时展示 |
| --- | --- | --- |
| 类型标签 | "Proposed New Rule" 或 "Proposed Rule Update" | 始终 |
| 规则名称 | 如 "Refund Payment Method Policy" | 始终 |
| Current（当前规则） | 删除线样式，展示被修改的原规则 | 仅 Rule Update |
| Updated / Content | 新规则文本 | 始终 |
| Source 链接 | 关联的 Ticket 编号 | 有关联 Ticket 时 |
| Accept / Modify & Accept / Reject 按钮 | 操作按钮 | 提案状态为 pending 时 |

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

Team Lead 每周自动生成一份 Performance Summary，以 Topic 形式出现在 Conversation 中。内容包括：

- 本周处理 Ticket 数量及环比变化
- Auto-resolution Rate、CSAT、Escalation Rate、First Response Time
- 表现最好和最需改进的 Intent 类别
- 可操作的改进建议

### 边界条件

| 场景 | 处理方式 |
| --- | --- |
| 新 Rule 与已有 Rule 矛盾 | 提交提案时自动检测冲突，展示两条规则让 Manager 选择 |
| Manager 发送的指令含糊不清 | Team Lead 先确认理解，再生成 Rule |
| Topic 长时间无人处理 | 定期 bump 提醒 |
| Rule Update 的 Before/After 内容很长 | 默认折叠，Show more 展开 |

---

## Communication — Rep 管理

Rep 区域在 Communication 左侧窄栏点击 Rep 头像后展示。分为 Escalation Feed 和 Profile Panel 两部分。

### Escalation Feed

Escalation Feed 以时间倒序展示 Rep 升级的工单卡片。每张卡片展示工单摘要，Manager 可以直接跳转到 Zendesk 处理。

**Escalation 卡片字段：**

| 字段 | 说明 | 何时展示 |
| --- | --- | --- |
| Zendesk Ticket ID | 工单编号，可点击跳转 | 始终 |
| Subject | 工单标题 | 始终 |
| Customer Name | 客户姓名 | 始终 |
| Status Badge | needs_attention（红色）或 resolved（灰色） | 始终 |
| Reason | Rep 升级原因 | 始终 |
| Summary | 工单摘要 | 始终 |
| Sentiment | frustrated / neutral / urgent | 始终 |
| Order Value | 订单金额 | 有值时 |
| Created At | 升级时间 | 始终 |
| Resolved At | 解决时间 | resolved 状态时 |

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

**Agent 处理逻辑：** AI Rep 在处理 ticket 时判断无法处理（无匹配 Rule、无 Action 权限、客户要求人工等），发出 Escalation 信号。Orchestrator 更新 ticket 状态为 escalated，在 Zendesk 中发送 Internal Note，同时在 Communication 的 Rep 区域创建 Escalation 卡片。

**状态自动同步：** Manager 在 Zendesk 中处理完 escalated ticket 后，Webhook 检测到操作，自动将 Escalation 卡片状态从 needs_attention 更新为 resolved。

### Rep Profile Panel

Profile Panel 默认为查看模式，右上角有 Edit 按钮切换到编辑模式。包含三个折叠区域：

**Details（查看模式）：**

| 字段 | 说明 |
| --- | --- |
| Name | Rep 名称（如 Ava） |
| Personality | Professional / Friendly / Casual |
| Mode | Production / Training / Off |
| Status | Working / Idle |

**Details（编辑模式）额外展示：**

| 字段 | 说明 |
| --- | --- |
| Allowed Actions | 所有 Action 的开关列表 |
| Guardrails | 每个 Action 下的限制条件（仅 Action 开启时可编辑） |

**Performance（查看模式）：**

| 字段 | 说明 |
| --- | --- |
| Tickets Handled | 处理的工单总数 |
| Auto-Resolution Rate | 自动解决率 |
| CSAT | 客户满意度评分 |
| Avg Response Time | 平均响应时间 |

**Config History（默认折叠）：**

展示 Rep 配置变更的时间线，每条记录包含变更时间、变更内容描述。

### Agent Mode

| Mode | 行为 | Zendesk 表现 |
| --- | --- | --- |
| **Production** | 直接回复客户；遇到不确定场景时 Escalate | 公开回复 + 偶尔 Internal Note |
| **Training** | 仅以 Internal Note 形式发送所有内容 | 仅 Internal Note |
| **Off** | 不处理任何工单 | 所有工单分配给人类 |

### Action Permission

MVP 版本采用两级制：

| 级别 | 说明 | 示例 |
| --- | --- | --- |
| **Autonomous** | Rep 在支持范围内自行执行 | 查询物流、关闭工单、$150 以下退款 |
| **Disabled** | Rep 不可执行，遇到时升级给人类 | 创建优惠券 |

Guardrail 嵌入 Action Permission：每个打开的 Action 可附带 Guardrail 条件。

| Guardrail 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 唯一标识 |
| label | string | 限制名称，如 "Max refund amount" |
| type | "number" \| "boolean" | 值类型 |
| value | number? | 数值（仅 number 类型） |
| unit | string? | 单位，如 "$"、"%"、"turns" |
| enabled | boolean | 是否启用 |

### 边界条件

| 场景 | 处理方式 |
| --- | --- |
| Production → Off 切换 | 确认对话："当前有 N 个进行中工单，切换后将分配给人类" |
| Production → Training 切换 | 进行中的工单继续以 Production 模式完成，新工单以 Training 模式处理 |
| 修改 Tone / Name 后 | 仅对新对话生效 |
| Escalated ticket Manager 长时间未处理 | 设置 SLA 提醒 |

---

## Playbook

Playbook 是 AI Rep 的知识库和规则配置中心。包含 **Rules** 和 **Documents** 两个 Tab。

### Rules

Rules 以编号列表形式展示。每条 Rule 显示编号、名称、一行预览（Policy 前 120 字符）和使用次数。点击进入 Rule 详情 Sheet（侧边抽屉），包含 **Content** 和 **Stats** 两个 Tab。

**SOPRule 数据结构：**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 唯一标识 |
| name | string | 规则名称，如 "Standard Return & Refund" |
| intent | string | 意图分类，如 "Returns / Refunds" |
| policy | string | 规则正文（长文本，包含完整处理流程） |
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

**Rule 详情 — Content Tab：**

| 区域 | 说明 |
| --- | --- |
| 长文本正文 | Policy + Exceptions + Escalation 合并为连续段落展示 |
| Actions | 关联的 Action 名称列表（Pills 形式） |
| Version History | 可折叠的时间线，每条记录含版本号、日期、变更描述、来源对话链接 |

**Rule 详情 — Stats Tab：**

| 指标 | 说明 |
| --- | --- |
| Used（invocationCount） | 被匹配使用的总次数 |
| Avg CSAT（avgCsat） | 使用此规则的工单平均满意度 |
| Deflection（deflectionRate） | 使用此规则的工单自动解决率 |

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

Documents 展示已上传的知识文档列表。顶部搜索框和 Add 按钮在同一行。每个文档行展示：

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

**文档行展示字段：**

| 字段 | 说明 | 何时展示 |
| --- | --- | --- |
| 类型图标 | PDF（红）/ DOC（蓝）/ CSV（绿）/ URL（紫） | 始终 |
| 文档名称 | 文件名或 URL 标题 | 始终 |
| 文件大小 | 如 "2.4 MB" | 有值时 |
| 上传时间 | 如 "Uploaded Mar 15" | 始终 |
| 处理状态 | Processed（绿）/ Processing...（黄） | 始终 |
| In Use 开关 | 启用/禁用文档 | 始终 |
| 三点菜单 | View / Open URL / Remove | 始终 |

**Upload Document Dialog（三种方式）：**

| 方式 | 说明 |
| --- | --- |
| Upload File | 拖拽或点击上传，支持 PDF / DOC / DOCX / CSV / TXT，最大 10 MB |
| Add URL | 输入网页 URL，系统自动爬取内容 |
| Manual Input | 手动输入标题和内容 |

上传后展示处理提示：Alex (Team Lead) 将处理内容并提取规则，通常需要 30-60 分钟。

### 边界条件

| 场景 | 处理方式 |
| --- | --- |
| 上传文档内容模糊 | 标记为"需要澄清"，让 Manager 补充 |
| 文档更新（上传新版本） | 自动 diff 新旧版本的规则变化，展示给 Manager 确认 |
| 删除文档后关联 Rule 处理 | 提示 Manager 选择保留或删除 |
| 新文档规则与现有规则冲突 | 展示冲突警告，两个版本 A/B 选择 |

---

## Performance

Performance 是 AI Rep 的数据看板。

### 功能组成

| 区域 | 说明 |
| --- | --- |
| 时间范围切换 | 7d / 14d / 30d |
| KPI 卡片（4 项） | Auto-Resolution Rate、CSAT Score、Escalation Rate、First Response Time |
| 趋势图 | Resolution & Escalation Rates 折线图、CSAT Score Trend 折线图 |
| Intent 分析表 | 按 Intent 维度展示 Volume、Resolution Rate、CSAT、Avg Turns、Escalation Rate |

### KPI 卡片字段

| 指标 | 单位 | Trend 说明 |
| --- | --- | --- |
| Auto-Resolution Rate | % | vs last week |
| CSAT Score | /5 | vs last week |
| Escalation Rate | % | vs last week（负值为改善） |
| First Response Time | sec | vs last week（负值为改善） |

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

| 状态 | 状态条样式 | 展示内容 | Manager 操作 |
| --- | --- | --- | --- |
| **AI Handling** | 绿色脉冲点 + "AI is handling this" | Intent、Confidence、Current Step | 无需操作 |
| **Escalated** | 红色警告 + "Needs your attention" | Handoff Notes + Suggested Reply | 复制 Suggested Reply、自行处理 |

### AI Handling 状态字段

| 字段 | 说明 | 何时展示 |
| --- | --- | --- |
| Intent | AI 识别的客户意图 | 有值时 |
| Confidence | AI 置信度（百分比） | 有值时 |
| Status | 当前处理步骤描述 | 有值时 |

### Escalated 状态字段

| 字段 | 说明 | 何时展示 |
| --- | --- | --- |
| Handoff Notes | Rep 的交接说明（升级原因 + 上下文） | 始终 |
| Suggested Reply | Rep 建议的回复文本 | 有值时 |
| Copy 按钮 | 复制 Suggested Reply | Suggested Reply 存在时 |

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
| Escalated ticket Manager 长时间未处理 | SLA 提醒 |
| 客户在 Escalation 等待期间继续发消息 | Rep 发送安抚消息 |
| Escalated 后 Manager 处理完毕 | Webhook 触发学习流程，Team Lead 在 Communication 中总结学到的内容 |

---

## Integrations

Integrations 是全局页面（不在 AI Support 模块内），管理 Zendesk 连接。

### Zendesk 集成设置

提供两种集成方式：

| 方式 | 用途 | 配置流程 |
| --- | --- | --- |
| **Sidebar App** | 在 Zendesk 工单界面嵌入 Seel 侧边栏 | 获取 Token → 在 Zendesk Admin Center 配置 |
| **AI Support Access** | 让 AI Rep 能够读写 Zendesk 工单 | OAuth 授权 → Agent Seat 验证 → Routing 配置 |

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

### 关键接口

```typescript
interface SOPRule {
  id: string;
  name: string;
  intent: string;
  policy: string;
  exceptions: string[];
  escalation: RuleEscalation;
  lastUpdated: string;
  updatedByTopicId?: string;
  sourceDocId?: string;
  tags?: string[];
  actions?: string[];
  invocationCount: number;
  avgCsat: number;
  deflectionRate: number;
  versions: RuleVersion[];
}

interface ActionPermission {
  id: string;
  name: string;
  description: string;
  category: string;
  permission: PermissionLevel;
  guardrails?: Guardrail[];
  lastModified: string;
  dependsOn?: string[];
}

interface Topic {
  id: string;
  type: TopicType;
  title: string;
  status: TopicStatus;
  createdAt: string;
  updatedAt: string;
  preview: string;
  messages: Message[];
  sourceTicketId?: string;
  proposedRule?: ProposedRule;
}

interface EscalationTicket {
  id: string;
  zendeskTicketId: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  status: EscalationStatus;
  reason: string;
  summary: string;
  sentiment: "frustrated" | "neutral" | "urgent";
  orderValue?: number;
  createdAt: string;
  resolvedAt?: string;
  zendeskUrl: string;
}

interface KnowledgeDocument {
  id: string;
  name: string;
  type: "pdf" | "doc" | "csv" | "url";
  uploadedAt: string;
  size: string;
  extractedRules: number;
  status: "processed" | "processing" | "error";
  sourceUrl?: string;
  inUse: boolean;
}
```

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
| **Orchestrator** | 技术层面的事件处理引擎，路由请求、管理状态 |
| **Topic** | Communication 中围绕一个问题的对话单元 |
| **Rule** | AI Rep 遵循的业务规则 |
| **Action** | AI Rep 可执行的具体操作 |
| **Guardrail** | 嵌入 Action Permission 的业务限制条件 |
| **Escalation** | AI 无法处理，转交给人类 |
| **Gap Signal** | AI Rep 检测到知识缺口时发出的结构化信号 |
| **Training Mode** | Rep 仅以 Internal Note 形式输出 |
| **Production Mode** | Rep 直接回复客户 |
| **Handoff Notes** | Rep 升级工单时的交接说明 |
| **Suggested Reply** | Rep 为 escalated 工单提供的建议回复 |
