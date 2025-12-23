# Hướng Dẫn Tạo Tool Mới

Tài liệu này hướng dẫn cách tạo một tool mới trong Plane MCP Server để tích hợp với Plane API.

## Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Cấu Trúc Tool](#cấu-trúc-tool)
3. [Các Bước Tạo Tool Mới](#các-bước-tạo-tool-mới)
4. [Ví Dụ Cụ Thể](#ví-dụ-cụ-thể)
5. [Đăng Ký Tool](#đăng-ký-tool)
6. [Best Practices](#best-practices)

## Tổng Quan

Mỗi tool trong Plane MCP Server là một function có thể được gọi từ client thông qua MCP protocol. Tool này sẽ gọi Plane API và trả về kết quả.

### Các Thành Phần Chính

- **Tool File**: File TypeScript chứa logic của tool (ví dụ: `src/tools/pages.ts`)
- **Schema**: Định nghĩa cấu trúc dữ liệu sử dụng Zod (trong `src/schemas.ts`)
- **Request Helper**: Function tiện ích để gọi Plane API (`src/common/request-helper.ts`)
- **Tool Registry**: Đăng ký tool vào server (`src/tools/index.ts`)

## Cấu Trúc Tool

### Template Cơ Bản

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { makePlaneRequest } from "../common/request-helper.js";
import { YourSchema } from "../schemas.js";

export const registerYourTools = (server: McpServer): void => {
  server.tool(
    "tool_name",                    // Tên tool (snake_case)
    "Mô tả tool",                  // Mô tả ngắn gọn
    {
      // Định nghĩa parameters sử dụng Zod
      param1: z.string().describe("Mô tả param1"),
      param2: z.number().optional(),
    },
    async ({ param1, param2 }) => {
      // Logic xử lý
      const response = await makePlaneRequest(
        "HTTP_METHOD",              // GET, POST, PATCH, DELETE
        `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/endpoint/`,
        body                         // Body data (nếu có)
      );
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    }
  );
};
```

## Các Bước Tạo Tool Mới

### Bước 1: Xác Định API Endpoint

Tìm endpoint tương ứng trong [Plane API Documentation](https://developers.plane.so/api-reference).

Ví dụ: Tạo workspace page
- Endpoint: `POST /api/v1/workspaces/{workspace_slug}/pages/`
- Body: `{ name: string, description_html: string }`

### Bước 2: Định Nghĩa Schema (Nếu Cần)

Nếu cần schema mới, thêm vào `src/schemas.ts`:

```typescript
export const YourSchema = z.object({
  id: z.string().uuid().readonly(),
  name: z.string().max(255),
  description: z.string().optional(),
  created_at: z.string().datetime({ offset: true }).readonly(),
  // ... các field khác
});
export type YourSchema = z.infer<typeof YourSchema>;
```

**Lưu ý:**
- Sử dụng `.readonly()` cho các field chỉ đọc (id, created_at, updated_at, etc.)
- Sử dụng `.optional()` cho các field không bắt buộc
- Sử dụng `.max()`, `.min()`, `.uuid()`, `.datetime()` cho validation

### Bước 3: Tạo File Tool

Tạo file mới trong `src/tools/` hoặc thêm vào file tool hiện có:

**Tùy chọn A: Tạo file mới** (khi có nhiều tool liên quan)
- Tên file: `your-feature.ts`
- Export function: `registerYourFeatureTools`

**Tùy chọn B: Thêm vào file hiện có** (khi tool liên quan đến feature đã có)
- Ví dụ: Thêm tool page vào `pages.ts`

### Bước 4: Viết Tool Function

```typescript
server.tool(
  "create_your_resource",           // Tên tool (snake_case, mô tả rõ ràng)
  "Mô tả ngắn gọn về tool này",      // Mô tả sẽ hiển thị cho client
  {
    // Parameters với validation
    resource_id: z.string().uuid().describe("UUID của resource"),
    resource_data: YourSchema.partial().required({
      name: true,                    // Field bắt buộc
      description: true,
    }),
  },
  async ({ resource_id, resource_data }) => {
    // Gọi API
    const response = await makePlaneRequest(
      "POST",                        // HTTP method
      `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/resources/`,
      resource_data                  // Body data
    );
    
    // Trả về response
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }
);
```

### Bước 5: Xử Lý Các HTTP Methods

#### GET Request
```typescript
const response = await makePlaneRequest(
  "GET",
  `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/resources/${resource_id}/`
);
```

#### POST Request
```typescript
const response = await makePlaneRequest(
  "POST",
  `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/resources/`,
  resource_data                      // Body data
);
```

#### PATCH Request
```typescript
const response = await makePlaneRequest(
  "PATCH",
  `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/resources/${resource_id}/`,
  update_data                        // Partial data để update
);
```

#### DELETE Request
```typescript
const response = await makePlaneRequest(
  "DELETE",
  `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/resources/${resource_id}/`
);
```

### Bước 6: Đăng Ký Tool

Thêm tool vào `src/tools/index.ts`:

```typescript
import { registerYourTools } from "./your-tools.js";

export const registerTools = (server: McpServer) => {
  // ... các tool khác
  registerYourTools(server);
};
```

## Ví Dụ Cụ Thể

### Ví Dụ 1: Tạo Workspace Page

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { makePlaneRequest } from "../common/request-helper.js";
import { Page as PageSchema } from "../schemas.js";

export const registerPageTools = (server: McpServer): void => {
  server.tool(
    "create_workspace_page",
    "Create a wiki page at the workspace level",
    {
      page_data: PageSchema.pick({
        name: true,
        description_html: true,
      }).required({
        name: true,
        description_html: true,
      }),
    },
    async ({ page_data }) => {
      const response = await makePlaneRequest(
        "POST",
        `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/pages/`,
        page_data
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    }
  );
};
```

### Ví Dụ 2: Lấy Danh Sách Resources

```typescript
server.tool(
  "list_resources",
  "Get all resources for a specific project",
  {
    project_id: z.string().uuid().describe("The uuid identifier of the project"),
  },
  async ({ project_id }) => {
    const response = await makePlaneRequest(
      "GET",
      `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${project_id}/resources/`
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }
);
```

### Ví Dụ 3: Cập Nhật Resource

```typescript
server.tool(
  "update_resource",
  "Update an existing resource",
  {
    project_id: z.string().uuid().describe("The uuid identifier of the project"),
    resource_id: z.string().uuid().describe("The uuid identifier of the resource"),
    resource_data: ResourceSchema.partial().describe("The fields to update"),
  },
  async ({ project_id, resource_id, resource_data }) => {
    const response = await makePlaneRequest(
      "PATCH",
      `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${project_id}/resources/${resource_id}/`,
      resource_data
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }
);
```

### Ví Dụ 4: Xóa Resource

```typescript
server.tool(
  "delete_resource",
  "Delete a resource",
  {
    project_id: z.string().uuid().describe("The uuid identifier of the project"),
    resource_id: z.string().uuid().describe("The uuid identifier of the resource to delete"),
  },
  async ({ project_id, resource_id }) => {
    const response = await makePlaneRequest(
      "DELETE",
      `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${project_id}/resources/${resource_id}/`
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }
);
```

## Đăng Ký Tool

Sau khi tạo tool, cần đăng ký trong `src/tools/index.ts`:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerYourTools } from "./your-tools.js";
// ... các import khác

export const registerTools = (server: McpServer) => {
  registerMetadataTools(server);
  registerUserTools(server);
  
  // ... các tool khác
  
  registerYourTools(server);  // Thêm dòng này
};
```

## Best Practices

### 1. Đặt Tên Tool

- Sử dụng **snake_case**: `create_workspace_page`, `list_issue_types`
- Tên phải mô tả rõ ràng chức năng
- Tuân theo pattern: `{action}_{resource}` (ví dụ: `create_`, `get_`, `list_`, `update_`, `delete_`)

### 2. Mô Tả Tool

- Mô tả ngắn gọn, rõ ràng
- Bắt đầu bằng động từ: "Create...", "Get...", "List...", "Update...", "Delete..."
- Mô tả rõ resource và context (workspace level, project level)

### 3. Parameters

- Sử dụng Zod schema để validate
- Thêm `.describe()` cho mỗi parameter
- Sử dụng `.uuid()` cho UUID parameters
- Sử dụng `.optional()` cho parameters không bắt buộc
- Sử dụng `.partial()` và `.required()` cho object parameters

### 4. Schema Validation

```typescript
// ✅ Tốt: Sử dụng schema có sẵn với pick và required
page_data: PageSchema.pick({
  name: true,
  description_html: true,
}).required({
  name: true,
  description_html: true,
})

// ✅ Tốt: Sử dụng partial cho update
resource_data: ResourceSchema.partial().describe("The fields to update")

// ❌ Không tốt: Định nghĩa lại schema inline
page_data: z.object({
  name: z.string(),
  description_html: z.string(),
})
```

### 5. Error Handling

`makePlaneRequest` đã xử lý lỗi cơ bản. Nếu cần xử lý lỗi đặc biệt:

```typescript
try {
  const response = await makePlaneRequest(...);
  return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
} catch (error) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ error: error.message }, null, 2),
      },
    ],
  };
}
```

### 6. Response Format

Luôn trả về format chuẩn:

```typescript
return {
  content: [
    {
      type: "text",
      text: JSON.stringify(response, null, 2),  // Format đẹp với indent
    },
  ],
};
```

### 7. Workspace Slug

Luôn sử dụng `process.env.PLANE_WORKSPACE_SLUG` trong endpoint:

```typescript
`workspaces/${process.env.PLANE_WORKSPACE_SLUG}/endpoint/`
```

### 8. Nhóm Tool Theo Feature

- Nhóm các tool liên quan vào cùng một file
- Ví dụ: `pages.ts` chứa tất cả tool về pages
- `metadata.ts` chứa tool về issue types, states, labels

### 9. Type Safety

- Sử dụng TypeScript types từ schema
- Export type từ schema: `export type YourSchema = z.infer<typeof YourSchema>`
- Sử dụng type inference khi có thể

### 10. Code Organization

```typescript
// ✅ Tốt: Nhóm các tool liên quan
export const registerPageTools = (server: McpServer): void => {
  server.tool("create_wiki_page", ...);
  server.tool("create_project_page", ...);
  server.tool("get_wiki_page", ...);
  server.tool("get_project_page", ...);
};

