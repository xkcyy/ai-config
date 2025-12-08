---
description: 基于可用设计产物，将现有任务转为可执行且有依赖顺序的 GitHub issue。
tools: ['github/github-mcp-server/issue_write']
---

## 用户输入

```text
$ARGUMENTS
```

在继续之前，**必须**先审视用户输入（若不为空）。

## 流程概要

1. 在仓库根运行 `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks`，解析 FEATURE_DIR 与 AVAILABLE_DOCS 列表。所有路径必须为绝对路径。若参数包含单引号如 "I'm Groot"，需使用转义：如 'I'\''m Groot'（或可行时使用双引号："I'm Groot"）。
1. 从执行结果中获取 **tasks** 的路径。
1. 运行获取 Git 远端：

```bash
git config --get remote.origin.url
```

> [!CAUTION]
> 仅当远端为 GitHub URL 时才能继续后续步骤

1. 对列表中的每个任务，使用 GitHub MCP server 在与 Git 远端对应的仓库中创建新的 issue。

> [!CAUTION]
> 绝不可在与远端 URL 不匹配的仓库中创建 issue

