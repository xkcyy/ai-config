---
description: 按 tasks.md 定义的全部任务执行实现计划。
---

## 用户输入

```text
$ARGUMENTS
```

在继续之前，**必须**先审视用户输入（若不为空）。

## 流程概要

1. 在仓库根运行 `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks`，解析 FEATURE_DIR 与 AVAILABLE_DOCS 列表。所有路径必须为绝对路径。若参数包含单引号如 "I'm Groot"，需使用转义：如 'I'\''m Groot'（或可行时使用双引号："I'm Groot"）。

2. **检查 checklist 状态**（若存在 FEATURE_DIR/checklists/）：
   - 扫描 checklists/ 中所有文件
   - 对每个 checklist 统计：
     - Total：匹配 `- [ ]`、`- [X]`、`- [x]` 的行数
     - Completed：匹配 `- [X]` 或 `- [x]`
     - Incomplete：匹配 `- [ ]`
   - 创建状态表：

     ```text
     | Checklist | Total | Completed | Incomplete | Status |
     |-----------|-------|-----------|------------|--------|
     | ux.md     | 12    | 12        | 0          | ✓ PASS |
     | test.md   | 8     | 5         | 3          | ✗ FAIL |
     | security.md | 6   | 6         | 0          | ✓ PASS |
     ```

   - 计算总体状态：
     - **PASS**：所有 checklist 均无未完成项
     - **FAIL**：任一 checklist 存在未完成项

   - **若存在未完成 checklist**：
     - 展示表格与未完成数
     - **停止** 并询问：“一些 checklist 未完成。仍要继续实施吗？(yes/no)”
     - 等待用户响应后再继续
     - 若用户回复 "no"/"wait"/"stop" 则停止
     - 若用户回复 "yes"/"proceed"/"continue" 则进入步骤 3

   - **若全部 checklist 已完成**：
     - 展示所有通过的表格
     - 自动进入步骤 3

3. 加载并分析实施上下文：
   - **必需**：读取 tasks.md 获取完整任务列表与执行计划
   - **必需**：读取 plan.md 获取技术栈、架构、文件结构
   - **若存在**：读取 data-model.md 获取实体与关系
   - **若存在**：读取 contracts/ 获取 API 规范与测试要求
   - **若存在**：读取 research.md 获取技术决策与约束
   - **若存在**：读取 quickstart.md 获取集成场景

