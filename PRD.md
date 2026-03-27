# Seel AI Support Agent — Product Requirements Document

> **Version:** 1.0  
> **Date:** 2026-03-27  
> **Author:** Manus AI  
> **Status:** Draft for Review

---

## 1. Product Overview

Seel AI Support Agent 是一个面向电商客服团队的 AI Agent 管理平台。核心用户是 **Manager（客服主管）**，核心对象是 **Rep（AI 客服代理）**。

Manager 通过本平台完成以下核心任务：

- 配置和训练 AI Rep
- 审批 AI Rep 的动作和回复
- 通过对话式交互持续优化 AI Rep 的知识和规则
- 监控 AI Rep 的表现

---

## 2. 本期 Scope

### 2.1 包含的模块

| 模块 | 路由 | 定位 | 核心能力 |
|------|------|------|----------|
| Messages | `/messages` | 主工作台 | AI-Manager 对话、规则提案/审批、Onboarding |
| Playbook | `/playbook` | 知识配置 | 文档管理、规则库、Escalation Rules、Guardrails |
| Agent | `/agent` | Rep 配置 | 运行模式、身份、动作权限 |
| Performance | `/performance` | 数据看板 | 自动解决率、CSAT、Escalation 率、Intent 分析 |
| Zendesk Sidebar | `/zendesk` | 嵌入式工具 | 工单级别的审批/升级/指令 |
| Onboarding | 嵌入 Messages | 首次引导 | 连接系统 → 设置 Playbook → 雇佣 Rep |

### 2.2 不包含的内容（后续版本）

- 多 Agent 管理（本期仅支持单个 Rep）
- 实时 Zendesk webhook 集成（本期为模拟数据）
- 用户认证和多租户
- AI 模型训练/微调配置
- 自动化测试套件
- 多语言支持

---

## 3. 核心概念及关系

### 3.1 实体定义

| 实体 | 说明 | 关键属性 |
|------|------|----------|
| **Rep (Agent)** | AI 客服代理，对外以人类身份与客户交互 | name, tone, mode, greeting, signature, transparentAboutAI |
| **Manager** | 人类客服主管，负责配置、审批、教学 | — |
| **Topic** | Messages 中的一个话题单元，围绕一个具体问题展开 | id, title, status, messages[], proposedRule? |
| **Rule (Skill)** | Rep 遵循的业务规则，来源于文档或对话 | name, intent, ruleText, confidence, source |
| **Knowledge Document** | 上传的知识文档，系统自动提取规则 | name, type, extractedRules, status |
| **Action Permission** | Rep 可执行的动作及其权限级别 | name, category, permission, parameters |
| **Escalation Rule** | 触发自动升级的条件 | label, enabled, configurable, value, routingTarget |
| **Guardrail** | 安全限制，覆盖 Action Permission | 金额上限等 |
| **Zendesk Ticket** | 客户工单，Rep 在其上执行操作 | state, internalNote, suggestedAction, approvalStatus |

### 3.2 实体关系

```
Manager ──manages──▶ Rep (Agent)
    │                   │
    │                   ├── follows ──▶ Rules (Skills)
    │                   ├── bounded by ──▶ Action Permissions
    │                   ├── bounded by ──▶ Escalation Rules
    │                   ├── bounded by ──▶ Guardrails
    │                   └── operates on ──▶ Zendesk Tickets
    │
    ├── communicates via ──▶ Topics (in Messages)
    │                           │
    │                           └── may produce ──▶ Proposed Rules
    │
    ├── uploads ──▶ Knowledge Documents ──extracts──▶ Rules
    │
    └── reviews ──▶ Zendesk Tickets (via Sidebar)
```

### 3.3 Agent Mode

| Mode | 行为 | Zendesk 表现 |
|------|------|-------------|
| **Production** | 直接回复客户 | 以 Agent 身份发送公开回复 |
| **Shadow** | 草拟内容，等待 Manager 审批 | 以 Internal Note 形式保存草稿 |
| **Off** | 不处理任何工单 | 所有工单分配给人类 |

