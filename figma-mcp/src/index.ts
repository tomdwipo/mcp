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
import { figmaClient } from "./figma-client.js";

const server = new Server(
  {
    name: "figma-mcp",
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
        name: "get_file",
        description:
          "Get a Figma file's document structure. Returns the file's name, key, last modified date, version, and a filtered document tree with nodes, components, and properties.",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "Figma file key (from the file URL)",
            },
            version: {
              type: "string",
              description: "Specific version to retrieve (optional)",
            },
            depth: {
              type: "number",
              description: "Depth of node tree to retrieve (optional, default is all)",
            },
          },
          required: ["key"],
        },
      },
      {
        name: "get_file_nodes",
        description:
          "Get specific nodes from a Figma file by their IDs. Returns the requested nodes filtered to essential properties.",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "Figma file key",
            },
            ids: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of node IDs to retrieve",
            },
            version: {
              type: "string",
              description: "Specific version to retrieve (optional)",
            },
            depth: {
              type: "number",
              description: "Depth of node tree to retrieve (optional)",
            },
          },
          required: ["key", "ids"],
        },
      },
      {
        name: "get_image_render",
        description:
          "Export nodes from a Figma file as images. Returns a map of node IDs to image URLs.",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "Figma file key",
            },
            ids: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of node IDs to export as images",
            },
            format: {
              type: "string",
              enum: ["jpg", "png", "svg", "pdf"],
              description: "Image format (optional, default is jpg)",
            },
            scale: {
              type: "number",
              description: "Image scale factor (optional, default is 1)",
            },
            svgExportId: {
              type: "string",
              description: "SVG export identifier (optional, for svg format only)",
            },
          },
          required: ["key", "ids"],
        },
      },
      {
        name: "get_components",
        description:
          "Get all components from a Figma file. Returns a list of components with their keys, names, node IDs, and metadata.",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "Figma file key",
            },
            since: {
              type: "string",
              description: "Timestamp to get components modified after (optional)",
            },
          },
          required: ["key"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_file": {
        const { key, version, depth } = args as {
          key: string;
          version?: string;
          depth?: number;
        };

        const file = await figmaClient.getFile(key, version, depth);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(file, null, 2),
            },
          ],
        };
      }

      case "get_file_nodes": {
        const { key, ids, version, depth } = args as {
          key: string;
          ids: string[];
          version?: string;
          depth?: number;
        };

        const nodes = await figmaClient.getFileNodes(key, ids, version, depth);

        return {
          content: [
            {
              type: "text",
              text: `Retrieved ${Object.keys(nodes.nodes).length} node(s):\n\n${JSON.stringify(nodes, null, 2)}`,
            },
          ],
        };
      }

      case "get_image_render": {
        const { key, ids, format, scale, svgExportId } = args as {
          key: string;
          ids: string[];
          format?: "jpg" | "png" | "svg" | "pdf";
          scale?: number;
          svgExportId?: string;
        };

        const images = await figmaClient.getImageRender(key, ids, {
          format,
          scale,
          svgExportId,
        });

        return {
          content: [
            {
              type: "text",
              text: `Generated ${Object.keys(images).length} image export(s):\n\n${JSON.stringify(images, null, 2)}`,
            },
          ],
        };
      }

      case "get_components": {
        const { key, since } = args as {
          key: string;
          since?: string;
        };

        const components = await figmaClient.getComponents(key, since);

        return {
          content: [
            {
              type: "text",
              text: `Found ${components.length} component(s):\n\n${JSON.stringify(components, null, 2)}`,
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
