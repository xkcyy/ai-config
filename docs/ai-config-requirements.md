# AI 编程伴侣配置同步需求

## 1. 背景与目标
- 统一远程仓库：`https://github.com/xkcyy/ai-coder-extends.git`，与本地任意工程 Git 仓库解耦。
- 约定配置根目录：`remote-config/ai/`，包含 `.cursor`、`.claude`，并可扩展更多 IDE 配置。
- 支持双向流程：一键同步远程配置到本地，以及一键推送本地变更到远程主分支，打造可复用的 AI IDE 配置中心。

## 2. 范围
- **包含**：
  - 远程仓库克隆、差异分析、同步覆盖、干运行、日志提示；
  - 推送命令：提交并推送到 `origin/main`（可通过参数覆盖仓库、目录、分支、提交信息）；
  - 本地备份/回滚机制、基础语法校验扩展点；
  - 跨平台（Windows/macOS/Linux）命令行入口与文档。
- **不包含**：仓库权限管理、CI/CD 集成、图形界面、`.cursor`/`.claude` 之外的 IDE 目录（待未来扩展）。

## 3. 用户与典型场景
- 面向在多 IDE（Claude、Code Cursor 等）间切换的工程师，尤其是以 Windows 为主的终端用户。
- 常见操作：
  1. Windows 用户在项目根执行 `py -3 ai-config sync --dry-run` 预览差异；
  2. 修改本地配置后，运行 `py -3 ai-config push --message "chore: sync"` 将变更合并进 GitHub 主分支；
  3. 需要时通过 `ai-config rollback <timestamp>` 快速回滚。

## 4. 功能需求
### 4.1 同步命令（`ai-config sync`）
- 默认从 `origin/main` 的 `remote-config/ai/` 拉取 `.cursor`、`.claude`；支持 `--repo`、`--branch`、`--remote-dir`、`--ref` 覆盖。
- 支持 `--dry-run`、`--force`、`--verbose` 控制行为。
- 远程目录不存在时提示用户先使用 `push` 初始化。

### 4.2 推送命令（`ai-config push`）
- 读取本地 `.cursor`、`.claude`，覆盖远程 `remote-config/ai/` 后执行 `git commit` + `git push origin <branch>`。
- 支持 `--repo`、`--branch`、`--remote-dir`、`--target`、`--message`，默认将提交直接推送到主分支。
- 若远程无变化则直接退出，避免空提交。

### 4.3 目录与特性覆盖
- `.cursor`、`.claude` 及其 commands、skills、prompts、workflows、toolchains 等子目录均采用镜像方式同步/推送。
- 不存在的目录自动创建；远程删除的文件将在本地移除，反之亦然。

### 4.4 差异与日志（简化）
- 输出新增/修改/删除统计信息；`--dry-run` 仅打印计划操作。
- 默认 INFO 级别日志，`--verbose` 切换为 DEBUG。

### 4.5 备份与回滚（简化）
- 每次同步覆盖前，自动备份到 `.ai-config-backup/<timestamp>`。
- `ai-config rollback <timestamp>` 直接恢复备份快照。

### 4.6 配置校验（简化）
- 预留 JSON/YAML 语法校验钩子，防止损坏 IDE 配置。校验失败即回滚并提示报错文件。

## 5. 非功能需求
- **架构（SOLID）**：同步器、推送器、备份器、Git 封装、路径校验等模块解耦，便于扩展新 IDE 或新目录。
- **性能目标**：首次同步（含浅克隆）< 30s，后续增量 < 10s；推送流程在典型 5MB 配置下 < 15s。
- **可观测性**：日志级别可调，命令失败需返回非零退出码。
- **跨平台**：不依赖特定 shell，默认命令在 Windows PowerShell/CMD 与 POSIX 终端一致。
- **可安装性**：提供一条 `pipx install git+...` 或 `pip install --user git+...` 的官方安装方式，自动把 `ai-config` 写入 PATH。

## 6. 成功判定与后续扩展
- `sync` / `push` 命令在默认配置下即可完成远程↔本地双向同步，且具备干运行、备份、回滚能力。
- README 提供 Windows 与 Linux/macOS 的快速上手指引，降低安装门槛。
- 支持一行命令完成全局安装，用户无需手动下载/复制脚本。
- 架构允许未来扩展 `.vscode`、`.idea` 等 IDE 目录，或接入 CI 流程自动分发配置。