// ❌ Không tốt: Trộn lẫn các tool không liên quan
export const registerMixedTools = (server: McpServer): void => {
  server.tool("create_page", ...);
  server.tool("create_issue", ...);
  server.tool("create_module", ...);
};
```

## Checklist Khi Tạo Tool Mới

- [ ] Đã xác định API endpoint từ Plane API docs
- [ ] Đã định nghĩa schema (nếu cần) trong `schemas.ts`
- [ ] Đã tạo/update file tool với function đăng ký
- [ ] Đã đặt tên tool theo convention (snake_case)
- [ ] Đã thêm mô tả rõ ràng cho tool và parameters
- [ ] Đã sử dụng Zod validation cho parameters
- [ ] Đã sử dụng `makePlaneRequest` với đúng HTTP method
- [ ] Đã trả về response đúng format
- [ ] Đã đăng ký tool trong `src/tools/index.ts`
- [ ] Đã test tool hoạt động đúng

## Tài Liệu Tham Khảo

- [Plane API Documentation](https://developers.plane.so/api-reference)
- [Zod Documentation](https://zod.dev/)
- [MCP SDK Documentation](https://modelcontextprotocol.io/)

## Hỗ Trợ

Nếu gặp vấn đề khi tạo tool mới, hãy:
1. Kiểm tra các tool hiện có để tham khảo pattern
2. Xem lại Plane API docs để đảm bảo endpoint đúng
3. Kiểm tra console logs để debug

