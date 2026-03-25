# Seel AI Support Agent 产品原型设计方案

## 产品背景
Seel AI Support Agent 是一个 AI 客服平台，核心理念是"每个 Agent 都是一个虚拟员工"。产品需要覆盖完整的虚拟员工生命周期管理：招聘·培训·上岗·考核·优化·淘汰。

---

<response>
<text>
## 方案一：Command Center（指挥中心）风格

**Design Movement**: 受航空管制塔台和军事指挥中心启发的数据密集型界面设计

**Core Principles**:
1. 信息密度优先——在单屏内展示最大量的可操作信息
2. 状态即颜色——通过色彩编码系统快速传达Agent和工单状态
3. 层级化布局——从全局概览到单个工单的逐层下钻

**Color Philosophy**: 深色背景（近黑色的深蓝灰）配合高饱和度的状态指示色。绿色=正常运行，琥珀色=需要注意，红色=紧急。主操作色使用电光蓝，传达科技感和精确感。

**Layout Paradigm**: 多面板分屏布局，类似Bloomberg终端。左侧固定导航+中间主工作区+右侧上下文面板，支持面板拖拽和自定义排列。

**Signature Elements**: 
- 实时数据流动画（数字跳动、进度条脉动）
- 六边形/蜂窝状的Agent状态网格
- 雷达图式的Agent能力评估可视化

**Interaction Philosophy**: 键盘优先，支持快捷键操作。悬停即预览，点击即展开。最小化页面跳转。

**Animation**: 数据更新时的微妙闪烁效果，面板切换的滑动过渡，状态变化时的脉冲动画。

**Typography System**: JetBrains Mono 用于数据展示，Space Grotesk 用于标题，系统字体用于正文。
</text>
<probability>0.06</probability>
</response>

<response>
<text>
## 方案二：Virtual Office（虚拟办公室）风格

**Design Movement**: 受现代 SaaS 产品（Linear, Notion, Raycast）启发的极简主义工作空间

**Core Principles**:
1. 呼吸感——大量留白让复杂信息变得可消化
2. 拟人化——Agent 以"员工卡片"形态呈现，有头像、状态、绩效指标
3. 渐进式披露——默认展示关键信息，详情按需展开

**Color Philosophy**: 以温暖的灰白色为底，主色调使用深青色（Teal #0D9488）传达专业与信任。辅助色使用暖橙色作为行动召唤色。整体色彩克制，让数据和内容成为视觉焦点。

**Layout Paradigm**: 左侧收缩式导航栏（图标模式/展开模式切换）+ 中央自适应内容区。采用卡片式布局而非传统表格，每个Agent、每条SOP、每个工单都是一张"卡片"。

**Signature Elements**:
- Agent 人格化卡片（带有"表情"状态指示器：😊正常、😤压力大、💤休眠）
- 对话气泡式的操作日志时间线
- 渐变色的进度环表示Agent就绪度

**Interaction Philosophy**: 拖拽优先的工作流编排。点击卡片展开详情面板（slide-over），而非跳转新页面。所有操作都有即时反馈。

**Animation**: 卡片进入时的弹性动画（spring physics），状态切换的颜色渐变过渡，列表项的交错入场效果。

**Typography System**: DM Sans 用于标题（几何感强），Source Sans 3 用于正文（高可读性），Fira Code 用于代码/数据。
</text>
<probability>0.08</probability>
</response>

<response>
<text>
## 方案三：Blueprint（蓝图）风格

**Design Movement**: 受工业设计蓝图和建筑制图启发的结构化界面，融合现代 SaaS 的清晰度

**Core Principles**:
1. 结构即导航——页面布局本身就是信息架构的可视化
2. 精确与可控——每个配置项都有明确的边界和预期
3. 系统化思维——展示Agent之间的关系、依赖和数据流向

**Color Philosophy**: 以纯净的白色和极浅的蓝灰色为底。主色使用靛蓝色（Indigo #4F46E5）代表智能与深度。成功状态使用翡翠绿，警告使用琥珀色。整体感觉是"精密仪器"的冷静与可靠。

**Layout Paradigm**: 顶部全局导航栏 + 左侧上下文子导航 + 中央宽幅工作区。关键页面使用"画布"模式——SOP拆解结果以流程图形式展示，Agent配置以表单+预览双栏呈现。

**Signature Elements**:
- 网格线背景暗纹（致敬蓝图纸）
- 连接线和节点图表示Agent工作流
- 标尺式的滑块控件（如退款上限设置）

**Interaction Philosophy**: 所见即所得的配置体验。修改即预览，拖拽即连接。复杂操作通过分步向导（Wizard）引导完成。

**Animation**: 连接线的绘制动画，节点的展开/折叠动画，数据流的粒子效果，页面切换的淡入淡出。

**Typography System**: Instrument Sans 用于标题（现代几何感），IBM Plex Sans 用于正文（工业设计感），IBM Plex Mono 用于数据和代码。
</text>
<probability>0.07</probability>
</response>

---

## 选定方案：方案二 - Virtual Office（虚拟办公室）风格

选择理由：最契合 Seel 产品"Agent = 虚拟员工"的核心理念，拟人化的设计语言能让 CX Manager 直觉地理解和管理 AI Agent。同时，极简主义的设计风格降低了认知负担，适合非技术背景用户。