### 3.4 Action Permission 三级制

| 级别 | 说明 | 示例 |
|------|------|------|
| **Autonomous** | Rep 自行执行，无需审批 | 查询物流、关闭工单 |
| **Ask Permission** | Rep 草拟动作，等待 Manager 审批 | 退款（超过阈值）、折扣 |
| **Disabled** | Rep 不可执行，直接升级 | 创建优惠券 |

### 3.5 Rule 的来源

| 来源 | 说明 | 置信度 |
|------|------|--------|
| **文档提取** | 从上传的 PDF/DOC/CSV 中自动提取 | 取决于文档清晰度 |
| **AI 提案** | Rep 从工单处理中观察到模式，主动提出 | 通常较低，需 Manager 确认 |
| **Manager 指令** | Manager 在 Messages 中直接下达 | 最高 |
| **Manager 审批后学习** | Rep 从 Manager 的审批/拒绝行为中学习 | 中等 |

### 3.6 Zendesk Ticket 三种状态

| 状态 | 含义 | Manager 需要做什么 |
|------|------|-------------------|
| **AI Handling** | Rep 正常处理中 | 无需关注 |
| **Request for Approval** | Rep 有建议动作/回复，需要 Manager 一键审批 | Approve / Deny |
| **Escalated** | Rep 无法处理（权限不足/不会回复），需要 Manager 接手 | 自行处理工单 |

核心区别：**Approval = AI 有方案，只需确认；Escalation = AI 没有方案，需要人类接手。**

---

## 4. 核心流程

### 4.1 Onboarding Flow

Onboarding 嵌入 Messages 页面顶部，作为 Manager 与 Rep 的第一段对话。

**阶段划分：**

| 阶段 | 步骤 | 交互方式 |
|------|------|----------|
| **Phase 1: Connect** | 连接 Zendesk | OAuth 授权卡片 |
| | 连接 Shopify | OAuth 授权卡片 |
| | 导入现有规则 | 进度条 + 冲突解决 |
| **Phase 2: Playbook** | 审核提取的规则 | 逐条确认/修改 |
| | 设置 Escalation Rules | 预设规则 + 开关 |
| **Phase 3: Hire Rep** | 命名 Rep | 文本输入 |
| | 设置 Tone | 选项卡（Friendly / Professional / Casual） |
| | Sanity Check（3 个场景） | AI 展示处理方案，Manager 确认 |
| | 选择运行模式 | Shadow / Production |

**关键规则：**

- Onboarding 完成后，消息保留在 Messages 顶部，不可删除
- 提供 "Restart Setup" 按钮用于测试
- 冲突解决：当文档规则与历史工单行为不一致时，展示两个版本让 Manager 选择

### 4.2 AI 主动提案 Rule（Topic 生命周期）

这是最核心的流程。Rep 在处理工单过程中发现知识缺口或规则不足，主动向 Manager 提出规则提案。

```
Rep 发现问题
    │
    ▼
创建 Topic（状态: Waiting for Response）
    │
    ├── 消息 1: 上下文说明（观察到的模式、涉及的工单、频率）
    │
    ├── 消息 2: 规则提案卡片
    │       ├── New Rule: 展示提案内容
    │       └── Rule Update: 展示 Current → Proposed diff
    │
    ▼
Manager 操作
    ├── Accept → Rule 生效，Topic 状态 → Done
    ├── Reject → Rule 不生效，Topic 状态 → Done
    └── Reply → 继续对话，Topic 保持 Waiting
            │
            ▼
        Rep 根据回复修正提案
            │
            ▼
        Manager 再次 Accept / Reject / Reply
```

**规则提案的两种类型：**

| 类型 | 展示方式 | 示例 |
|------|----------|------|
| **New Rule** | 绿色标记，展示完整规则文本 | "国际退货运费由客户承担" |
| **Rule Update** | Current（红色删除线）→ Proposed（绿色新增） | 损坏物品处理：增加 $80 以下免照片条件 |

### 4.3 Manager 主动下达 Rule

