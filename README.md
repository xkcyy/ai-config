# ai-config

## AI 配置同步 & 推送工具 (Node.js + TypeScript)

`ai-config` 是一个基于 Node.js 和 TypeScript 的命令行工具，用于将本地的 `.cursor` 和 `.claude` 配置目录与远程 Git 仓库的配置目录保持同步。

### 功能特性

- **同步**：从远程仓库拉取最新的 Claude/Code Cursor 配置到当前项目
- **推送**：将当前项目的配置提交并推送到远程仓库
- **回滚**：从备份恢复本地配置到指定时间点
- **跨平台**：兼容 Windows、macOS、Linux (需要 Node.js ≥ 16.0.0)

### 快速开始

#### Windows (PowerShell/CMD)
```powershell
# 查看帮助
ai-config --help

# 预览同步差异（干运行）
ai-config sync --dry-run

# 将本地配置推送到远程仓库
ai-config push --message "chore: sync configurations"
```

#### Linux/macOS
```bash
# 查看帮助
ai-config --help

# 同步远程配置到本地
ai-config sync

# 推送本地配置到远程
ai-config push --message "chore: sync configurations"
```

### 安装

#### 推荐方式：npm 全局安装
```bash
# 从 npm 安装
npm install -g ai-config

# 或从 Gitee 直接安装
npm install -g https://gitee.com/xkcyy/ai-config.git
```

#### 开发方式：本地安装
```bash
# 克隆仓库
git clone https://gitee.com/xkcyy/ai-config.git
cd ai-config

# 安装依赖
npm install

# 构建项目
npm run build

# 全局安装
npm install -g .
```

### 常用命令

```bash
# 同步配置（干运行模式）
ai-config sync --dry-run --verbose

# 指定远程仓库、分支和目录
ai-config sync --repo https://gitee.com/xkcyy/ai-config.git \
                --branch master \
                --remote-dir remote-config/ai

# 强制同步（忽略本地未提交的更改）
ai-config sync --force

# 推送到指定分支和目录
ai-config push --remote-dir remote-config/ai --branch master

# 自定义提交信息
ai-config push --message "feat: update claude settings"

# 回滚到指定时间点的备份
ai-config rollback 20251130-103000
```

### 工作流程说明

- **默认远程仓库**：指向 Gitee 仓库 `https://gitee.com/xkcyy/ai-config.git` 的 `remote-config/ai/` 目录
- **同步流程**：
  1. 克隆远程仓库的指定分支
  2. 读取远程 `remote-config/ai/.cursor/.claude` 配置
  3. 计算与本地配置的差异
  4. 支持干运行模式预览变更
  5. 自动备份本地配置
  6. 用远程配置覆盖本地配置
- **推送流程**：
  1. 克隆远程仓库
  2. 用本地 `.cursor/.claude` 完全覆盖 `remote-config/ai/`
  3. 检测到变更时自动执行 git commit 和 git push
  4. 需要配置好本地 Git 的 user.name 和 user.email
- **备份与回滚**：每次同步或推送前都会将本地配置备份到 `.ai-config-backup/<timestamp>/`

### 参数说明

- `--repo`：远程仓库地址（默认指向 Gitee 主仓库）
- `--branch`：同步或推送的远程分支，默认 `master`
- `--remote-dir`：远程仓库中存放配置的目录，默认 `remote-config/ai`
- `--target`：本地项目根目录，默认为当前目录
- `--message`：推送时的提交信息
- `--dry-run`：预览模式，不执行实际操作
- `--force`：强制执行，忽略本地未提交的更改
- `--verbose`：显示详细输出

### 故障排查

- 确保本机可以直接 `git clone` 和 `git push` 目标仓库
- 如果 `sync` 提示 "Remote directory not found"，说明远程尚未初始化配置，需要先执行 `ai-config push`
- 如果 `push` 显示 "non-fast-forward"，请先执行 `ai-config sync` 获取最新配置，然后再次推送
- 使用 `--verbose` 参数可以查看详细的 Git 命令执行过程

### 依赖要求

- Node.js ≥ 16.0.0
- npm ≥ 8.0.0
- Git ≥ 2.30

### 开发

```bash
# 安装开发依赖
npm install

# 开发模式运行
npm run dev

# 构建
npm run build

# 测试
npm test
```

### 许可证

MIT License

### 贡献

欢迎提交 Pull Request 和 Issue！