# 输出模式

当技能需要产生一致、高质量的输出时，请使用这些模式。

## 模板模式

提供输出格式的模板。根据您的需求匹配严格程度。

**对于严格要求（如 API 响应或数据格式）：**

```markdown
## 报告结构

始终使用此确切的模板结构：

# [分析标题]

## 执行摘要

[关键发现的一段概述]

## 关键发现

- 发现 1 及支持数据
- 发现 2 及支持数据
- 发现 3 及支持数据

## 建议

1. 具体可操作的建议
2. 具体可操作的建议
```

**对于灵活指导（当需要适应时）：**

```markdown
## 报告结构

以下是合理的默认格式，但请根据最佳判断使用：

# [分析标题]

## 执行摘要

[概述]

## 关键发现

[根据您的发现调整部分]

## 建议

[根据具体情况定制]

根据特定分析类型的需要调整部分。
```

## 示例模式

对于输出质量取决于查看示例的技能，提供输入/输出对：

```markdown
## 提交消息格式

按照以下示例生成提交消息：

**示例 1：**
输入：Added user authentication with JWT tokens
输出：
```

feat(auth): implement JWT-based authentication

Add login endpoint and token validation middleware

```

**示例 2：**
输入：Fixed bug where dates displayed incorrectly in reports
输出：
```

fix(reports): correct date formatting in timezone conversion

Use UTC timestamps consistently across report generation

```

遵循此风格：type(scope): 简要描述，然后是详细说明。
```

示例比单独的描述更能帮助 Claude 理解所需的风格和详细程度。
