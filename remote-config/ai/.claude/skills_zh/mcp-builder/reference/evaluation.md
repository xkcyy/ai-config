# MCP Server 评估指南

## 概述

本文档提供了为 MCP 服务器创建全面评估的指导。评估测试 LLM 是否能仅使用提供的工具，有效地使用您的 MCP 服务器回答真实、复杂的问题。

---

## 快速参考

### 评估要求

- 创建 10 个人类可读的问题
- 问题必须是只读、独立、非破坏性的
- 每个问题需要多个工具调用（可能几十个）
- 答案必须是单一、可验证的值
- 答案必须稳定（不会随时间变化）

### 输出格式

```xml
<evaluation>
   <qa_pair>
      <question>Your question here</question>
      <answer>Single verifiable answer</answer>
   </qa_pair>
</evaluation>
```

---

## 评估的目的

MCP 服务器质量的衡量标准**不是**服务器实现工具的好坏或全面程度，而是这些实现（输入/输出模式、文档字符串/描述、功能）如何使 LLM 在没有其他上下文且**仅**访问 MCP 服务器的情况下，能够回答真实和困难的问题。

## 评估概述

创建 10 个人类可读的问题，需要**仅**使用只读、独立、非破坏性和幂等操作来回答。每个问题应该：

- 真实
- 清晰简洁
- 明确无误
- 复杂，可能需要几十个工具调用或步骤
- 可以用您预先确定的单一、可验证的值来回答

## 问题指南

### 核心要求

1. **问题必须独立**

   - 每个问题不应依赖于任何其他问题的答案
   - 不应假设处理另一个问题时的先前写入操作

2. **问题必须仅需要非破坏性和幂等的工具使用**

   - 不应指示或要求修改状态以得出正确答案

3. **问题必须真实、清晰、简洁且复杂**
   - 必须要求另一个 LLM 使用多个（可能几十个）工具或步骤来回答

### 复杂性和深度

4. **问题必须需要深入探索**

   - 考虑需要多个子问题和顺序工具调用的多跳问题
   - 每个步骤都应受益于之前问题中找到的信息

5. **问题可能需要大量分页**

   - 可能需要分页浏览多页结果
   - 可能需要查询旧数据（1-2 年前的数据）以查找小众信息
   - 问题必须困难

6. **问题必须需要深度理解**

   - 而不是表面知识
   - 可能将复杂想法作为需要证据的 True/False 问题
   - 可能使用多选格式，其中 LLM 必须搜索不同的假设

7. **问题不能通过简单的关键词搜索解决**
   - 不要包含目标内容中的特定关键词
   - 使用同义词、相关概念或释义
   - 需要多次搜索、分析多个相关项目、提取上下文，然后得出答案

### 工具测试

8. **问题应压力测试工具返回值**

   - 可能导致工具返回大型 JSON 对象或列表，使 LLM 不堪重负
   - 应要求理解多种数据模式：
     - ID 和名称
     - 时间戳和日期时间（月、日、年、秒）
     - 文件 ID、名称、扩展名和 mimetype
     - URL、GID 等
   - 应探查工具返回所有有用数据形式的能力

9. **问题应主要反映真实人类用例**

   - 人类在 LLM 协助下会关心的信息检索任务类型

10. **问题可能需要几十个工具调用**

    - 这会挑战上下文有限的 LLM
    - 鼓励 MCP 服务器工具减少返回的信息

11. **包含模糊问题**
    - 可能模糊或需要在调用哪些工具上做出困难决策
    - 迫使 LLM 可能犯错误或误解
    - 确保尽管有模糊性，仍然有一个单一的可验证答案

### 稳定性

12. **问题的设计必须使答案不会改变**

    - 不要问依赖于"当前状态"的问题，因为它是动态的
    - 例如，不要计算：
      - 帖子的反应数量
      - 线程的回复数量
      - 频道中的成员数量

