---
description: 生成史诗级需求规格与迭代计划，为后续 /speckit.specify 提供输入。
handoffs:
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec. I am building with...
    send: true
  - label: Clarify Spec Requirements
    agent: speckit.clarify
    prompt: Clarify specification requirements
    send: true
---

## User Input

```text
$ARGUMENTS
```

你 **必须** 在执行前考虑用户输入（如果非空）。

## Outline

`/speckit.epic` 后的文本即史诗描述，视为唯一真源；除非为空，不要要求用户重复。

### 1) 准备与目录规划（独立于 feature/spec 分支）
- 不创建/切换分支，保持当前分支。
- 推导 2-4 词短名（动词-名词，kebab-case，保留缩写）。
- 史诗目录根：`spec-epics/`（若不存在则创建）。
- 编号规则：在 `spec-epics/` 下查找 `E###-<short-name>`，取最大号+1，若无则 `E001`。短名仅用于查重提示，不与 specs 目录/分支混用。
- 创建 `spec-epics/E###-<short-name>/` 作为本次史诗目录。
- 不调用 `.specify/scripts/powershell/create-new-feature.ps1`，不创建 feature 分支。

### 2) 载入上下文
- 可选：读取 `.specify/memory/constitution.md` 以对齐不可变准则；不加载 `.specify/templates/spec-template.md`。

### 3) 起草 `epic-spec.md`（史诗级，不含实现细节，强调业务流程串联）
- 位置：`spec-epics/E###-<short-name>/epic-spec.md`；撰写时参考模板 `.specify/templates/epic-spec-template.md`，章节细节与可视化示例（角色表、Mermaid 导航、界面骨架、场景结构、分层非功等）已在模板中，不在此重复；保持技术无关、可度量。
- 章节（按模板顺序，若不适用则移除）：概览与目标；术语与角色；业务流程 / 用户旅程；（可选）界面/信息架构骨架；关键业务场景；功能需求；非功能需求；约束与假设；依赖；成功标准；风险与缓解；边界情形；澄清事项。
- 澄清事项：总数 ≤3，优先级 scope > security/privacy > UX；按模板指引给出默认选项及影响，无法澄清则收敛为假设。

### 4) 迭代切片与 `iteration-plan.md`（内含 specify 队列，减少输出文件）
- 位置：`spec-epics/E###-<short-name>/iteration-plan.md`。
- 迭代数量随需求大小动态决定：
  - 常态 3–8；小型 2–3；大型至多 8；>10 候选时合并低价值/强耦合项并注明；<2 提示风险。
  - 若命令输入显式要求仅产出 epic-spec，可跳过迭代拆分步骤（需在输出中提示后果）。
- 每个迭代（按价值/风险/学习/依赖/流程顺序排序）包含：
  - 名称与摘要
  - 对应业务流程阶段/泳道（注明覆盖的阶段或跨阶段衔接点）
  - 范围边界（包含/不包含）
  - 进入/退出条件（DoD，可度量，最好对齐流程阶段完成信号）
  - 关键用户场景（高层，串联到流程节点）
  - 依赖（内/外）
  - 风险与缓解（特别是跨系统/跨阶段风险）
  - 迭代里程碑/指标（可包含端到端漏斗或阶段转化指标）
- 在 `iteration-plan.md` 内增加“Specify 队列”小节，而非独立文件：
  - 为每个迭代生成 `/speckit.specify` 输入草稿（推荐短名、描述、成功标准骨架、1–2 个澄清提示，澄清总数史诗范围内仍 ≤3）。
  - 队列顺序与流程顺序一致。

### 5) 校验与安全
- 禁止泄露实现细节（框架、API、代码）；发现具体技术名需改写为业务表述。
- 史诗范围内 `[NEEDS CLARIFICATION]` 总数 ≤ 3（含队列）。
- 若已存在 `epic-spec.md` 或 `iteration-plan.md`：
  - 默认追加新迭代；若要覆盖需显式意图。
  - 追加时重新校验 `iteration-plan.md` 内的队列序号/顺序一致性。
- 报告时使用绝对路径；保持 Markdown 结构合法。

### 6) 输出
- 报告：史诗目录绝对路径、生成/更新文件路径（默认仅 epic-spec.md 与 iteration-plan.md）、迭代列表与顺序、“Specify 队列”摘要、剩余澄清（如有）、下一步建议（按队列依次跑 `/speckit.specify`；若有澄清再 `/speckit.clarify`；随后 `/speckit.plan` → `/speckit.tasks` → `/speckit.analyze`）。

## 备注与防护
- 关注 WHAT/WHY，避免 HOW。
- 成功标准必须可度量且技术无关。
- 输出保持简洁，不倾倒全文。
- 若载入了 constitution，发现冲突需显式标出为错误。

