#!/usr/bin/env node

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", ".env") });

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { bitbucketClient } from "./bitbucket-client.js";

const server = new Server(
  {
    name: "bitbucket-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_pr",
        description:
          "Create a new pull request in a Bitbucket repository",
        inputSchema: {
          type: "object",
          properties: {
            workspace: {
              type: "string",
              description: "Bitbucket workspace slug",
            },
            repoSlug: {
              type: "string",
              description: "Repository slug",
            },
            title: {
              type: "string",
              description: "Pull request title",
            },
            description: {
              type: "string",
              description: "Pull request description",
            },
            sourceBranch: {
              type: "string",
              description: "Source branch name",
            },
            destinationBranch: {
              type: "string",
              description: "Destination branch name (usually main or master)",
            },
          },
          required: [
            "workspace",
            "repoSlug",
            "title",
            "description",
            "sourceBranch",
            "destinationBranch",
          ],
        },
      },
      {
        name: "get_pr",
        description: "Get details of a specific pull request",
        inputSchema: {
          type: "object",
          properties: {
            workspace: {
              type: "string",
              description: "Bitbucket workspace slug",
            },
            repoSlug: {
              type: "string",
              description: "Repository slug",
            },
            prId: {
              type: "number",
              description: "Pull request ID",
            },
          },
          required: ["workspace", "repoSlug", "prId"],
        },
      },
      {
        name: "list_prs",
        description: "List pull requests in a repository",
        inputSchema: {
          type: "object",
          properties: {
            workspace: {
              type: "string",
              description: "Bitbucket workspace slug",
            },
            repoSlug: {
              type: "string",
              description: "Repository slug",
            },
            state: {
              type: "string",
              enum: ["OPEN", "MERGED", "DECLINED", "SUPERSEDED"],
              description: "Filter by PR state (optional)",
            },
          },
          required: ["workspace", "repoSlug"],
        },
      },
      {
        name: "update_pr",
        description: "Update pull request title or description",
        inputSchema: {
          type: "object",
          properties: {
            workspace: {
              type: "string",
              description: "Bitbucket workspace slug",
            },
            repoSlug: {
              type: "string",
              description: "Repository slug",
            },
            prId: {
              type: "number",
              description: "Pull request ID",
            },
            title: {
              type: "string",
              description: "New title (optional)",
            },
            description: {
              type: "string",
              description: "New description (optional)",
            },
          },
          required: ["workspace", "repoSlug", "prId"],
        },
      },
      {
        name: "approve_pr",
        description: "Approve a pull request",
        inputSchema: {
          type: "object",
          properties: {
            workspace: {
              type: "string",
              description: "Bitbucket workspace slug",
            },
            repoSlug: {
              type: "string",
              description: "Repository slug",
            },
            prId: {
              type: "number",
              description: "Pull request ID",
            },
          },
          required: ["workspace", "repoSlug", "prId"],
        },
      },
      {
        name: "merge_pr",
        description: "Merge a pull request",
        inputSchema: {
          type: "object",
          properties: {
            workspace: {
              type: "string",
              description: "Bitbucket workspace slug",
            },
            repoSlug: {
              type: "string",
              description: "Repository slug",
            },
            prId: {
              type: "number",
              description: "Pull request ID",
            },
            strategy: {
              type: "string",
              enum: ["merge_commit", "squash", "fast_forward"],
              description: "Merge strategy (optional)",
            },
          },
          required: ["workspace", "repoSlug", "prId"],
        },
      },
      {
        name: "add_comment",
        description: "Add a comment to a pull request",
        inputSchema: {
          type: "object",
          properties: {
            workspace: {
              type: "string",
              description: "Bitbucket workspace slug",
            },
            repoSlug: {
              type: "string",
              description: "Repository slug",
            },
            prId: {
              type: "number",
              description: "Pull request ID",
            },
            content: {
              type: "string",
              description: "Comment content",
            },
          },
          required: ["workspace", "repoSlug", "prId", "content"],
        },
      },
      {
        name: "get_diff",
        description: "Get the diff/changes for a pull request",
        inputSchema: {
          type: "object",
          properties: {
            workspace: {
              type: "string",
              description: "Bitbucket workspace slug",
            },
            repoSlug: {
              type: "string",
              description: "Repository slug",
            },
            prId: {
              type: "number",
              description: "Pull request ID",
            },
          },
          required: ["workspace", "repoSlug", "prId"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "create_pr": {
        const {
          workspace,
          repoSlug,
          title,
          description,
          sourceBranch,
          destinationBranch,
        } = args as {
          workspace: string;
          repoSlug: string;
          title: string;
          description: string;
          sourceBranch: string;
          destinationBranch: string;
        };

        const pr = await bitbucketClient.createPR({
          workspace,
          repoSlug,
          title,
          description,
          sourceBranch,
          destinationBranch,
        });

        return {
          content: [
            {
              type: "text",
              text: `Pull request created successfully!\n\n${JSON.stringify(pr, null, 2)}`,
            },
          ],
        };
      }

      case "get_pr": {
        const { workspace, repoSlug, prId } = args as {
          workspace: string;
          repoSlug: string;
          prId: number;
        };

        const pr = await bitbucketClient.getPR(workspace, repoSlug, prId);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(pr, null, 2),
            },
          ],
        };
      }

      case "list_prs": {
        const { workspace, repoSlug, state } = args as {
          workspace: string;
          repoSlug: string;
          state?: string;
        };

        const prs = await bitbucketClient.listPRs(workspace, repoSlug, state);

        return {
          content: [
            {
              type: "text",
              text: `Found ${prs.length} pull request(s):\n\n${JSON.stringify(prs, null, 2)}`,
            },
          ],
        };
      }

      case "update_pr": {
        const { workspace, repoSlug, prId, title, description } = args as {
          workspace: string;
          repoSlug: string;
          prId: number;
          title?: string;
          description?: string;
        };

        const updates: { title?: string; description?: string } = {};
        if (title) updates.title = title;
        if (description) updates.description = description;

        const pr = await bitbucketClient.updatePR(
          workspace,
          repoSlug,
          prId,
          updates
        );

        return {
          content: [
            {
              type: "text",
              text: `Pull request updated successfully!\n\n${JSON.stringify(pr, null, 2)}`,
            },
          ],
        };
      }

      case "approve_pr": {
        const { workspace, repoSlug, prId } = args as {
          workspace: string;
          repoSlug: string;
          prId: number;
        };

        await bitbucketClient.approvePR(workspace, repoSlug, prId);

        return {
          content: [
            {
              type: "text",
              text: `Pull request #${prId} approved successfully!`,
            },
          ],
        };
      }

      case "merge_pr": {
        const { workspace, repoSlug, prId, strategy } = args as {
          workspace: string;
          repoSlug: string;
          prId: number;
          strategy?: string;
        };

        await bitbucketClient.mergePR(workspace, repoSlug, prId, strategy);

        return {
          content: [
            {
              type: "text",
              text: `Pull request #${prId} merged successfully${strategy ? ` using ${strategy} strategy` : ""}!`,
            },
          ],
        };
      }

      case "add_comment": {
        const { workspace, repoSlug, prId, content } = args as {
          workspace: string;
          repoSlug: string;
          prId: number;
          content: string;
        };

        await bitbucketClient.addComment(workspace, repoSlug, prId, content);

        return {
          content: [
            {
              type: "text",
              text: `Comment added to pull request #${prId} successfully!`,
            },
          ],
        };
      }

      case "get_diff": {
        const { workspace, repoSlug, prId } = args as {
          workspace: string;
          repoSlug: string;
          prId: number;
        };

        const diff = await bitbucketClient.getDiff(workspace, repoSlug, prId);

        return {
          content: [
            {
              type: "text",
              text: `Diff for pull request #${prId}:\n\n${diff}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
