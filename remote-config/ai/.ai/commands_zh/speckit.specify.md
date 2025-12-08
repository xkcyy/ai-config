---
description: 从自然语言特性描述创建或更新 feature specification。
handoffs: 
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec. I am building with...
  - label: Clarify Spec Requirements
    agent: speckit.clarify
    prompt: Clarify specification requirements
    send: true
---

## 用户输入

```text
$ARGUMENTS
```

你 **必须** 在执行前考虑用户输入（如果非空）。

## 流程概要

用户在触发消息中 `/speckit.specify` 之后输入的文本即为特性描述。假定本对话中始终可用（即使下方出现字面 `$ARGUMENTS`）。除非为空，不要要求用户重复。

根据该特性描述，执行：

1. **生成精炼短名**（2–4 词）用于分支：
   - 分析特性描述，提取最有意义的关键词
   - 创建 2–4 词短名，动作-名词格式（如 "add-user-auth"、"fix-payment-bug"）
   - 保留技术术语/缩写（OAuth2、API、JWT 等）
   - 简洁但可一眼理解

2. **创建新分支前检查现有分支**：

   a. 先拉取远端分支：

      ```bash
      git fetch --all --prune
      ```

   b. 找出所有来源中该短名的最大特性编号：
      - 远端分支：`git ls-remote --heads origin | grep -E 'refs/heads/[0-9]+-<short-name>$'`
      - 本地分支：`git branch | grep -E '^[* ]*[0-9]+-<short-name>$'`
      - specs 目录：匹配 `specs/[0-9]+-<short-name>`

   c. 确定下一个可用编号：
      - 提取所有来源的数字
      - 找到最大 N
      - 新编号用 N+1

   d. 运行脚本 `.specify/scripts/powershell/create-new-feature.ps1 -Json "$ARGUMENTS"`，传入计算的编号与短名：
      - 参数：`--number N+1` 与 `--short-name "your-short-name"` 以及特性描述
      - Bash 示例：`.specify/scripts/powershell/create-new-feature.ps1 -Json "$ARGUMENTS" --json --number 5 --short-name "user-auth" "Add user authentication"`
      - PowerShell 示例：`.specify/scripts/powershell/create-new-feature.ps1 -Json "$ARGUMENTS" -Json -Number 5 -ShortName "user-auth" "Add user authentication"`

   **重要**：
   - 必须检查三类来源（远端、本地、specs 目录）以确定最大编号
   - 仅匹配精确短名模式
   - 若无现有项则从 1 开始
   - 每个特性仅运行该脚本一次
   - JSON 输出在终端提供，需引用以获取实际内容
   - JSON 输出含 BRANCH_NAME 与 SPEC_FILE 路径
   - 若参数含单引号如 "I'm Groot"，需转义：如 'I'\''m Groot'（或可行时使用双引号）

3. 加载 `.specify/templates/spec-template.md` 了解所需章节。

4. 按以下流程执行：

    1. 解析输入中的特性描述。若为空：错误 “No feature description provided”
    2. 提取关键概念：角色、动作、数据、约束
    3. 对不清楚的部分：
       - 根据上下文与行业惯例做合理假设
       - 仅在下列情况使用 [NEEDS CLARIFICATION: ...]（最多 3 个）：
         - 选择显著影响范围或体验
         - 多种合理解释且影响不同
         - 缺乏合理默认值
       - 优先级：scope > security/privacy > user experience > technical details
    4. 填写用户场景与测试；若无法确定流程：错误 “Cannot determine user scenarios”
    5. 生成可测试的功能需求
    6. 定义成功标准：可度量、技术无关
    7. 识别关键实体（如涉及数据）
    8. 返回：SUCCESS（规范可用于规划）

5. 将规范写入 SPEC_FILE，按模板结构替换占位，保留章节顺序与标题。

