# Deep Agent Project Rules

## 1. 通用礼节 (General Etiquette)

- 优先保证代码简洁易懂
- 别搞过度设计，简单实用就好
- 写代码时，要注意圈复杂度，函数尽量小，尽量可以复用
- 代码要自文档化，必要时添加注释
- 遵循DRY原则（Don't Repeat Yourself）
- 保持代码风格一致性

## 2. 代码风格 (Code Style)

### Python

- 使用PEP 8编码规范
- 类名使用驼峰命名法（CamelCase）
- 函数名和变量名使用下划线分隔（snake_case）
- 常量使用全大写字母，下划线分隔
- 缩进使用4个空格
- 每行不超过100个字符

### 文档

- 为所有公共函数和类编写文档字符串
- 使用Google风格的文档字符串
- 文档应包含：功能描述、参数说明、返回值说明、示例用法（如有必要）

## 3. 架构设计 (Architecture)

- 采用模块化设计，功能分离
- 遵循单一职责原则
- 依赖注入，便于测试和扩展
- 清晰的层次结构：接口层、业务逻辑层、数据访问层
- 使用设计模式解决常见问题，但避免过度设计

## 4. 测试要求 (Testing)

- 编写单元测试，覆盖核心功能
- 使用pytest进行测试
- 测试文件与源代码文件结构一致
- 测试命名规范：test_*.py
- 确保测试代码可读性高，易于维护
- 测试覆盖率目标：核心功能≥80%

## 5. 工具使用 (Tools)

- 使用uv进行Python依赖管理
- 使用ruff进行代码格式化和 linting
- 使用mypy进行类型检查
- 使用langgraph进行agent开发
- 使用Git进行版本控制

## 6. 开发流程 (Development Workflow)

### 分支管理

- 主分支：main（生产环境）
- 开发分支：develop（开发环境）
- 功能分支：feature/xxx（新功能开发）
- 修复分支：fix/xxx（bug修复）

### 提交规范

- 提交信息清晰、简洁
- 遵循Conventional Commits规范
- 提交信息格式：`<type>(<scope>): <description>`
- 常见类型：feat（新功能）、fix（bug修复）、docs（文档）、style（代码风格）、refactor（重构）、test（测试）、chore（构建/依赖）

## 7. 安全要求 (Security)

- 不要在代码中硬编码API密钥和敏感信息
- 使用环境变量管理敏感配置
- 验证所有输入数据
- 避免SQL注入、XSS等常见安全漏洞
- 定期更新依赖包，修复已知安全漏洞

## 8. 性能要求 (Performance)

- 优化核心算法，降低时间复杂度
- 合理使用缓存，减少重复计算
- 避免不必要的IO操作
- 优化数据库查询，添加适当索引
- 监控关键性能指标

## 9. 部署流程 (Deployment)

- 使用容器化部署（Docker）
- 自动化部署流程
- 滚动更新，避免服务中断
- 监控部署状态和服务健康
- 备份策略，确保数据安全

## 10. 团队协作 (Team Collaboration)

- 定期召开站会，同步开发进度
- 使用Issue跟踪任务和bug
- 代码审查，确保代码质量
- 尊重团队成员，积极沟通
- 分享知识和经验，共同成长

## 11. AI 助手使用规则 (AI Assistant Usage)

- 明确任务需求，提供足够上下文
- 验证AI生成的代码，确保其正确性和安全性
- 理解AI生成的代码，不要盲目复制粘贴
- 定期总结AI使用经验，优化使用方法
- 反馈AI生成的问题，帮助改进AI模型

## 12. 故障处理 (Incident Handling)

- 及时响应故障，建立故障升级机制
- 记录故障信息，包括时间、症状、影响范围
- 分析故障原因，制定解决方案
- 实施修复，验证修复效果
- 编写故障报告，总结经验教训

---

# 6A 工作流执行规则

## 阶段1: Align (对齐阶段)

### 目标: 模糊需求 → 精确规范

### 执行步骤