```
Manager 在 Messages 中发送指令
    │
    ▼
Rep 解析指令，生成结构化 Rule
    │
    ▼
Rep 回复确认（展示理解的内容）
    │
    ▼
Manager 二次确认（Yes / No UI）
    ├── Yes → Rule 生效
    └── No → Rep 请求澄清
```

### 4.4 Rep 从 Manager 行为中学习

```
Rep 在 Zendesk 中请求 Approval
    │
    ▼
Manager Approve / Deny
    │
    ├── Approve → Rep 记录为正面案例
    │
    └── Deny → Rep 分析原因
            │
            ▼
        Rep 在 Messages 中创建 Topic
        "我注意到你拒绝了 #4498，我理解了区别是..."
            │
            ▼
        Rep 提出 Rule Update
            │
            ▼
        Manager Accept / Reject / Reply
```

### 4.5 Zendesk Sidebar 工作流

**Approval 流程：**

```
Sidebar 展示:
    ├── Rep's Note（内部说明：为什么需要审批）
    ├── Suggested Action（独立展示）
    │       ├── 结构化动作: 退款 $89.99 → Visa ···4242
    │       └── 草稿回复: 完整回复文本 + Copy 按钮
    └── 操作按钮: Approve / Deny
            │
            ├── Approve → 执行动作
            └── Deny → 可选填写原因
```

**Escalation 流程：**

```
Sidebar 展示:
    ├── Rep's Note（说明为什么无法处理）
    └── 无 Suggested Action
    
Manager 需要:
    └── 自行在 Zendesk 中处理该工单
```

**Notes to Rep（所有状态通用）：**

```
Manager 在 Sidebar 底部输入指令
    │
    ▼
指令保存为该工单的教学记录
    │
    ▼
Rep 学习并应用到未来类似场景
```

### 4.6 Knowledge Document 处理流程

```
Manager 上传文档（PDF / DOC / CSV）
    │
    ▼
系统解析文档，提取规则
    │
    ├── 无冲突 → 规则直接入库
    │
    └── 有冲突（与现有规则或历史行为不一致）
            │
            ▼
        Playbook 顶部展示冲突警告
        展示两个版本: Source A vs Source B
            │
            ▼
        Manager 选择 Use A / Use B
```

---

## 5. 页面功能清单

### 5.1 Messages

| 功能 | 说明 | 优先级 |
|------|------|--------|
| Topic Card 列表 | 按时间倒序展示所有 Topic，每个 Topic 为独立卡片 | P0 |
| Topic 状态 | Waiting for Response / Done，分 tab 展示 | P0 |
| 红点计数 | Topics 按钮上显示 Waiting 数量 | P0 |
| Accept / Reject / Reply | 每个待处理提案的三个操作 | P0 |
| Rule Change 卡片 | New Rule（绿色）/ Rule Update（Current → Proposed diff） | P0 |
| 长内容折叠 | Before/After 超过 3 行时默认折叠，Show more 展开 | P0 |
| Inline Replies | 回复内联在 Topic 卡片底部，>3 条折叠中间部分 | P0 |
| Thread Panel | 点击 Topic 可在右侧面板查看完整对话 | P1 |
| Onboarding 区域 | 页面顶部展示 Onboarding 对话流 | P0 |
| Restart Setup | Header 按钮，重置 Onboarding（测试用） | P2 |
| 发送消息 | 底部输入框，Manager 可主动发起 Topic | P0 |

### 5.2 Playbook

| 功能 | 说明 | 优先级 |
|------|------|--------|
| Integrations | 展示 Zendesk/Shopify 连接状态 | P0 |
| Knowledge — Documents | 文档列表 + 上传 + 删除 | P0 |
| Knowledge — Rules | 规则列表，展开查看详情，标注来源（via Messages） | P0 |
| 冲突检测 | 文档规则 vs 历史行为冲突，A/B 选择 | P1 |
| Escalation Rules | 开关 + 阈值配置 + 路由目标 | P0 |
| Guardrails | 金额上限等安全限制 | P0 |
| Agent 按钮 | Header 快捷跳转到 Agent 页面 | P1 |