13. **不要让 MCP 服务器限制您创建的问题类型**
    - 创建具有挑战性和复杂性的问题
    - 有些可能无法使用可用的 MCP 服务器工具解决
    - 问题可能需要特定的输出格式（日期时间 vs. 纪元时间，JSON vs. MARKDOWN）
    - 问题可能需要几十个工具调用才能完成

## 答案指南

### 验证

1. **答案必须可通过直接字符串比较验证**
   - 如果答案可以用多种格式重写，请在问题中明确指定输出格式
   - 示例："使用 YYYY/MM/DD。"、"回答 True 或 False。"、"回答 A、B、C 或 D，仅此而已。"
   - 答案应该是单一的可验证值，例如：
     - 用户 ID、用户名、显示名称、名字、姓氏
     - 频道 ID、频道名称
     - 消息 ID、字符串
     - URL、标题
     - 数值
     - 时间戳、日期时间
     - 布尔值（对于 True/False 问题）
     - 电子邮件地址、电话号码
     - 文件 ID、文件名、文件扩展名
     - 多选答案
   - 答案不需要特殊格式或复杂的结构化输出
   - 答案将使用直接字符串比较进行验证

### 可读性

2. **答案通常应优先使用人类可读格式**
   - 示例：名称、名字、姓氏、日期时间、文件名、消息字符串、URL、是/否、true/false、a/b/c/d
   - 而不是不透明的 ID（尽管 ID 是可接受的）
   - 绝大多数答案应该是人类可读的

### 稳定性

3. **答案必须稳定/固定**

   - 查看旧内容（例如，已结束的对话、已启动的项目、已回答的问题）
   - 基于"已关闭"的概念创建问题，这些概念将始终返回相同的答案
   - 问题可能要求考虑固定的时间窗口，以避免非固定答案
   - 依赖不太可能改变的上下文
   - 示例：如果查找论文名称，要足够具体，以免与后来发表的论文混淆

4. **答案必须清晰明确**
   - 问题的设计必须有一个单一、清晰的答案
   - 答案可以通过使用 MCP 服务器工具得出

### 多样性

5. **答案必须多样化**

   - 答案应该是不同模式和格式的单一可验证值
   - 用户概念：用户 ID、用户名、显示名称、名字、姓氏、电子邮件地址、电话号码
   - 频道概念：频道 ID、频道名称、频道主题
   - 消息概念：消息 ID、消息字符串、时间戳、月、日、年

6. **答案不得是复杂结构**
   - 不是值列表
   - 不是复杂对象
   - 不是 ID 或字符串列表
   - 不是自然语言文本
   - 除非答案可以通过直接字符串比较直接验证
   - 并且可以实际重现
   - LLM 不太可能以任何其他顺序或格式返回相同的列表

## 评估过程

### 步骤 1：文档检查

阅读目标 API 的文档，了解：

- 可用的端点和功能
- 如果存在歧义，从网络获取额外信息
- 尽可能并行化此步骤
- 确保每个子代理仅检查文件系统或网络上的文档

### 步骤 2：工具检查

列出 MCP 服务器中可用的工具：

- 直接检查 MCP 服务器
- 了解输入/输出模式、文档字符串和描述
- 在此阶段**不要**调用工具本身

### 步骤 3：发展理解

重复步骤 1 和 2，直到您有良好的理解：

- 多次迭代
- 考虑您想要创建的任务类型
- 完善您的理解
- 在任何阶段都不应**阅读** MCP 服务器实现本身的代码
- 使用您的直觉和理解来创建合理、现实但非常具有挑战性的任务

### 步骤 4：只读内容检查

了解 API 和工具后，**使用** MCP 服务器工具：

- 仅使用只读和非破坏性操作检查内容
- 目标：识别用于创建现实问题的特定内容（例如，用户、频道、消息、项目、任务）
- 不应调用任何修改状态的工具
- 不会阅读 MCP 服务器实现本身的代码
- 使用独立探索的单个子代理并行化此步骤
- 确保每个子代理仅执行只读、非破坏性和幂等操作
- 小心：某些工具可能返回大量数据，导致您耗尽上下文
- 进行增量、小型和有针对性的工具调用进行探索
- 在所有工具调用请求中，使用 `limit` 参数限制结果（<10）
- 使用分页

