---
name: local-doc-manager
description: Local documentation retrieval, navigation, and synchronization using llms.txt standard. Use when users ask questions about LangChain, Spring, or project-specific documentation, need to search/browse the local knowledge base, or want to sync remote documentation to local.
---

# Local Documentation Manager

本地文档检索、导航与同步工具，基于 `llms.txt` 标准管理文档索引。

## 文档库结构

```
.docs/
├── llms.txt                    # 全局索引
├── sources.yaml                # 远程文档源配置
├── langchain/                  # LangChain 文档
│   ├── llms.txt
│   ├── guides/
│   └── references/
├── spring/                     # Spring 文档
│   ├── llms.txt
│   ├── guides/
│   └── references/
└── project/                    # 项目文档
    ├── llms.txt
    └── *.md
```

## 检索流程

### Step 1: 确定技术栈

读取 `.docs/llms.txt` 全局索引，根据用户问题确定相关技术栈。

### Step 2: 读取局部索引

读取对应技术栈的 `llms.txt`，例如：

- LangChain 问题 → `.docs/langchain/llms.txt`
- Spring 问题 → `.docs/spring/llms.txt`
- 项目架构问题 → `.docs/project/llms.txt`

### Step 3: 定位具体文档

根据索引中的描述，选择最相关的文档路径。

### Step 4: 读取文档内容

使用 `read_file` 读取具体文档，综合回答用户问题。

### Step 5: 深度搜索 (可选)

若索引中的文档不足以回答问题：

```
codebase_search(query="...", target_directories=[".docs/langchain/"])
```

## 文档同步

### 同步命令

```bash
# 安装依赖
pip install -r .claude/skills/local-doc-manager/scripts/requirements.txt

# 同步所有配置的源
python .claude/skills/local-doc-manager/scripts/sync_docs.py

# 同步指定源
python .claude/skills/local-doc-manager/scripts/sync_docs.py --source langgraph

# 预览模式 (不实际下载)
python .claude/skills/local-doc-manager/scripts/sync_docs.py --dry-run
```

### 配置文件

编辑 `.docs/sources.yaml` 添加文档源：

```yaml
sources:
  # Mintlify 站点
  - name: example
    type: mintlify
    base_url: https://docs.example.com
    target: .docs/example/

  # llms.txt 标准站点
  - name: langgraph
    type: llms-txt
    url: https://langchain-ai.github.io/langgraph/llms.txt
    target: .docs/langchain/

  # GitHub 仓库
  - name: spring
    type: github-raw
    repo: spring-projects/spring-framework
    branch: main
    docs_path: docs
    target: .docs/spring/
```

### 支持的站点类型

| 类型         | 说明              | 必需参数            |
| ------------ | ----------------- | ------------------- |
| `mintlify`   | Mintlify 文档站点 | `base_url`          |
| `llms-txt`   | llms.txt 标准站点 | `url`               |
| `github-raw` | GitHub 仓库       | `repo`, `docs_path` |

## 回答规范

- 引用文档时标注路径，如：`参考 .docs/langchain/guides/memory.md`
- 若文档内容不足，明确告知用户并建议补充
