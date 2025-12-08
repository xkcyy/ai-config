---
description: 基于交互或提供的原则输入创建或更新项目宪章，确保相关模板同步。
handoffs: 
  - label: Build Specification
    agent: speckit.specify
    prompt: Implement the feature specification based on the updated constitution. I want to build...
---

## 用户输入

```text
$ARGUMENTS
```

在继续之前，**必须**先审视用户输入（若不为空）。

## 流程概要

你将更新 `.specify/memory/constitution.md`。该文件是包含方括号占位符（如 `[PROJECT_NAME]`、`[PRINCIPLE_1_NAME]`）的模板。目标：（a）收集/推导具体值，（b）精确填充模板，（c）将改动同步到依赖的产物。

执行流程：

1. 加载 `.specify/memory/constitution.md` 现有模板。
   - 找出所有 `[ALL_CAPS_IDENTIFIER]` 形式的占位符。
   - **重要**：用户可能需要的原则数量与模板不同。若指定数量，遵循之；按通用模板更新。

2. 收集/推导占位符的值：
   - 若对话提供则直接使用。
   - 否则从仓库上下文推断（README、文档、嵌入的既有宪章）。
   - 治理日期：`RATIFICATION_DATE` 为最初通过日期（未知则询问或标 TODO），`LAST_AMENDED_DATE` 若有改动为今日，否则保持原值。
   - `CONSTITUTION_VERSION` 按语义化版本递增：
     - MAJOR：破坏性治理/原则移除或重定义
     - MINOR：新增原则/章节或实质扩展
     - PATCH：澄清、措辞、错字、非语义调整
   - 若版本类型不明，先给出理由再定稿。

3. 起草更新后的宪章内容：
   - 替换全部占位符（除非有意保留的模板槽，需显式说明原因）
   - 保持标题层级；占位说明若不再必要可移除
   - 每条原则需：简洁名称行 + 段落/要点描述不可妥协规则 + 如不明显则写明 rationale
   - 治理章节需包含修订流程、版本策略、合规审查期望

4. 一致性同步检查清单（将原 checklist 转为实时验证）：
   - 读取 `.specify/templates/plan-template.md`，确保 “Constitution Check” 或规则与更新后的原则对齐。
   - 读取 `.specify/templates/spec-template.md`，若宪章新增/移除强制章节或约束，需更新。
   - 读取 `.specify/templates/tasks-template.md`，若原则驱动任务类型新增/移除（如可观测性、版本化、测试规范）需反映。
   - 读取 `.specify/templates/commands/*.md`（包括当前文件），检查是否存在过时引用（如特定 agent 名），在需要通用指引时更新。
   - 读取运行时指引（如 `README.md`、`docs/quickstart.md` 或 agent 特定指引）并更新对变更原则的引用。

5. 生成同步影响报告（以 HTML 注释形式置于宪章文件顶部，更新后）：
   - 版本变更：旧 → 新
   - 修改的原则列表（旧标题 → 新标题，如有）
   - 新增章节
   - 移除章节
   - 需更新的模板（✅ 已更新 / ⚠ 待处理）及路径
   - 后续 TODO（若有保留占位）

6. 输出前验证：
   - 不留未解释的方括号占位
   - 版本行与报告一致
   - 日期使用 ISO 格式 YYYY-MM-DD
   - 原则具备可验证性、无模糊措辞（“should” → 替换为 MUST/SHOULD 并给出理由）

7. 将完成的宪章写回 `.specify/memory/constitution.md`（覆盖写）。

8. 对用户输出摘要：
   - 新版本与版本提升原因
   - 需人工跟进的文件
   - 建议的提交信息（如 `docs: amend constitution to vX.Y.Z (principle additions + governance update)`）

格式与风格要求：
- 使用模板中的 Markdown 标题（不降级/升级）
- 长 rationale 适度换行（<100 字符为佳）但不强行分割
- 节间保留单个空行
- 避免行尾空格

若用户只提供部分更新（如仅改一条原则），仍需执行校验与版本决策。

若关键信息缺失（如通过日期未知），插入 `TODO(<FIELD_NAME>): explanation`，并在同步影响报告中标记为延期项。

不要创建新模板；仅操作现有 `.specify/memory/constitution.md`。