### 步骤 5：任务生成

检查内容后，创建 10 个人类可读的问题：

- LLM 应该能够使用 MCP 服务器回答这些问题
- 遵循上述所有问题和答案指南

## 输出格式

每个 QA 对由一个问题和一个答案组成。输出应该是一个 XML 文件，具有以下结构：

```xml
<evaluation>
   <qa_pair>
      <question>Find the project created in Q2 2024 with the highest number of completed tasks. What is the project name?</question>
      <answer>Website Redesign</answer>
   </qa_pair>
   <qa_pair>
      <question>Search for issues labeled as "bug" that were closed in March 2024. Which user closed the most issues? Provide their username.</question>
      <answer>sarah_dev</answer>
   </qa_pair>
   <qa_pair>
      <question>Look for pull requests that modified files in the /api directory and were merged between January 1 and January 31, 2024. How many different contributors worked on these PRs?</question>
      <answer>7</answer>
   </qa_pair>
   <qa_pair>
      <question>Find the repository with the most stars that was created before 2023. What is the repository name?</question>
      <answer>data-pipeline</answer>
   </qa_pair>
</evaluation>
```

## 评估示例

### 好的问题

**示例 1：需要深入探索的多跳问题（GitHub MCP）**

```xml
<qa_pair>
   <question>Find the repository that was archived in Q3 2023 and had previously been the most forked project in the organization. What was the primary programming language used in that repository?</question>
   <answer>Python</answer>
</qa_pair>
```

这个问题很好，因为：

- 需要多次搜索才能找到已归档的仓库
- 需要确定哪些仓库在归档前拥有最多的分支
- 需要检查仓库详情以获取语言信息
- 答案是一个简单、可验证的值
- 基于不会改变的历史（已关闭）数据

**示例 2：需要理解上下文而不进行关键词匹配（项目管理 MCP）**

```xml
<qa_pair>
   <question>Locate the initiative focused on improving customer onboarding that was completed in late 2023. The project lead created a retrospective document after completion. What was the lead's role title at that time?</question>
   <answer>Product Manager</answer>
</qa_pair>
```

这个问题很好，因为：

- 不使用特定项目名称（"专注于改进客户入职的计划"）
- 需要查找特定时间框架内完成的项目
- 需要识别项目负责人及其角色
- 需要理解回顾文档的上下文
- 答案是人类可读且稳定的
- 基于已完成的工作（不会改变）

**示例 3：需要多个步骤的复杂聚合（问题跟踪器 MCP）**

```xml
<qa_pair>
   <question>Among all bugs reported in January 2024 that were marked as critical priority, which assignee resolved the highest percentage of their assigned bugs within 48 hours? Provide the assignee's username.</question>
   <answer>alex_eng</answer>
</qa_pair>
```

这个问题很好，因为：

- 需要按日期、优先级和状态过滤错误
- 需要按负责人分组并计算解决率
- 需要理解时间戳以确定 48 小时窗口
- 测试分页（可能需要处理许多错误）
- 答案是单个用户名
- 基于特定时间段的历史数据

**示例 4：需要跨多种数据类型进行综合（CRM MCP）**

```xml
<qa_pair>
   <question>Find the account that upgraded from the Starter to Enterprise plan in Q4 2023 and had the highest annual contract value. What industry does this account operate in?</question>
   <answer>Healthcare</answer>
</qa_pair>
```

这个问题很好，因为：

- 需要理解订阅层级变更
- 需要识别特定时间段内的升级事件
- 需要比较合同价值
- 必须访问账户行业信息
- 答案简单且可验证
- 基于已完成的历史交易

### 不好的问题

**示例 1：答案随时间变化**

```xml
<qa_pair>
   <question>How many open issues are currently assigned to the engineering team?</question>
   <answer>47</answer>
</qa_pair>
```

这个问题不好，因为：

- 随着问题的创建、关闭或重新分配，答案会改变
- 不基于稳定/固定数据
- 依赖于动态的"当前状态"

