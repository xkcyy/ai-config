---
description: 基于可用设计产物生成可执行、按依赖排序的 tasks.md。
handoffs: 
  - label: Analyze For Consistency
    agent: speckit.analyze
    prompt: Run a project analysis for consistency
    send: true
  - label: Implement Project
    agent: speckit.implement
    prompt: Start the implementation in phases
    send: true
---

## 用户输入

```text
$ARGUMENTS
```

在继续之前，**必须**先审视用户输入（若不为空）。

## 流程概要

1. **准备**：在仓库根运行 `.specify/scripts/powershell/check-prerequisites.ps1 -Json`，解析 FEATURE_DIR 与 AVAILABLE_DOCS 列表。所有路径必须为绝对路径。若参数包含单引号如 "I'm Groot"，需使用转义：如 'I'\''m Groot'（或可行时使用双引号："I'm Groot"）。

2. **加载设计文档**：从 FEATURE_DIR 读取：
   - **必需**：plan.md（技术栈、库、结构），spec.md（用户故事与优先级）
   - **可选**：data-model.md（实体）、contracts/（API 端点）、research.md（决策）、quickstart.md（测试场景）
   - 说明：并非所有项目都有全部文档；根据可用内容生成任务。

3. **执行任务生成工作流**：
   - 加载 plan.md，提取技术栈、库、项目结构
   - 加载 spec.md，提取用户故事及优先级（P1、P2、P3 等）
   - 若存在 data-model.md：提取实体并映射到用户故事
   - 若存在 contracts/：将端点映射到用户故事
   - 若存在 research.md：提取决策用于准备任务
   - 生成按用户故事组织的任务（见下方任务生成规则）
   - 生成用户故事完成顺序的依赖图
   - 为每个用户故事创建可并行执行示例
   - 校验任务完整性（每个用户故事具备所需任务且可独立测试）

4. **生成 tasks.md**：使用 `.specify/templates/tasks-template.md` 结构，并填写：
   - 来自 plan.md 的正确特性名称
   - Phase 1：准备任务（项目初始化）
   - Phase 2：基础任务（所有故事的前置阻塞项）
   - Phase 3+：每个用户故事一阶段（按 spec.md 优先级）
   - 每阶段包含：故事目标、独立测试标准、测试（若要求）、实现任务
   - 最终阶段：打磨与跨切面关注
   - 所有任务必须遵循严格的清单格式（见下方任务生成规则）
   - 清晰列出每个任务的文件路径
   - 依赖章节显示故事完成顺序
   - 为每个故事提供并行执行示例
   - 实施策略（MVP 优先，增量交付）

5. **报告**：输出生成的 tasks.md 路径与摘要：
   - 任务总数
   - 每个用户故事的任务数
   - 识别的并行机会
   - 每个故事的独立测试标准
   - 建议的 MVP 范围（通常仅用户故事 1）
   - 格式校验：确认所有任务遵循清单格式（复选框、ID、标签、文件路径）

任务生成上下文：$ARGUMENTS  
tasks.md 应可直接执行——每个任务都应具体到无需额外上下文，LLM 即可完成。

## 任务生成规则

**关键要求**：任务必须按用户故事组织，以便独立实现与测试。

**测试为可选**：仅在特性说明明确要求或用户请求 TDD 时生成测试任务。

### 清单格式（必需）

每条任务必须严格遵循：

```text
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**格式要素**：

1. **复选框**：始终以 `- [ ]` 开头（Markdown 复选框）
2. **Task ID**：按执行顺序的序号（T001、T002、T003...）
3. **[P] 标记**：仅当任务可并行（不同文件、无未完成依赖）时添加
4. **[Story] 标签**：仅用户故事阶段必填
   - 格式：[US1]、[US2]、[US3] 等（映射 spec.md 的用户故事）
   - 准备阶段：无故事标签
   - 基础阶段：无故事标签  
   - 用户故事阶段：必须有故事标签
   - 打磨阶段：无故事标签
5. **描述**：清晰动作并带精确文件路径

**示例**：

- ✅ 正确：`- [ ] T001 Create project structure per implementation plan`
- ✅ 正确：`- [ ] T005 [P] Implement authentication middleware in src/middleware/auth.py`
- ✅ 正确：`- [ ] T012 [P] [US1] Create User model in src/models/user.py`
- ✅ 正确：`- [ ] T014 [US1] Implement UserService in src/services/user_service.py`
- ❌ 错误：`- [ ] Create User model`（缺少 ID 与故事标签）
- ❌ 错误：`T001 [US1] Create model`（缺少复选框）
- ❌ 错误：`- [ ] [US1] Create User model`（缺少 Task ID）
- ❌ 错误：`- [ ] T001 [US1] Create model`（缺少文件路径）

### 任务组织

1. **来自用户故事（spec.md）—主要组织方式：**
   - 每个用户故事（P1、P2、P3...）对应一个阶段
   - 将相关组件映射到故事：
     - 该故事需要的模型
     - 该故事需要的服务
     - 该故事需要的端点/UI
     - 若要求测试：该故事专属测试任务
   - 标记故事依赖（多数故事应独立）

2. **来自 Contracts：**
   - 将每个 contract/endpoint → 映射到服务的用户故事
   - 若要求测试：每个 contract → 该故事阶段内的 contract 测试任务 [P]，在实现前

3. **来自数据模型：**
   - 将每个实体映射到需要它的用户故事
   - 若实体服务多个故事：放在最早的故事或准备阶段
   - 关系 → 在相应故事阶段的服务层任务

4. **来自准备/基础设施：**
   - 共享基础设施 → 准备阶段（Phase 1）
   - 共享阻塞项 → 基础阶段（Phase 2）
   - 故事特定的准备 → 放入对应故事阶段

### 阶段结构

- **Phase 1**：准备（项目初始化）
- **Phase 2**：基础（所有故事的阻塞前置）
- **Phase 3+**：按优先级的用户故事（P1、P2、P3...）
  - 每个故事内：测试（若要求）→ 模型 → 服务 → 端点 → 集成
  - 每个阶段应是可独立测试的完整增量
- **最终阶段**：打磨与跨切面关注

