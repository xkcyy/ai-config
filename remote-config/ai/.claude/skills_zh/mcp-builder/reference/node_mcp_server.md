# Node/TypeScript MCP 服务器实现指南

## 概述

本文档提供了使用 MCP TypeScript SDK 实现 MCP 服务器的 Node/TypeScript 特定最佳实践和示例。它涵盖了项目结构、服务器设置、工具注册模式、使用 Zod 进行输入验证、错误处理以及完整的工作示例。

---

## 快速参考

### 关键导入

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";
import { z } from "zod";
```

### 服务器初始化

```typescript
const server = new McpServer({
  name: "service-mcp-server",
  version: "1.0.0",
});
```

### 工具注册模式

```typescript
server.registerTool(
  "tool_name",
  {
    title: "Tool Display Name",
    description: "What the tool does",
    inputSchema: { param: z.string() },
    outputSchema: { result: z.string() },
  },
  async ({ param }) => {
    const output = { result: `Processed: ${param}` };
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output, // 结构化数据的现代模式
    };
  }
);
```

---

## MCP TypeScript SDK

官方 MCP TypeScript SDK 提供：

- `McpServer` 类用于服务器初始化
- `registerTool` 方法用于工具注册
- Zod 模式集成用于运行时输入验证
- 类型安全的工具处理程序实现

**重要 - 仅使用现代 API：**

- **使用**：`server.registerTool()`、`server.registerResource()`、`server.registerPrompt()`
- **不要使用**：旧的已弃用 API，如 `server.tool()`、`server.setRequestHandler(ListToolsRequestSchema, ...)` 或手动处理程序注册
- `register*` 方法提供更好的类型安全性、自动模式处理，是推荐的方法

有关完整详细信息，请参阅参考资料中的 MCP SDK 文档。

## 服务器命名约定

Node/TypeScript MCP 服务器必须遵循以下命名模式：

- **格式**：`{service}-mcp-server`（小写，连字符分隔）
- **示例**：`github-mcp-server`、`jira-mcp-server`、`stripe-mcp-server`

名称应：

- 通用（不与特定功能绑定）
- 描述所集成的服务/API
- 易于从任务描述中推断
- 不包含版本号或日期

## 项目结构

为 Node/TypeScript MCP 服务器创建以下结构：

```
{service}-mcp-server/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts          # 主入口点，包含 McpServer 初始化
│   ├── types.ts          # TypeScript 类型定义和接口
│   ├── tools/            # 工具实现（每个领域一个文件）
│   ├── services/         # API 客户端和共享工具
│   ├── schemas/          # Zod 验证模式
│   └── constants.ts      # 共享常量（API_URL、CHARACTER_LIMIT 等）
└── dist/                 # 构建的 JavaScript 文件（入口点：dist/index.js）
```

## 工具实现

### 工具命名

使用 snake_case 命名工具（例如，"search_users"、"create_project"、"get_channel_info"），名称应清晰、面向动作。

**避免命名冲突**：包含服务上下文以防止重叠：

- 使用 `slack_send_message` 而不仅仅是 `send_message`
- 使用 `github_create_issue` 而不仅仅是 `create_issue`
- 使用 `asana_list_tasks` 而不仅仅是 `list_tasks`

### 工具结构

使用 `registerTool` 方法注册工具，需满足以下要求：

- 使用 Zod 模式进行运行时输入验证和类型安全
- 必须显式提供 `description` 字段 - 不会自动提取 JSDoc 注释
- 显式提供 `title`、`description`、`inputSchema` 和 `annotations`
- `inputSchema` 必须是 Zod 模式对象（不是 JSON 模式）
- 显式为所有参数和返回值指定类型

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({
  name: "example-mcp",
  version: "1.0.0",
});

// 用于输入验证的 Zod 模式
const UserSearchInputSchema = z
  .object({
    query: z
      .string()
      .min(2, "查询必须至少包含 2 个字符")
      .max(200, "查询不得超过 200 个字符")
      .describe("用于匹配名称/电子邮件的搜索字符串"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe("返回的最大结果数"),
    offset: z.number().int().min(0).default(0).describe("用于分页的跳过结果数"),
    response_format: z
      .nativeEnum(ResponseFormat)
      .default(ResponseFormat.MARKDOWN)
      .describe("输出格式：'markdown' 用于人类可读或 'json' 用于机器可读"),
  })
  .strict();

// 从 Zod 模式定义类型
type UserSearchInput = z.infer<typeof UserSearchInputSchema>;

server.registerTool(
  "example_search_users",
  {
    title: "搜索示例用户",
    description: `在 Example 系统中按名称、电子邮件或团队搜索用户。

