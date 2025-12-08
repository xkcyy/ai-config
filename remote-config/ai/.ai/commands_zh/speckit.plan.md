---
description: 使用 plan 模板执行实施规划工作流，生成设计产物。
handoffs: 
  - label: Create Tasks
    agent: speckit.tasks
    prompt: Break the plan into tasks
    send: true
  - label: Create Checklist
    agent: speckit.checklist
    prompt: Create a checklist for the following domain...
    send: true
---

## 用户输入

```text
$ARGUMENTS
```

在继续之前，**必须**先审视用户输入（若不为空）。

## 流程概要

1. **准备**：在仓库根运行 `.specify/scripts/powershell/setup-plan.ps1 -Json`，解析 FEATURE_SPEC、IMPL_PLAN、SPECS_DIR、BRANCH。若参数包含单引号如 "I'm Groot"，需使用转义：如 'I'\''m Groot'（或可行时使用双引号："I'm Groot"）。

2. **加载上下文**：读取 FEATURE_SPEC 与 `.specify/memory/constitution.md`。加载已拷贝的 IMPL_PLAN 模板。

3. **执行规划工作流**：遵循 IMPL_PLAN 模板结构：
   - 填写 Technical Context（未知项标记为 “NEEDS CLARIFICATION”）
   - 填写 Constitution Check（来自 constitution）
   - 评估 gates（若违规且无理由则报错）
   - Phase 0：生成 research.md（解决全部 NEEDS CLARIFICATION）
   - Phase 1：生成 data-model.md、contracts/、quickstart.md
   - Phase 1：运行 agent 脚本更新 agent context
   - 再次评估 Constitution Check（设计后）

4. **停止并报告**：命令在 Phase 2 规划后结束。报告分支、IMPL_PLAN 路径与生成产物。

## 分阶段

### Phase 0：大纲与调研

1. 从 Technical Context 中提取未知项：
   - 每个 NEEDS CLARIFICATION → research 任务
   - 每个依赖 → best practices 任务
   - 每个集成 → patterns 任务

2. **生成并分发研究代理**：

   ```text
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **整合发现** 写入 `research.md`，格式：
   - Decision: [选择内容]
   - Rationale: [选择原因]
   - Alternatives considered: [评估的备选]

**输出**：包含全部 NEEDS CLARIFICATION 解决的 research.md

### Phase 1：设计与合同

**前提：** `research.md` 完成

1. **从特性规范提取实体** → `data-model.md`：
   - 实体名、字段、关系
   - 来自需求的校验规则
   - 状态变迁（若适用）

2. **从功能需求生成 API contract**：
   - 每个用户动作 → 一个端点
   - 采用标准 REST/GraphQL 模式
   - 输出 OpenAPI/GraphQL schema 至 `/contracts/`

3. **更新 agent context**：
   - 运行 `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude`
   - 脚本会检测使用的 AI agent
   - 更新对应 agent 特定的上下文文件
   - 仅添加当前计划中的新技术
   - 在标记间保留手动补充

**输出**：data-model.md，/contracts/*，quickstart.md，agent 特定文件

## 关键规则

- 使用绝对路径
- 对 gate 失败或未解决的澄清项报错