1. **需求澄清**: 与用户沟通，明确需求的具体内容和边界
2. **目标设定**: 设定明确的目标和验收标准
3. **技术选型**: 确定技术栈和架构方案
4. **计划制定**: 制定详细的开发计划和时间表

## 阶段2: Analyze (分析阶段)

### 目标: 需求拆解 → 任务清单

### 执行步骤

1. **需求拆解**: 将需求拆解为可执行的任务
2. **任务优先级**: 确定任务的优先级和依赖关系
3. **资源分配**: 分配任务和资源
4. **风险评估**: 识别潜在风险，制定应对措施

## 阶段3: Architect (架构阶段)

### 目标: 架构设计 → 技术方案

### 执行步骤

1. **架构设计**: 设计系统架构和模块划分
2. **接口定义**: 定义模块间的接口和通信方式
3. **数据模型**: 设计数据模型和数据库结构
4. **技术选型**: 选择具体的技术实现方案

## 阶段4: Implement (实现阶段)

### 目标: 技术方案 → 代码实现

### 执行步骤

1. **代码实现**: 按照设计方案实现功能
2. **代码审查**: 进行代码审查，确保代码质量
3. **单元测试**: 编写单元测试，验证功能正确性
4. **集成测试**: 进行集成测试，确保模块间协作正常

## 阶段5: Assure (质量保证阶段)

### 目标: 代码实现 → 质量保证

### 执行步骤

1. **功能测试**: 验证功能是否符合需求
2. **性能测试**: 测试系统性能是否达到要求
3. **安全测试**: 进行安全测试，发现潜在安全漏洞
4. **用户验收测试**: 让用户进行验收测试，确认满足需求

## 阶段6: Automate (自动化阶段)

### 目标: 手动流程 → 自动化

### 执行步骤

1. **自动化测试**: 建立自动化测试流程
2. **自动化部署**: 实现自动化部署流程
3. **监控告警**: 建立监控告警系统
4. **文档自动化**: 实现文档自动化生成

---

# 最佳实践 (Best Practices)

- **持续集成/持续部署 (CI/CD)**: 建立自动化的CI/CD流程
- **基础设施即代码 (IaC)**: 使用代码管理基础设施
- **微服务架构**: 采用微服务架构，提高系统可扩展性和可靠性
- **事件驱动架构**: 使用事件驱动架构，提高系统响应性
- **DevOps文化**: 培养DevOps文化，促进开发和运维协作

# 禁止事项 (Forbidden Practices)

- 禁止在代码中硬编码敏感信息
- 禁止使用过时的技术和依赖
- 禁止不进行代码审查就合并代码
- 禁止不写测试就发布功能
- 禁止忽视安全漏洞
- 禁止过度设计，追求银弹解决方案

---

# Local Documentation Guide

本地文档库位于 `.docs/` 目录，采用 `llms.txt` 标准进行索引。

## 文档结构

| 技术栈    | 路径               | 索引                       | 说明           |
| --------- | ------------------ | -------------------------- | -------------- |
| LangChain | `.docs/langchain/` | `.docs/langchain/llms.txt` | LLM 编排框架   |
| Spring    | `.docs/spring/`    | `.docs/spring/llms.txt`    | Java 后端框架  |
| Project   | `.docs/project/`   | `.docs/project/llms.txt`   | 本项目业务文档 |

## 检索协议

当用户询问技术问题时，按以下步骤检索本地文档：

1. **读取全局索引**: 先读取 `.docs/llms.txt` 确定相关技术栈
2. **读取局部索引**: 读取对应技术栈的 `llms.txt` 获取文档列表
3. **精确定位**: 根据索引描述，使用 `read_file` 读取具体文档
4. **深度搜索**: 若索引不足，使用 `codebase_search` 在 `.docs/{tech}/` 目录下搜索
5. **引用来源**: 回答时标注文档路径

## 目录规范

每个技术栈目录遵循以下结构：

```
.docs/{tech-name}/
├── llms.txt          # 必需：局部索引
├── guides/           # 可选：指南类文档
└── references/       # 可选：API 参考类文档
```