4. **项目设置校验**：
   - **必需**：依据实际项目设置创建/校验 ignore 文件：

   **检测与创建逻辑**：
   - 检查以下命令以确定是否为 git 仓库（若是则创建/校验 .gitignore）：

     ```sh
     git rev-parse --git-dir 2>/dev/null
     ```

   - 若存在 Dockerfile* 或 plan.md 提及 Docker → 创建/校验 .dockerignore
   - 若存在 .eslintrc* → 创建/校验 .eslintignore
   - 若存在 eslint.config.* → 确保 config 的 `ignores` 覆盖所需模式
   - 若存在 .prettierrc* → 创建/校验 .prettierignore
   - 若存在 .npmrc 或 package.json → 创建/校验 .npmignore（若要发布）
   - 若存在 terraform 文件 (*.tf) → 创建/校验 .terraformignore
   - 若需要 .helmignore（存在 helm charts）→ 创建/校验 .helmignore

   **若 ignore 文件已存在**：验证包含关键模式，仅追加缺失的关键模式  
   **若缺失**：根据检测到的技术创建完整模式

   **常用模式按技术**（来自 plan.md 技术栈）：
   - **Node.js/JavaScript/TypeScript**：`node_modules/`、`dist/`、`build/`、`*.log`、`.env*`
   - **Python**：`__pycache__/`、`*.pyc`、`.venv/`、`venv/`、`dist/`、`*.egg-info/`
   - **Java**：`target/`、`*.class`、`*.jar`、`.gradle/`、`build/`
   - **C#/.NET**：`bin/`、`obj/`、`*.user`、`*.suo`、`packages/`
   - **Go**：`*.exe`、`*.test`、`vendor/`、`*.out`
   - **Ruby**：`.bundle/`、`log/`、`tmp/`、`*.gem`、`vendor/bundle/`
   - **PHP**：`vendor/`、`*.log`、`*.cache`、`.env`
   - **Rust**：`target/`、`debug/`、`release/`、`*.rs.bk`、`*.rlib`、`*.prof*`、`.idea/`、`*.log`、`.env*`
   - **Kotlin**：`build/`、`out/`、`.gradle/`、`.idea/`、`*.class`、`*.jar`、`*.iml`、`*.log`、`.env*`
   - **C++**：`build/`、`bin/`、`obj/`、`out/`、`*.o`、`*.so`、`*.a`、`*.exe`、`*.dll`、`.idea/`、`*.log`、`.env*`
   - **C**：`build/`、`bin/`、`obj/`、`out/`、`*.o`、`*.a`、`*.so`、`*.exe`、`Makefile`、`config.log`、`.idea/`、`*.log`、`.env*`
   - **Swift**：`.build/`、`DerivedData/`、`*.swiftpm/`、`Packages/`
   - **R**：`.Rproj.user/`、`.Rhistory`、`.RData`、`.Ruserdata`、`*.Rproj`、`packrat/`、`renv/`
   - **通用**：`.DS_Store`、`Thumbs.db`、`*.tmp`、`*.swp`、`.vscode/`、`.idea/`

   **工具特定模式**：
   - **Docker**：`node_modules/`、`.git/`、`Dockerfile*`、`.dockerignore`、`*.log*`、`.env*`、`coverage/`
   - **ESLint**：`node_modules/`、`dist/`、`build/`、`coverage/`、`*.min.js`
   - **Prettier**：`node_modules/`、`dist/`、`build/`、`coverage/`、`package-lock.json`、`yarn.lock`、`pnpm-lock.yaml`
   - **Terraform**：`.terraform/`、`*.tfstate*`、`*.tfvars`、`.terraform.lock.hcl`
   - **Kubernetes/k8s**：`*.secret.yaml`、`secrets/`、`.kube/`、`kubeconfig*`、`*.key`、`*.crt`

5. 解析 tasks.md 结构并提取：
   - **任务阶段**：Setup、Tests、Core、Integration、Polish
   - **任务依赖**：顺序 vs 并行规则
   - **任务详情**：ID、描述、文件路径、并行标记 [P]
   - **执行流**：顺序与依赖要求

6. 按任务计划执行实现：
   - **按阶段**：完成每阶段再进入下一阶段
   - **遵循依赖**：顺序任务按序，标记 [P] 的并行执行  
   - **TDD**：在实现前执行对应测试任务
   - **文件协调**：同一文件的任务必须顺序执行
   - **验证点**：每阶段结束做完成校验

7. 实施执行规则：
   - **先准备**：初始化结构、依赖、配置
   - **测试先于代码**：若需编写 contract、实体、集成测试
   - **核心开发**：实现模型、服务、CLI、端点
   - **集成工作**：数据库连接、中间件、日志、外部服务
   - **打磨与验证**：单元测试、性能优化、文档

8. 进度与错误处理：
   - 每完成任务汇报进度
   - 若非并行任务失败则停下
   - 并行任务 [P]：成功的继续，失败的报告
   - 提供清晰错误信息与调试上下文
   - 若无法继续，建议下一步
   - **重要**：完成的任务需在 tasks 文件中标记为 [X]

9. 完成校验：
   - 确认所有必需任务完成
   - 检查实现与原规范一致
   - 验证测试通过且覆盖率符合要求
   - 确认实现遵循技术计划
   - 输出最终状态与完成摘要

说明：此命令假设 tasks.md 已完整。若任务不全或缺失，建议先运行 `/speckit.tasks` 重新生成。

