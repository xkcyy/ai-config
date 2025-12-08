---
description: 在任务生成后，对 spec.md、plan.md、tasks.md 进行非破坏性的跨文档一致性与质量分析。
---

## 用户输入

```text
$ARGUMENTS
```

在继续之前，**必须**先审视用户输入（若不为空）。

## 目标

在实现前识别三大产物（`spec.md`、`plan.md`、`tasks.md`）间的不一致、重复、歧义与欠缺。仅在 `/speckit.tasks` 已成功生成完整 `tasks.md` 后运行。

## 运行约束

**严格只读**：不修改任何文件。输出结构化分析报告。可提供可选修复方案，但需用户明确批准后才进行手动后续编辑命令。

**宪章优先级**：项目宪章（`.specify/memory/constitution.md`）在本分析内不可被调整。与原则冲突属于 **CRITICAL**，需调整 spec/plan/tasks，而非弱化原则。若需修改原则，需在 `/speckit.analyze` 之外单独执行。

## 执行步骤

### 1. 初始化分析上下文

在仓库根运行 `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks` 一次，解析 FEATURE_DIR 与 AVAILABLE_DOCS。得到绝对路径：

- SPEC = FEATURE_DIR/spec.md
- PLAN = FEATURE_DIR/plan.md
- TASKS = FEATURE_DIR/tasks.md

若缺任一必需文件则报错（提示先运行缺失的命令）。若参数含单引号如 "I'm Groot"，需转义：如 'I'\''m Groot'（或可行时用双引号）。

### 2. 渐进加载产物

按需加载最少上下文：

**从 spec.md：**
- Overview/Context
- Functional Requirements
- Non-Functional Requirements
- User Stories
- Edge Cases（若有）

**从 plan.md：**
- Architecture/stack 选择
- Data Model 引用
- Phases
- 技术约束

**从 tasks.md：**
- Task ID
- 描述
- 阶段分组
- 并行标记 [P]
- 引用的文件路径

**从宪章：**
- 读取 `.specify/memory/constitution.md` 的原则进行校验

### 3. 构建语义模型

创建内部表示（输出中不包含原文）：
- **需求清单**：每条功能/非功能需求，生成稳定 key（如 “User can upload file” → `user-can-upload-file`）
- **用户故事/动作清单**：离散用户动作及验收标准
- **任务覆盖映射**：任务 → 需求/故事（基于关键词或显式引用）
- **宪章规则集**：提取原则名称与 MUST/SHOULD 规范语句

### 4. 检测（聚焦高信号）

限定最多 50 个发现；余下汇总。

#### A. 重复
- 识别近似重复的需求
- 标记较弱表述以便合并

#### B. 歧义
- 标记模糊形容词（fast/scalable/secure/intuitive/robust）缺乏度量
- 标记未解决的占位符（TODO/TKTK/??? 等）

#### C. 欠缺
- 动词有但缺对象/结果的需求
- 无验收对齐的用户故事
- 引用未在 spec/plan 定义的文件/组件的任务

#### D. 宪章对齐
- 任一违反 MUST 原则的需求或计划
- 宪章要求的章节/质量门缺失

#### E. 覆盖缺口
- 无任务关联的需求
- 无需求/故事映射的任务
- 非功能需求未落到任务（如性能/安全）

#### F. 不一致
- 术语漂移（同一概念不同命名）
- 计划引用的数据实体未在 spec 中出现（或反之）
- 任务顺序与依赖冲突（如未注明依赖就先集成）
- 冲突需求（如一个要求 Next.js，另一个要求 Vue）

### 5. 严重性分级

优先级准则：
- **CRITICAL**：违反宪章 MUST、缺失核心 spec 产物、基础功能无覆盖
-. **HIGH**：重复/冲突需求，安全/性能等高风险模糊，验收不可测
- **MEDIUM**：术语漂移、非功能任务缺失、边界欠缺
- **LOW**：措辞/风格改进，轻微冗余

### 6. 输出精简分析报告

生成 Markdown：

## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| A1 | Duplication | HIGH | spec.md:L120-134 | Two similar requirements ... | Merge phrasing; keep clearer version |

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|

**Constitution Alignment Issues:** （若有）

**Unmapped Tasks:** （若有）

**Metrics:**
- Total Requirements
- Total Tasks
- Coverage %（需求至少有 1 任务）
- Ambiguity Count
- Duplication Count
- Critical Issues Count

### 7. 提供下一步

在报告末尾给出简洁 Next Actions：
- 若存在 CRITICAL：建议在 `/speckit.implement` 前解决
- 仅 LOW/MEDIUM：可继续，但给出改进建议
- 提供明确命令建议：如 “Run /speckit.specify with refinement”、“Run /speckit.plan 调整架构”、“手动编辑 tasks.md 为 'performance-metrics' 添加覆盖”

### 8. 提供修复建议

询问用户：“需要我为最重要的 N 个问题给出具体修复建议吗？”（不要自动应用。）

## 运行原则

### 上下文效率
- **高信号最小化**：输出可执行发现，而非堆砌全文
- **渐进披露**：按需加载，不整段倾倒
- **节约 Token**：发现表最多 50 行；多余汇总
- **确定性**：无改动重跑应产出一致 ID 与计数

### 分析指南
- **绝不修改文件**（仅分析）
- **不臆测缺失章节**（若缺则如实报告）
- **优先宪章违规**（总为 CRITICAL）
- **用实例胜过泛论**（引用具体情况）
- **零问题时也要报告成功**（含覆盖统计）

## 上下文

$ARGUMENTS