**示例 2：通过关键词搜索太容易**

```xml
<qa_pair>
   <question>Find the pull request with title "Add authentication feature" and tell me who created it.</question>
   <answer>developer123</answer>
</qa_pair>
```

这个问题不好，因为：

- 可以通过对确切标题的简单关键词搜索来解决
- 不需要深入探索或理解
- 不需要综合或分析

**示例 3：答案格式不明确**

```xml
<qa_pair>
   <question>List all the repositories that have Python as their primary language.</question>
   <answer>repo1, repo2, repo3, data-pipeline, ml-tools</answer>
</qa_pair>
```

这个问题不好，因为：

- 答案是一个可以按任何顺序返回的列表
- 难以通过直接字符串比较验证
- LLM 可能格式不同（JSON 数组、逗号分隔、换行分隔）
- 更好的做法是询问特定的聚合（计数）或最高级（最多星标）

## 验证过程

创建评估后：

1. **检查 XML 文件**以理解模式
2. **加载每个任务指令**，并使用 MCP 服务器和工具并行地尝试自己解决任务，确定正确答案
3. **标记任何需要写入或破坏性操作的操作**
4. **累积所有正确答案**并替换文档中的任何错误答案
5. **删除任何需要写入或破坏性操作的 `<qa_pair>`**

记住要并行化解决任务，以避免耗尽上下文，然后累积所有答案并在最后对文件进行更改。

## 创建高质量评估的提示

1. **在生成任务前认真思考并提前计划**
2. **在机会出现时并行化**以加快进程并管理上下文
3. **专注于现实用例**，人类实际上想要完成的任务
4. **创建具有挑战性的问题**，测试 MCP 服务器功能的极限
5. **通过使用历史数据和关闭的概念确保稳定性**
6. **通过使用 MCP 服务器工具自己解决问题来验证答案**
7. **根据过程中学习的内容进行迭代和完善**

---

# 运行评估

创建评估文件后，您可以使用提供的评估工具来测试您的 MCP 服务器。

## 设置

1. **安装依赖**

   ```bash
   pip install -r scripts/requirements.txt
   ```

   或手动安装：

   ```bash
   pip install anthropic mcp
   ```

2. **设置 API 密钥**

   ```bash
   export ANTHROPIC_API_KEY=your_api_key_here
   ```

## 评估文件格式

评估文件使用 XML 格式，包含 `<qa_pair>` 元素：

```xml
<evaluation>
   <qa_pair>
      <question>Find the project created in Q2 2024 with the highest number of completed tasks. What is the project name?</question>
      <answer>Website Redesign</answer>
   </qa_pair>
   <qa_pair>
      <question>Search for issues labeled as "bug" that were closed in March 2024. Which user closed the most issues? Provide their username.</question>
      <answer>sarah_dev</answer>
   </qa_pair>
</evaluation>
```

## 运行评估

评估脚本 (`scripts/evaluation.py`) 支持三种传输类型：

**重要提示：**

- **stdio 传输**：评估脚本会自动为您启动和管理 MCP 服务器进程。不要手动运行服务器。
- **sse/http 传输**：您必须在运行评估之前单独启动 MCP 服务器。脚本连接到指定 URL 上已运行的服务器。

### 1. 本地 STDIO 服务器

对于本地运行的 MCP 服务器（脚本自动启动服务器）：

```bash
python scripts/evaluation.py \
  -t stdio \
  -c python \
  -a my_mcp_server.py \
  evaluation.xml
```

使用环境变量：

```bash
python scripts/evaluation.py \
  -t stdio \
  -c python \
  -a my_mcp_server.py \
  -e API_KEY=abc123 \
  -e DEBUG=true \
  evaluation.xml
```

### 2. 服务器发送事件 (SSE)

对于基于 SSE 的 MCP 服务器（您必须先启动服务器）：

```bash
python scripts/evaluation.py \
  -t sse \
  -u https://example.com/mcp \
  -H "Authorization: Bearer token123" \
  -H "X-Custom-Header: value" \
  evaluation.xml
```

