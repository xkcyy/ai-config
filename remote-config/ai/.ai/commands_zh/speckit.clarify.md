---
description: 通过最多 5 个高针对性澄清问题识别并补全当前特性规范的缺失，并将答案写回规范。
handoffs: 
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec. I am building with...
---

## 用户输入

```text
$ARGUMENTS
```

在继续之前，**必须**先审视用户输入（若不为空）。

## 目标

发现并减少活动特性规范中的歧义或缺失决策点，将澄清结果直接记录到 spec 文件中。

说明：澄清流程应在 `/speckit.plan` 之前完成。若用户明确说明跳过澄清（如探索性 spike），可继续，但需警告后续返工风险提升。

## 执行步骤

1. 在仓库根 **仅运行一次** `.specify/scripts/powershell/check-prerequisites.ps1 -Json -PathsOnly`（组合 `--json --paths-only` / `-Json -PathsOnly`）。解析最小 JSON 字段：
   - `FEATURE_DIR`
   - `FEATURE_SPEC`
   - （可选记录 `IMPL_PLAN`、`TASKS` 便于后续链式流程）
   - 若 JSON 解析失败，终止并提示用户重跑 `/speckit.specify` 或检查特性分支环境。
   - 若参数含单引号如 "I'm Groot"，需转义：如 'I'\''m Groot'（或可行时用双引号）。

2. 加载当前 spec 文件，按以下分类做结构化歧义/覆盖扫描，对每类标记状态：Clear / Partial / Missing，形成内部覆盖图用于优先级（除非不提问，否则不直接输出）：

   功能范围与行为：
   - 核心用户目标与成功标准
   - 显式 out-of-scope 声明
   - 用户角色/人物差异

   领域与数据模型：
   - 实体、属性、关系
   - 身份/唯一性规则
   - 生命周期/状态流转
   - 数据量/规模假设

   交互与 UX 流程：
   - 关键用户旅程/序列
   - 错误/空/加载状态
   - 无障碍或本地化说明

   非功能质量属性：
   - 性能（延迟、吞吐目标）
   - 可扩展性（横/纵向，限制）
   - 可靠性/可用性（SLA/恢复期望）
   - 可观测性（日志/指标/追踪信号）
   - 安全与隐私（认证/授权/数据保护/威胁假设）
   - 合规/监管（如有）

   集成与外部依赖：
   - 外部服务/API 与失败模式
   - 数据导入/导出格式
   - 协议/版本假设

   边界与故障处理：
   - 负向场景
   - 限流/节流
   - 冲突解决（如并发编辑）

   约束与权衡：
   - 技术约束（语言、存储、托管）
   - 显式权衡或拒绝的备选

   术语与一致性：
   - 规范术语表
   - 避免的同义词/废弃术语

   完成信号：
   - 验收标准可测性
   - 可度量的 DoD 风格指标

   杂项/占位：
   - TODO/未决决策
   - 模糊形容词（robust/intuitive 等）未量化

   对于 Partial 或 Missing 的类别，若满足：
   - 澄清能显著影响架构/数据建模/任务分解/测试设计/UX/运维/合规
   - 或能减少返工风险
   则添加候选问题；若影响轻微或更适合规划阶段，可暂不提问。

3. **生成优先队列的候选问题（最多 5 个，内部）**：不要一次性全部输出。约束：
    - 整个会话问题总数 ≤10。
    - 每个问题必须可用以下两类回答：
       - 2–5 个互斥选项的多选题，或
       - 1 词/短语回答（限制 “<=5 words”）。
    - 仅保留能显著影响架构、数据、任务分解、测试、UX、运维或合规的高价值问题。
    - 做类别平衡：优先高影响未决领域；避免用两个低影响问题替代一个高影响问题。
    - 排除已回答或琐碎问题；避免计划阶段细节（除非影响正确性）。
    - 若未决类别 >5，按 Impact * Uncertainty 取前 5。