此工具搜索 Example 平台中的所有用户配置文件，支持部分匹配和各种搜索过滤器。它不会创建或修改用户，仅搜索现有用户。

参数：
  - query (string)：用于匹配名称/电子邮件的搜索字符串
  - limit (number)：返回的最大结果数，介于 1-100 之间（默认：20）
  - offset (number)：用于分页的跳过结果数（默认：0）
  - response_format ('markdown' | 'json')：输出格式（默认：'markdown'）

返回：
  对于 JSON 格式：具有以下模式的结构化数据：
  {
    "total": number,           // 找到的匹配总数
    "count": number,           // 此响应中的结果数
    "offset": number,          // 当前分页偏移量
    "users": [
      {
        "id": string,          // 用户 ID（例如："U123456789"）
        "name": string,        // 全名（例如："John Doe"）
        "email": string,       // 电子邮件地址
        "team": string,        // 团队名称（可选）
        "active": boolean      // 用户是否活跃
      }
    ],
    "has_more": boolean,       // 是否有更多结果可用
    "next_offset": number      // 下一页的偏移量（如果 has_more 为 true）
  }

示例：
  - 使用场景："查找所有营销团队成员" -> 使用 query="team:marketing" 参数
  - 使用场景："搜索 John 的账户" -> 使用 query="john" 参数
  - 不使用场景：您需要创建用户（请改用 example_create_user）

错误处理：
  - 如果请求过多（429 状态），返回 "Error: Rate limit exceeded"
  - 如果搜索返回空结果，返回 "No users found matching '<query>'"`,
    inputSchema: UserSearchInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: UserSearchInput) => {
    try {
      // 输入验证由 Zod 模式处理
      // 使用验证后的参数发出 API 请求
      const data = await makeApiRequest<any>("users/search", "GET", undefined, {
        q: params.query,
        limit: params.limit,
        offset: params.offset,
      });

      const users = data.users || [];
      const total = data.total || 0;

      if (!users.length) {
        return {
          content: [
            {
              type: "text",
              text: `未找到匹配 '${params.query}' 的用户`,
            },
          ],
        };
      }

      // 准备结构化输出
      const output = {
        total,
        count: users.length,
        offset: params.offset,
        users: users.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          ...(user.team ? { team: user.team } : {}),
          active: user.active ?? true,
        })),
        has_more: total > params.offset + users.length,
        ...(total > params.offset + users.length
          ? {
              next_offset: params.offset + users.length,
            }
          : {}),
      };

      // 根据请求的格式格式化文本表示
      let textContent: string;
      if (params.response_format === ResponseFormat.MARKDOWN) {
        const lines = [
          `# 用户搜索结果: '${params.query}'`,
          "",
          `找到 ${total} 个用户（显示 ${users.length} 个）`,
          "",
        ];
        for (const user of users) {
          lines.push(`## ${user.name} (${user.id})`);
          lines.push(`- **电子邮件**: ${user.email}`);
          if (user.team) lines.push(`- **团队**: ${user.team}`);
          lines.push("");
        }
        textContent = lines.join("\n");
      } else {
        textContent = JSON.stringify(output, null, 2);
      }

      return {
        content: [{ type: "text", text: textContent }],
        structuredContent: output, // 结构化数据的现代模式
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: handleApiError(error),
          },
        ],
      };
    }
  }
);
```

## 用于输入验证的 Zod 模式

Zod 提供运行时类型验证：

```typescript
import { z } from "zod";

