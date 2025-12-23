import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { makePlaneRequest } from "../common/request-helper.js";
import { Page as PageSchema } from "../schemas.js";

export const registerPageTools = (server: McpServer): void => {
  server.tool(
    "create_wiki_page",
    "Create a wiki page in the workspace",
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

  server.tool(
    "create_project_page",
    "Create a project page",
    {
      project_id: z.string().describe("The uuid identifier of the project to create the page in"),
      page_data: PageSchema.pick({
        name: true,
        description_html: true,
      }).required({
        name: true,
        description_html: true,
      }),
    },
    async ({ project_id, page_data }) => {
      const response = await makePlaneRequest(
        "POST",
        `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${project_id}/pages/`,
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

  server.tool(
    "get_wiki_page",
    "Retrieve a wiki page",
    {
      page_id: z.string().describe("The uuid identifier of the wiki page to retrieve"),
    },
    async ({ page_id }) => {
      const response = await makePlaneRequest(
        "GET",
        `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/pages/${page_id}/`
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

  server.tool(
    "get_project_page",
    "Retrieve a project page",
    {
      project_id: z.string().describe("The uuid identifier of the project containing the page"),
      page_id: z.string().describe("The uuid identifier of the project page to retrieve"),
    },
    async ({ project_id, page_id }) => {
      const response = await makePlaneRequest(
        "GET",
        `workspaces/${process.env.PLANE_WORKSPACE_SLUG}/projects/${project_id}/pages/${page_id}/`
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