4. **序列提问循环（交互式）**：
    - 一次仅输出 **一个问题**。
    - 多选题：
      - **分析所有选项** 并给出 **首选推荐**，基于：
        - 该项目类型的最佳实践
        - 类似实现的常见模式
        - 风险降低（安全/性能/可维护性）
        - 与 spec 中显式目标/约束的对齐
      - 格式：`**Recommended:** Option [X] - <reasoning>`
      - 然后渲染 Markdown 表：

        | Option | Description |
        |--------|-------------|
        | A | <Option A> |
        | B | <Option B> |
        | C | <Option C> (如需 D/E 最多 5 项) |
        | Short | Provide a different short answer (<=5 words) (如适合自由回答时才包含) |

      - 末尾追加：`You can reply with the option letter (e.g., "A"), accept the recommendation by saying "yes" or "recommended", or provide your own short answer.`

    - 短答题：
      - 提供 **建议答案**：`**Suggested:** <answer> - <brief reasoning>`
      - 提示格式：`Format: Short answer (<=5 words). You can accept the suggestion by saying "yes" or "suggested", or provide your own answer.`

    - 用户回答后：
      - 若答 “yes/recommended/suggested”，使用推荐/建议答案
      - 否则校验回答对应选项或满足 ≤5 词
      - 若含糊，简短澄清（不计为新问题）
      - 记录答案后进入下一个排队问题

    - 终止条件：
      - 关键歧义已解决
      - 用户表示完成 (“done/good/no more”)
      - 已问满 5 个
    - 不提前泄露未来问题。
    - 若起始无有效问题，直接报告无关键歧义。

5. **每个答案接受后立刻集成（增量写入）**：
    - 维护内存中的 spec 表示与原文件内容
    - 首次集成时，确保存在 `## Clarifications`；若无，在最高层背景/概览之后创建
    - 在其下创建（若不存在）今日 `### Session YYYY-MM-DD` 子节
    - 立即追加一行：`- Q: <question> → A: <final answer>`
    - 立即将澄清应用到最合适的章节：
      - 功能歧义 → Functional Requirements
      - 交互/角色 → User Stories 或 Actors/角色
      - 数据形态 → Data Model（添加字段/类型/关系，保持顺序；简明约束）
      - 非功能 → Non-Functional/Quality Attributes（将模糊词转为指标/目标）
      - 边界/异常 → Edge Cases / Error Handling（若模板有则放入/创建）
      - 术语冲突 → 全文规范化术语，必要时一次性注明“(formerly referred to as "X")”
    - 若澄清使旧表述失效，替换旧表述，避免冲突
    - 每次写入后保存 spec（原子覆盖）
    - 保持格式：不重排无关章节，保持标题层级
    - 插入内容需简洁、可测试，避免叙事漂移

6. **验证（每次写入后 + 最终）**：
   - Clarifications 会话仅包含每个答案一条 bullet
   - 问题总数 ≤5
   - 更新章节无残留模糊占位
   - 不留矛盾旧述
   - Markdown 结构合法；仅允许新标题：`## Clarifications`、`### Session YYYY-MM-DD`
   - 术语一致

7. 将更新后的 spec 写回 `FEATURE_SPEC`。

8. 输出完成报告（提问循环结束或提前终止后）：
   - 已提问/回答数量
   - 更新的 spec 路径
   - 修改的章节
   - 覆盖摘要表：列出每个分类的状态（Resolved/Deferred/Clear/Outstanding）
   - 若有 Outstanding/Deferred，建议是继续 `/speckit.plan` 还是稍后重跑 `/speckit.clarify`
   - 建议下一命令

行为准则：
- 若无关键歧义：输出 “No critical ambiguities detected worth formal clarification.” 并建议推进。
- 若缺 spec，提示先运行 `/speckit.specify`（不在此创建）。
- 绝不超过 5 个问题（同一问题的澄清不算新问题）。
- 避免无关的技术栈问题，除非缺失会阻碍功能清晰度。
- 尊重用户终止信号（stop/done/proceed）。
- 若覆盖充分且未提问，输出简洁覆盖摘要并建议前进。
- 若已达配额且仍有高影响未解，标记为 Deferred 并说明理由。

优先上下文：$ARGUMENTS