6. **规范质量校验**：初稿后按质量标准校验：

   a. **创建规范质量清单**：在 `FEATURE_DIR/checklists/requirements.md` 生成 checklist，按模板结构并包含以下校验项：

      ```markdown
      # Specification Quality Checklist: [FEATURE NAME]
      
      **Purpose**: Validate specification completeness and quality before proceeding to planning
      **Created**: [DATE]
      **Feature**: [Link to spec.md]
      
      ## Content Quality
      
      - [ ] No implementation details (languages, frameworks, APIs)
      - [ ] Focused on user value and business needs
      - [ ] Written for non-technical stakeholders
      - [ ] All mandatory sections completed
      
      ## Requirement Completeness
      
      - [ ] No [NEEDS CLARIFICATION] markers remain
      - [ ] Requirements are testable and unambiguous
      - [ ] Success criteria are measurable
      - [ ] Success criteria are technology-agnostic (no implementation details)
      - [ ] All acceptance scenarios are defined
      - [ ] Edge cases are identified
      - [ ] Scope is clearly bounded
      - [ ] Dependencies and assumptions identified
      
      ## Feature Readiness
      
      - [ ] All functional requirements have clear acceptance criteria
      - [ ] User scenarios cover primary flows
      - [ ] Feature meets measurable outcomes defined in Success Criteria
      - [ ] No implementation details leak into specification
      
      ## Notes
      
      - Items marked incomplete require spec updates before `/speckit.clarify` or `/speckit.plan`
      ```

   b. **运行校验**：对照 checklist 审核 spec：
      - 每项判断通过/失败
      - 记录发现的问题（引用相关段落）

   c. **处理校验结果**：
      - 若全部通过：标记 checklist 完成，进入第 6 步
      - 若有失败（不含 [NEEDS CLARIFICATION]）：
        1. 列出失败项与具体问题
        2. 更新 spec 逐项修复
        3. 重新校验，最多 3 轮
        4. 若三轮后仍失败，将剩余问题写入 checklist 备注并警告用户
      - 若存在 [NEEDS CLARIFICATION]：
        1. 提取全部标记；超过 3 个则保留最关键 3 个（范围/安全/体验），其余做合理假设
        2. 针对每个澄清（最多 3 个）呈现选项表：

           ```markdown
           ## Question [N]: [Topic]
           
           **Context**: [Quote relevant spec section]
           
           **What we need to know**: [Specific question from NEEDS CLARIFICATION marker]
           
           **Suggested Answers**:
           
           | Option | Answer | Implications |
           |--------|--------|--------------|
           | A      | [First suggested answer] | [What this means for the feature] |
           | B      | [Second suggested answer] | [What this means for the feature] |
           | C      | [Third suggested answer] | [What this means for the feature] |
           | Custom | Provide your own answer | [Explain how to provide custom input] |
           
           **Your choice**: _[Wait for user response]_
           ```

        3. **表格格式关键**：管道对齐，单元格留空格，表头分隔至少 3 个短横线，确认渲染正常。
        4. 问题顺序：Q1, Q2, Q3（最多 3）
        5. 一次性呈现所有问题后等待回答
        6. 用户选择后，用其答案替换 [NEEDS CLARIFICATION]
        7. 澄清完成后再次校验

   d. **更新清单**：每次校验迭代后更新 checklist 状态。

7. 报告完成：包含分支名、spec 文件路径、checklist 结果以及后续准备（`/speckit.clarify` 或 `/speckit.plan`）。

**说明**：脚本会创建并切换新分支，并初始化 spec 文件后再写入。

## 通用指南

### 快速指南

- 聚焦用户需要的 **WHAT** 与 **WHY**。
- 避免实现细节（不写技术栈、API、代码结构）。
- 面向业务干系人而非开发。
- 不要在 spec 内嵌 checklist，命令会单独生成。

### 章节要求

- **必填章节**：每个特性都要完成
- **可选章节**：仅在相关时包含
- 若不适用，删除该章节（不要写 “N/A”）

### AI 生成说明

1. 做合理假设：结合上下文、行业标准、常见模式填补空白
2. 记录假设：在 Assumptions 部分注明
3. 限制澄清：最多 3 个 [NEEDS CLARIFICATION]，仅用于：
   - 显著影响范围/体验
   - 多种合理解释且影响不同
   - 没有合理默认值
4. 澄清优先级：scope > security/privacy > user experience > technical details
5. 像测试人员一样思考：模糊需求应视为不可测试
6. 常见可用默认（无须询问）：
   - 数据保留：遵循领域通用实践
   - 性能目标：标准 Web/移动预期
   - 错误处理：用户友好提示与适当回退
   - 认证方式：Web 默认会话或 OAuth2
   - 集成模式：RESTful API 默认

### 成功标准指南

成功标准必须：

1. **可度量**：包含具体指标（时间、百分比、数量、速率）
2. **技术无关**：不提及框架/语言/数据库/工具
3. **用户导向**：从用户/业务视角描述结果
4. **可验证**：无需知道实现细节即可测试

**好例子**：
- “用户能在 3 分钟内完成结账”
- “系统支持 10,000 并发用户”
- “95% 搜索结果 1 秒内返回”
- “任务完成率提升 40%”

**坏例子**（实现导向）：
- “API 响应低于 200ms”（过于技术；可写“用户几乎即时看到结果”）
- “数据库可处理 1000 TPS”（实现细节；改用用户可感知指标）
- “React 组件渲染高效”（框架特定）
- “Redis 命中率 >80%”（技术特定）