### 3. HTTP（可流式 HTTP）

对于基于 HTTP 的 MCP 服务器（您必须先启动服务器）：

```bash
python scripts/evaluation.py \
  -t http \
  -u https://example.com/mcp \
  -H "Authorization: Bearer token123" \
  evaluation.xml
```

## 命令行选项

```
usage: evaluation.py [-h] [-t {stdio,sse,http}] [-m MODEL] [-c COMMAND]
                     [-a ARGS [ARGS ...]] [-e ENV [ENV ...]] [-u URL]
                     [-H HEADERS [HEADERS ...]] [-o OUTPUT]
                     eval_file

positional arguments:
  eval_file             评估 XML 文件路径

optional arguments:
  -h, --help            显示帮助消息
  -t, --transport       传输类型：stdio、sse 或 http（默认：stdio）
  -m, --model           使用的 Claude 模型（默认：claude-3-7-sonnet-20250219）
  -o, --output          报告输出文件（默认：打印到标准输出）

stdio 选项：
  -c, --command         运行 MCP 服务器的命令（例如，python、node）
  -a, --args            命令的参数（例如，server.py）
  -e, --env             KEY=VALUE 格式的环境变量

sse/http 选项：
  -u, --url             MCP 服务器 URL
  -H, --header          'Key: Value' 格式的 HTTP 头
```

## 输出

评估脚本生成详细报告，包括：

- **摘要统计**：

  - 准确率（正确/总数）
  - 平均任务持续时间
  - 每个任务的平均工具调用次数
  - 总工具调用次数

- **每个任务的结果**：
  - 提示和预期响应
  - 代理的实际响应
  - 答案是否正确（✅/❌）
  - 持续时间和工具调用详情
  - 代理对其方法的总结
  - 代理对工具的反馈

### 将报告保存到文件

```bash
python scripts/evaluation.py \
  -t stdio \
  -c python \
  -a my_server.py \
  -o evaluation_report.md \
  evaluation.xml
```

## 完整示例工作流程

以下是创建和运行评估的完整示例：

1. **创建您的评估文件** (`my_evaluation.xml`)：

```xml
<evaluation>
   <qa_pair>
      <question>Find the user who created the most issues in January 2024. What is their username?</question>
      <answer>alice_developer</answer>
   </qa_pair>
   <qa_pair>
      <question>Among all pull requests merged in Q1 2024, which repository had the highest number? Provide the repository name.</question>
      <answer>backend-api</answer>
   </qa_pair>
   <qa_pair>
      <question>Find the project that was completed in December 2023 and had the longest duration from start to finish. How many days did it take?</question>
      <answer>127</answer>
   </qa_pair>
</evaluation>
```

2. **安装依赖**：

```bash
pip install -r scripts/requirements.txt
export ANTHROPIC_API_KEY=your_api_key
```

3. **运行评估**：

```bash
python scripts/evaluation.py \
  -t stdio \
  -c python \
  -a github_mcp_server.py \
  -e GITHUB_TOKEN=ghp_xxx \
  -o github_eval_report.md \
  my_evaluation.xml
```

4. **在 `github_eval_report.md` 中查看报告**，以：
   - 查看哪些问题通过/失败
   - 阅读代理对您工具的反馈
   - 识别改进领域
   - 迭代您的 MCP 服务器设计

## 故障排除

### 连接错误

如果您遇到连接错误：

- **STDIO**：验证命令和参数是否正确
- **SSE/HTTP**：检查 URL 是否可访问，头是否正确
- 确保所有必需的 API 密钥都在环境变量或头中设置

### 准确率低

如果许多评估失败：

- 查看每个任务的代理反馈
- 检查工具描述是否清晰全面
- 验证输入参数是否有良好的文档
- 考虑工具是否返回太多或太少数据
- 确保错误消息是可操作的

### 超时问题

如果任务超时：

- 使用更强大的模型（例如，`claude-3-7-sonnet-20250219`）
- 检查工具是否返回太多数据
- 验证分页是否正常工作
- 考虑简化复杂问题