### 5.3 Agent

| 功能 | 说明 | 优先级 |
|------|------|--------|
| Mode 选择 | Production / Shadow / Off，三选一 | P0 |
| Identity 配置 | Name, Tone, Greeting, Signature, AI Disclosure | P0 |
| Actions 权限 | 按类别分组，每个 Action 开关 + 阈值参数 | P0 |

### 5.4 Performance

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 时间范围筛选 | 7d / 14d / 30d | P0 |
| KPI 卡片 | 自动解决率、CSAT、Escalation 率、首次响应时间 | P0 |
| 趋势图 | Resolution/Escalation 趋势、CSAT 趋势 | P1 |
| Intent 分析表 | 按 Intent 维度的 Volume、Resolution、CSAT、Turns、Escalation | P1 |

### 5.5 Zendesk Sidebar

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 工单列表 | 左侧展示所有工单，标注状态 | P0 |
| 工单对话 | 中间展示客户-Agent 对话 | P0 |
| AI Handling 状态 | 绿色状态条，无操作项 | P0 |
| Approval 状态 | Rep's Note + Suggested Action（独立展示）+ Approve/Deny | P0 |
| Escalated 状态 | Rep's Note（仅说明） | P0 |
| Notes to Rep | 所有状态通用的指令输入框 | P0 |
| Draft Copy 按钮 | 草稿回复区域的一键复制 | P1 |

---

## 6. 边界条件与未覆盖场景

### 6.1 Rule 冲突与优先级

| 场景 | 当前处理 | 建议 |
|------|----------|------|
| 新 Rule 与已有 Rule 矛盾 | 未处理 | 提交提案时自动检测冲突，展示两条规则让 Manager 选择 |
| 临时 Rule（如促销期退货窗口）过期 | 未处理 | Rule 支持有效期字段，过期自动失效并通知 Manager |
| 多条 Rule 同时适用同一场景 | 未处理 | 定义 Rule 优先级机制（specificity > recency > confidence） |
| Manager 在 Messages 和 Playbook 中分别修改同一 Rule | 未处理 | 以最后修改为准，但需通知另一个入口的变更 |

### 6.2 Approval 流程边界

| 场景 | 当前处理 | 建议 |
|------|----------|------|
| Manager 长时间未审批 | 未处理 | 设置超时机制（如 30 分钟），超时后自动升级或通知 |
| Manager Deny 后 Rep 应该怎么做 | 仅记录 | Deny 后 Rep 应自动生成替代方案或升级给人类 |
| 同一工单多次请求 Approval | 未处理 | 限制单工单 Approval 次数，超过后自动升级 |
| Approval 请求中客户追加了新消息 | 未处理 | 检测新消息后更新 Suggested Action 或提示 Manager 上下文已变 |
| Shadow Mode 下 Manager 修改了 Draft 后 Approve | 未处理 | 记录修改内容，Rep 从修改中学习 |

### 6.3 Escalation 边界

| 场景 | 当前处理 | 建议 |
|------|----------|------|
| 升级后 Manager 未及时处理 | 未处理 | 设置 SLA 提醒，超时后二次通知或升级给更高层 |
| 升级原因不在已定义的 Escalation Rules 中 | Rep 自行判断 | 记录新的升级原因，建议 Manager 是否添加为 Rule |
| 客户在升级等待期间继续发消息 | 未处理 | Rep 发送安抚消息告知正在转接 |
| 升级后 Manager 处理完毕，Rep 如何学习 | 未处理 | Manager 处理后触发 "学习" 流程，Rep 在 Messages 中总结学到的内容 |

### 6.4 Knowledge 管理边界