// 带验证的基本模式
const CreateUserSchema = z
  .object({
    name: z.string().min(1, "名称是必填项").max(100, "名称不得超过 100 个字符"),
    email: z.string().email("无效的电子邮件格式"),
    age: z
      .number()
      .int("年龄必须是整数")
      .min(0, "年龄不能为负数")
      .max(150, "年龄不能大于 150"),
  })
  .strict(); // 使用 .strict() 禁止额外字段

// 枚举
enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json",
}

const SearchSchema = z.object({
  response_format: z
    .nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("输出格式"),
});

// 带默认值的可选字段
const PaginationSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe("返回的最大结果数"),
  offset: z.number().int().min(0).default(0).describe("跳过的结果数"),
});
```

## 响应格式选项

支持多种输出格式以提高灵活性：

```typescript
enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json",
}

const inputSchema = z.object({
  query: z.string(),
  response_format: z
    .nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("输出格式：'markdown' 用于人类可读或 'json' 用于机器可读"),
});
```

**Markdown 格式**：

- 使用标题、列表和格式以提高清晰度
- 将时间戳转换为人类可读格式
- 显示显示名称并在括号中显示 ID
- 省略冗长的元数据
- 逻辑上分组相关信息

**JSON 格式**：

- 返回适合程序化处理的完整结构化数据
- 包含所有可用字段和元数据
- 使用一致的字段名称和类型

## 分页实现

对于列出资源的工具：

```typescript
const ListSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

async function listItems(params: z.infer<typeof ListSchema>) {
  const data = await apiRequest(params.limit, params.offset);

  const response = {
    total: data.total,
    count: data.items.length,
    offset: params.offset,
    items: data.items,
    has_more: data.total > params.offset + data.items.length,
    next_offset:
      data.total > params.offset + data.items.length
        ? params.offset + data.items.length
        : undefined,
  };

  return JSON.stringify(response, null, 2);
}
```

## 字符限制和截断

添加 CHARACTER_LIMIT 常量以防止响应过大：

```typescript
// 在 constants.ts 的模块级别
export const CHARACTER_LIMIT = 25000; // 最大响应大小（字符）

async function searchTool(params: SearchInput) {
  let result = generateResponse(data);

  // 检查字符限制并在需要时截断
  if (result.length > CHARACTER_LIMIT) {
    const truncatedData = data.slice(0, Math.max(1, data.length / 2));
    response.data = truncatedData;
    response.truncated = true;
    response.truncation_message =
      `响应从 ${data.length} 截断到 ${truncatedData.length} 项。 ` +
      `使用 'offset' 参数或添加过滤器查看更多结果。`;
    result = JSON.stringify(response, null, 2);
  }

  return result;
}
```

## 错误处理

提供清晰、可操作的错误消息：

```typescript
import axios, { AxiosError } from "axios";

function handleApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      switch (error.response.status) {
        case 404:
          return "错误：资源未找到。请检查 ID 是否正确。";
        case 403:
          return "错误：权限被拒绝。您无权访问此资源。";
        case 429:
          return "错误：超出速率限制。请在再次请求前等待。";
        default:
          return `错误：API 请求失败，状态码 ${error.response.status}`;
      }
    } else if (error.code === "ECONNABORTED") {
      return "错误：请求超时。请重试。";
    }
  }
  return `错误：发生意外错误：${
    error instanceof Error ? error.message : String(error)
  }`;
}
```

## 共享工具

将通用功能提取为可重用函数：

```typescript
// 共享 API 请求函数
async function makeApiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: any,
  params?: any
): Promise<T> {
  try {
    const response = await axios({
      method,
      url: `${API_BASE_URL}/${endpoint}`,
      data,
      params,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}
```

## Async/Await 最佳实践

始终使用 async/await 处理网络请求和 I/O 操作：

```typescript
// 良好：异步网络请求
async function fetchData(resourceId: string): Promise<ResourceData> {
  const response = await axios.get(`${API_URL}/resource/${resourceId}`);
  return response.data;
}

// 不良：Promise 链
function fetchData(resourceId: string): Promise<ResourceData> {
  return axios
    .get(`${API_URL}/resource/${resourceId}`)
    .then((response) => response.data); // 更难阅读和维护
}
```

## TypeScript 最佳实践

1. **使用严格的 TypeScript**：在 tsconfig.json 中启用严格模式
2. **定义接口**：为所有数据结构创建清晰的接口定义
3. **避免使用 `any`**：使用适当的类型或 `unknown` 代替 `any`
4. **Zod 用于运行时验证**：使用 Zod 模式验证外部数据
5. **类型守卫**：为复杂类型检查创建类型守卫函数
6. **错误处理**：始终使用 try-catch 并进行适当的错误类型检查
7. **空值安全**：使用可选链 (`?.`) 和空值合并 (`??`)

```typescript
// 良好：使用 Zod 和接口的类型安全
interface UserResponse {
  id: string;
  name: string;
  email: string;
  team?: string;
  active: boolean;
}

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  team: z.string().optional(),
  active: z.boolean(),
});

type User = z.infer<typeof UserSchema>;

async function getUser(id: string): Promise<User> {
  const data = await apiCall(`/users/${id}`);
  return UserSchema.parse(data); // 运行时验证
}

// 不良：使用 any
async function getUser(id: string): Promise<any> {
  return await apiCall(`/users/${id}`); // 无类型安全
}
```

## 包配置

### package.json

```json
{
  "name": "{service}-mcp-server",
  "version": "1.0.0",
  "description": "用于 {Service} API 集成的 MCP 服务器",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "clean": "rm -rf dist"
  },
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.6.1",
    "axios": "^1.7.9",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 完整示例

```typescript
#!/usr/bin/env node
/**
 * Example Service 的 MCP 服务器。
 *
 * 该服务器提供与 Example API 交互的工具，包括用户搜索、
 * 项目管理和数据导出功能。
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios, { AxiosError } from "axios";

// 常量
const API_BASE_URL = "https://api.example.com/v1";
const CHARACTER_LIMIT = 25000;

// 枚举
enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json",
}

// Zod 模式
const UserSearchInputSchema = z
  .object({
    query: z
      .string()
      .min(2, "查询必须至少包含 2 个字符")
      .max(200, "查询不得超过 200 个字符")
      .describe("用于匹配名称/电子邮件的搜索字符串"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe("返回的最大结果数"),
    offset: z.number().int().min(0).default(0).describe("用于分页的跳过结果数"),
    response_format: z
      .nativeEnum(ResponseFormat)
      .default(ResponseFormat.MARKDOWN)
      .describe("输出格式：'markdown' 用于人类可读或 'json' 用于机器可读"),
  })
  .strict();

type UserSearchInput = z.infer<typeof UserSearchInputSchema>;

// 共享工具函数
async function makeApiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: any,
  params?: any
): Promise<T> {
  try {
    const response = await axios({
      method,
      url: `${API_BASE_URL}/${endpoint}`,
      data,
      params,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

function handleApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      switch (error.response.status) {
        case 404:
          return "错误：资源未找到。请检查 ID 是否正确。";
        case 403:
          return "错误：权限被拒绝。您无权访问此资源。";
        case 429:
          return "错误：超出速率限制。请在再次请求前等待。";
        default:
          return `错误：API 请求失败，状态码 ${error.response.status}`;
      }
    } else if (error.code === "ECONNABORTED") {
      return "错误：请求超时。请重试。";
    }
  }
  return `错误：发生意外错误：${
    error instanceof Error ? error.message : String(error)
  }`;
}

// 创建 MCP 服务器实例
const server = new McpServer({
  name: "example-mcp",
  version: "1.0.0",
});

// 注册工具
server.registerTool(
  "example_search_users",
  {
    title: "搜索示例用户",
    description: `[如上面所示的完整描述]`,
    inputSchema: UserSearchInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: UserSearchInput) => {
    // 如上面所示的实现
  }
);

// 主函数
// 对于 stdio（本地）：
async function runStdio() {
  if (!process.env.EXAMPLE_API_KEY) {
    console.error("错误：需要 EXAMPLE_API_KEY 环境变量");
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP 服务器通过 stdio 运行");
}

// 对于可流式 HTTP（远程）：
async function runHTTP() {
  if (!process.env.EXAMPLE_API_KEY) {
    console.error("错误：需要 EXAMPLE_API_KEY 环境变量");
    process.exit(1);
  }

  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT || "3000");
  app.listen(port, () => {
    console.error(`MCP 服务器运行在 http://localhost:${port}/mcp`);
  });
}