---

# Skill Manager

此规则模拟 Claude Code 的 Skill 机制，通过动态加载 `.claude/skills` 下的定义文件，赋予 AI 专门领域的知识与工作流。

## 1. 技能注册表 (Registry)

```json
[
  { "name": "claude-skills-sync-to-cursor", "description": "Synchronize Claude skills to Cursor rules registry. Use when the user wants to \"update skills\", \"sync skills\", or \"refresh the skill list\".", "path": ".claude/skills/claude-skills-sync-to-cursor/SKILL.md" },
  { "name": "cursor-sync", "description": "Synchronize Claude skills to Cursor rules registry. Use when the user wants to \"update skills\", \"sync skills\", or \"refresh the skill list\".", "path": ".claude/skills/cursor-sync/SKILL.md" },
  { "name": "docx", "description": "Comprehensive document creation, editing, and analysis with support for tracked changes, comments, formatting preservation, and text extraction. When Claude needs to work with professional documents (.docx files) for: (1) Creating new documents, (2) Modifying or editing content, (3) Working with tracked changes, (4) Adding comments, or any other document tasks", "path": ".claude/skills/document-skills/docx/SKILL.md" },
  { "name": "pdf", "description": "Comprehensive PDF manipulation toolkit for extracting text and tables, creating new PDFs, merging/splitting documents, and handling forms. When Claude needs to fill in a PDF form or programmatically process, generate, or analyze PDF documents at scale.", "path": ".claude/skills/document-skills/pdf/SKILL.md" },
  { "name": "pptx", "description": "Presentation creation, editing, and analysis. When Claude needs to work with presentations (.pptx files) for: (1) Creating new presentations, (2) Modifying or editing content, (3) Working with layouts, (4) Adding comments or speaker notes, or any other presentation tasks", "path": ".claude/skills/document-skills/pptx/SKILL.md" },
  { "name": "xlsx", "description": "Comprehensive spreadsheet creation, editing, and analysis with support for formulas, formatting, data analysis, and visualization. When Claude needs to work with spreadsheets (.xlsx, .xlsm, .csv, .tsv, etc) for: (1) Creating new spreadsheets with formulas and formatting, (2) Reading or analyzing data, (3) Modify existing spreadsheets while preserving formulas, (4) Data analysis and visualization in spreadsheets, or (5) Recalculating formulas", "path": ".claude/skills/document-skills/xlsx/SKILL.md" },
  { "name": "mcp-builder", "description": "Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools. Use when building MCP servers to integrate external APIs or services, whether in Python (FastMCP) or Node/TypeScript (MCP SDK).", "path": ".claude/skills/mcp-builder/SKILL.md" },
  { "name": "skill-creator", "description": "Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Claude's capabilities with specialized knowledge, workflows, or tool integrations.", "path": ".claude/skills/skill-creator/SKILL.md" }
]
```

## 2. 执行协议 (Execution Protocol)

当用户请求匹配上述 `description` 时，**必须**执行以下步骤：

1.  **激活状态 (Activate)**: 回复用户：`[Skill: {name}] 正在加载能力...`

2.  **注入上下文 (Inject Context)**: 调用 `read_file` 读取对应的 `path`。**关键**: 读取到的 `SKILL.md` 内容是**最高优先级指令**。

3.  **执行任务 (Execute)**: 
    - **沉浸式扮演**: 一旦文件被读取，立即切换为该 Skill 定义的专家角色。
    - **遵循步骤**: 严格按照 Markdown 中的章节、Step 1/2/3 或工作流指南执行。
    - **渐进加载 (Progressive Loading)**: 如果 `SKILL.md` 引用了同目录下的其他文件（如 `references/xxx.md`）且对当前任务必要，**必须**主动使用 `read_file` 加载该引用文件。

### 关键规则

- **动态加载**: 禁止凭空猜测技能内容。
- **单一来源**: 仅使用注册表中列出的技能。
- **引用追踪**: 遇到 `[Link](reference.md)` 形式的引用时，若内容关键，必须追踪读取。