| 场景 | 当前处理 | 建议 |
|------|----------|------|
| 上传的文档内容模糊或自相矛盾 | 标记为冲突 | 增加 "需要澄清" 状态，让 Manager 补充说明 |
| 文档更新（上传新版本） | 未处理 | 支持版本管理，自动 diff 新旧版本的规则变化 |
| 规则置信度持续偏低 | 仅展示数值 | 低于阈值时主动在 Messages 中提醒 Manager 确认 |
| 删除文档后，其提取的 Rule 如何处理 | 未处理 | 提示 Manager 选择保留或删除关联 Rule |
| URL 类型知识源内容变更 | 未处理 | 定期爬取检测变更，变更时通知 Manager |

### 6.5 Onboarding 边界

| 场景 | 当前处理 | 建议 |
|------|----------|------|
| Onboarding 中途退出 | 状态保留在当前步骤 | 下次进入 Messages 时从断点继续 |
| 连接 Zendesk/Shopify 失败 | 未处理 | 展示错误信息 + 重试按钮 + 跳过选项 |
| 导入的规则数量为 0 | 未处理 | 引导 Manager 手动上传文档或直接进入对话式教学 |
| Sanity Check 中 Manager 对所有场景都不满意 | 继续流程 | 提供 "重新配置" 选项，回到 Playbook 阶段 |

### 6.6 Messages 交互边界

| 场景 | 当前处理 | 建议 |
|------|----------|------|
| Manager 同时回复多个 Topic | 支持 | 确保每个回复关联到正确的 Topic |
| Rep 同时发起多个提案 | 支持 | 按优先级排序（如影响工单数量） |
| Manager 发送的指令含糊不清 | Rep 直接执行 | Rep 应先确认理解，再生成 Rule |
| Topic 长时间无人处理 | 无提醒 | 定期在 Messages 中 bump，或发送通知 |
| Manager Accept 后又想撤回 | 未处理 | 支持 Undo（限时，如 5 分钟内） |
| Rule Update 的 Before/After 内容非常长（>500 字） | 折叠展示 | 增加全屏 diff 视图 |

### 6.7 Zendesk Sidebar 边界

| 场景 | 当前处理 | 建议 |
|------|----------|------|
| 同一工单状态从 Handling → Approval → Escalated 连续变化 | 未处理 | 展示状态变更历史 |
| Manager 在 Sidebar 写了 Notes to Rep 但 Rep 未学习 | 仅保存 | 增加确认机制，Rep 回复 "已学习" 并展示理解 |
| 客户工单被合并 | 未处理 | 检测合并事件，更新 Sidebar 展示 |
| Sidebar 与 Messages 中同一问题的 Topic 如何关联 | 通过 sourceTicketId | 增加 Sidebar → Messages Topic 的跳转链接 |

### 6.8 Agent 配置边界

| 场景 | 当前处理 | 建议 |
|------|----------|------|
| 从 Production 切换到 Off | 即时生效 | 确认对话："当前有 N 个进行中的工单，切换后将分配给人类" |
| Action Permission 的 dependsOn 关系 | 展示但不强制 | 禁用父级 Action 时自动禁用依赖 Action |
| 修改 Tone 后对已进行中的对话的影响 | 未处理 | 仅对新对话生效，进行中的对话保持原 Tone |
| 阈值参数（如 maxAmount）设为 0 或负数 | 未校验 | 增加输入校验，最小值限制 |

---

## 7. 数据模型摘要

### 7.1 核心类型

```typescript
// Topic 状态
type TopicStatus = "waiting" | "done";

// Agent 运行模式
type AgentMode = "production" | "shadow" | "off";

// Action 权限级别
type PermissionLevel = "autonomous" | "ask_permission" | "disabled";

// Zendesk 工单状态
type TicketState = "handling" | "approval" | "escalated";

// Approval 状态
type ApprovalStatus = "pending" | "approved" | "denied";

// Rule 变更类型
type RuleChangeType = "new" | "update";
```

### 7.2 关键接口