// 根据环境选择传输方式
const transport = process.env.TRANSPORT || "stdio";
if (transport === "http") {
  runHTTP().catch((error) => {
    console.error("服务器错误:", error);
    process.exit(1);
  });
} else {
  runStdio().catch((error) => {
    console.error("服务器错误:", error);
    process.exit(1);
  });
}
```

---

## 高级 MCP 功能

### 资源注册

将数据作为资源公开，以便进行高效的基于 URI 的访问：

```typescript
import { ResourceTemplate } from "@modelcontextprotocol/sdk/types.js";

// 使用 URI 模板注册资源
server.registerResource(
  {
    uri: "file://documents/{name}",
    name: "文档资源",
    description: "按名称访问文档",
    mimeType: "text/plain",
  },
  async (uri: string) => {
    // 从 URI 提取参数
    const match = uri.match(/^file:\/\/documents\/(.*)$/);
    if (!match) {
      throw new Error("无效的 URI 格式");
    }

    const documentName = match[1];
    const content = await loadDocument(documentName);

    return {
      contents: [
        {
          uri,
          mimeType: "text/plain",
          text: content,
        },
      ],
    };
  }
);

// 动态列出可用资源
server.registerResourceList(async () => {
  const documents = await getAvailableDocuments();
  return {
    resources: documents.map((doc) => ({
      uri: `file://documents/${doc.name}`,
      name: doc.name,
      mimeType: "text/plain",
      description: doc.description,
    })),
  };
});
```

**何时使用资源 vs 工具：**

- **资源**：用于具有简单基于 URI 参数的数据访问
- **工具**：用于需要验证和业务逻辑的复杂操作
- **资源**：当数据相对静态或基于模板时
- **工具**：当操作具有副作用或复杂工作流程时

### 传输选项

TypeScript SDK 支持两种主要传输机制：

#### 可流式 HTTP（推荐用于远程服务器）

```typescript
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  // 为每个请求创建新传输（无状态，防止请求 ID 冲突）
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => transport.close());

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(3000);
```

#### stdio（用于本地集成）

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const transport = new StdioServerTransport();
await server.connect(transport);
```

**传输方式选择：**

- **可流式 HTTP**：Web 服务、远程访问、多个客户端
- **stdio**：命令行工具、本地开发、子进程集成

### 通知支持

当服务器状态更改时通知客户端：

```typescript
// 当工具列表更改时通知
server.notification({
  method: "notifications/tools/list_changed",
});

// 当资源更改时通知
server.notification({
  method: "notifications/resources/list_changed",
});
```

谨慎使用通知 - 仅当服务器功能真正更改时使用。

---

## 代码最佳实践

### 代码组合性和可重用性

您的实现必须优先考虑组合性和代码重用：

1. **提取通用功能**：

   - 为跨多个工具使用的操作创建可重用的辅助函数
   - 构建共享 API 客户端用于 HTTP 请求，而不是重复代码
   - 将错误处理逻辑集中在工具函数中
   - 将业务逻辑提取到专用函数中，以便组合
   - 提取共享的 markdown 或 JSON 字段选择和格式化功能

2. **避免重复**：
   - 永远不要在工具之间复制粘贴相似的代码
   - 如果您发现自己编写了两次相似的逻辑，请将其提取到函数中
   - 分页、过滤、字段选择和格式化等常见操作应共享
   - 身份验证/授权逻辑应集中化

## 构建和运行

在运行前始终构建您的 TypeScript 代码：

```bash
# 构建项目
npm run build

# 运行服务器
npm start

# 开发模式（自动重载）
npm run dev
```

在考虑实现完成之前，始终确保 `npm run build` 成功完成。

## 质量检查清单

在完成 Node/TypeScript MCP 服务器实现之前，确保：

### 战略设计

- [ ] 工具支持完整的工作流程，而不仅仅是 API 端点包装器
- [ ] 工具名称反映自然的任务细分
- [ ] 响应格式针对代理上下文效率进行了优化
- [ ] 在适当的地方使用人类可读的标识符
- [ ] 错误消息指导代理正确使用

### 实现质量

- [ ] 专注实现：实现了最重要和最有价值的工具
- [ ] 所有工具都使用 `registerTool` 注册，配置完整
- [ ] 所有工具都包含 `title`、`description`、`inputSchema` 和 `annotations`
- [ ] 注释设置正确（readOnlyHint、destructiveHint、idempotentHint、openWorldHint）
- [ ] 所有工具都使用 Zod 模式进行运行时输入验证，并使用 `.strict()` 强制
- [ ] 所有 Zod 模式都有适当的约束和描述性错误消息
- [ ] 所有工具都有全面的描述，包含明确的输入/输出类型
- [ ] 描述包含返回值示例和完整的模式文档
- [ ] 错误消息清晰、可操作且具有教育意义

### TypeScript 质量

- [ ] 为所有数据结构定义了 TypeScript 接口
- [ ] 在 tsconfig.json 中启用了严格的 TypeScript
- [ ] 不使用 `any` 类型 - 使用 `unknown` 或适当的类型代替
- [ ] 所有异步函数都有显式的 Promise<T> 返回类型
- [ ] 错误处理使用适当的类型守卫（例如 `axios.isAxiosError`、`z.ZodError`）

### 高级功能（如适用）

- [ ] 为适当的数据端点注册了资源
- [ ] 配置了适当的传输方式（stdio 或可流式 HTTP）
- [ ] 为动态服务器功能实现了通知
- [ ] 使用 SDK 接口类型安全

### 项目配置

- [ ] Package.json 包含所有必要的依赖项
- [ ] 构建脚本在 dist/ 目录中生成可工作的 JavaScript
- [ ] 主入口点正确配置为 dist/index.js
- [ ] 服务器名称遵循格式：`{service}-mcp-server`
- [ ] tsconfig.json 配置正确，启用了严格模式

### 代码质量

- [ ] 在适用的地方正确实现了分页
- [ ] 大型响应检查 CHARACTER_LIMIT 常量，并使用清晰的消息截断
- [ ] 为可能的大型结果集提供了过滤选项
- [ ] 所有网络操作都优雅地处理超时和连接错误
- [ ] 公共功能被提取到可重用的函数中
- [ ] 类似操作的返回类型一致

### 测试和构建

- [ ] `npm run build` 成功完成，没有错误
- [ ] 创建了 dist/index.js 并可执行
- [ ] 服务器运行：`node dist/index.js --help`
- [ ] 所有导入都正确解析
- [ ] 示例工具调用按预期工作