```typescript
interface Topic {
  id: string;
  title: string;
  status: TopicStatus;
  messages: Message[];
  proposedRule?: ProposedRule;
  sourceTicketId?: string;  // 关联的 Zendesk 工单
}

interface ProposedRule {
  id: string;
  text: string;
  category: string;
  evidence: string[];       // 支撑证据（工单编号等）
  status: "pending" | "accepted" | "rejected";
}

interface RuleChange {
  type: "new" | "update";
  ruleName: string;
  before?: string;          // 仅 update 类型
  after: string;
  source: string;           // 变更来源说明
}

interface ZendeskTicket {
  id: string;
  subject: string;
  state: TicketState;
  internalNote?: string;    // Rep 的内部说明
  suggestedAction?: SuggestedAction;  // 仅 approval 状态
  approvalStatus?: ApprovalStatus;
  instruction?: string;     // Manager 的 Notes to Rep
}

interface SuggestedAction {
  type: "reply" | "refund" | "replacement" | "discount" | "resend";
  label: string;
  draft?: string;           // 草稿回复文本
  details?: Record<string, string | number>;  // 结构化动作参数
}
```

---

## 8. 跨模块联动

| 起点 | 终点 | 触发条件 | 联动内容 |
|------|------|----------|----------|
| Zendesk Deny | Messages Topic | Manager 拒绝 Approval | Rep 创建 Topic 分析拒绝原因，提出 Rule Update |
| Messages Accept | Playbook Rules | Manager 接受提案 | Rule 自动写入 Playbook，标注 "via Messages" |
| Playbook Upload | Playbook Conflicts | 新文档与现有规则冲突 | 展示冲突警告，等待 Manager 选择 |
| Onboarding Complete | Agent + Playbook | 完成所有步骤 | 配置写入 Agent（Mode, Identity）和 Playbook（Rules, Escalation） |
| Performance Alert | Messages Topic | 某 Intent 表现持续下降 | Rep 主动在 Messages 中报告并建议改进 |
| Agent Mode Change | Zendesk Behavior | 切换 Shadow/Production | 影响 Rep 在 Zendesk 中的回复方式 |

---

## 9. 待讨论项

| # | 问题 | 影响范围 | 建议 |
|---|------|----------|------|
| 1 | Rule 是否需要版本历史？ | Playbook, Messages | MVP 可不做，但数据结构预留 version 字段 |
| 2 | Approval 超时后的默认行为？ | Zendesk | 建议可配置：自动升级 / 自动执行 / 仅通知 |
| 3 | Notes to Rep 是否应在 Messages 中同步展示？ | Zendesk, Messages | 建议同步，形成完整的教学记录 |
| 4 | 多个 Manager 场景下的权限分级？ | 全局 | 本期不做，但架构上预留 |
| 5 | Rep 的 "学习" 是否需要 Manager 确认？ | Messages | 建议 Rep 学习后主动汇报，Manager 可纠正 |
| 6 | Guardrail 触发时是否需要在 Messages 中通知？ | Playbook, Messages | 建议通知，让 Manager 知道安全限制生效了 |
| 7 | 已 Resolved 的 Topic 是否可以重新打开？ | Messages | 建议支持，Manager 可能需要修正之前的决定 |
| 8 | Onboarding 是否支持跳过某些步骤？ | Messages | 建议支持，但标记为 "未完成" 并后续提醒 |

---

## 10. 术语表

| 术语 | 定义 |
|------|------|
| **Rep** | AI 客服代理，对外以人类身份工作 |
| **Manager** | 人类客服主管，管理和训练 Rep |
| **Topic** | Messages 中围绕一个问题的对话单元 |
| **Rule / Skill** | Rep 遵循的具体业务规则 |
| **Proposed Rule** | Rep 提出的待审批规则 |
| **Rule Update** | 对已有 Rule 的修改提案 |
| **Escalation** | AI 无法处理，转交给人类 |
| **Approval** | AI 有方案，等待 Manager 确认 |
| **Notes to Rep** | Manager 在 Zendesk Sidebar 中给 Rep 的教学指令 |
| **Guardrail** | 安全限制，覆盖 Action Permission |
| **Shadow Mode** | Rep 草拟内容但不直接发送 |
| **Production Mode** | Rep 直接回复客户 |
| **Confidence** | 系统对 Rule 准确性的置信度评分 |
