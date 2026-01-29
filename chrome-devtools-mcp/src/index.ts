#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { chromeClient } from "./chrome-client.js";

const server = new Server(
  {
    name: "chrome-devtools-mcp",
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
        name: "launch_chrome",
        description: "Launch Chrome with debugging port enabled. Use this if Chrome is not running or not responding. Automatically creates a fresh profile to avoid conflicts.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "Optional URL to open (default: about:blank)",
            },
            profile: {
              type: "string",
              description: "Chrome profile directory name (e.g., 'Default', 'Profile 1'). If not specified, uses a fresh temporary profile.",
            },
          },
          required: [],
        },
      },
      {
        name: "screenshot",
        description: "Take a screenshot of the current Chrome tab. Returns base64 PNG image.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "click",
        description: "Click an element by CSS selector or x,y coordinates.",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector to click",
            },
            x: {
              type: "number",
              description: "X coordinate to click",
            },
            y: {
              type: "number",
              description: "Y coordinate to click",
            },
          },
        },
      },
      {
        name: "type",
        description: "Type text into the focused element or a specific element.",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "Text to type",
            },
            selector: {
              type: "string",
              description: "Optional CSS selector to focus before typing",
            },
          },
          required: ["text"],
        },
      },
      {
        name: "navigate",
        description: "Navigate to a URL in the current tab.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "URL to navigate to",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "evaluate",
        description: "Execute JavaScript in the page context and return the result.",
        inputSchema: {
          type: "object",
          properties: {
            script: {
              type: "string",
              description: "JavaScript code to execute",
            },
          },
          required: ["script"],
        },
      },
      {
        name: "get_content",
        description: "Get the page content as text or HTML.",
        inputSchema: {
          type: "object",
          properties: {
            format: {
              type: "string",
              enum: ["text", "html"],
              description: "Output format: 'text' for visible text, 'html' for full HTML",
            },
          },
          required: ["format"],
        },
      },
      {
        name: "list_tabs",
        description: "List all open Chrome tabs with their IDs, titles, and URLs.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "switch_tab",
        description: "Switch to a specific Chrome tab by its ID.",
        inputSchema: {
          type: "object",
          properties: {
            tabId: {
              type: "string",
              description: "Tab ID to switch to (from list_tabs)",
            },
          },
          required: ["tabId"],
        },
      },
      {
        name: "scroll",
        description: "Smart scroll that tries wheel event first (for canvas apps), then falls back to DOM-based scroll detection (for web apps like Slack, Notion).",
        inputSchema: {
          type: "object",
          properties: {
            direction: {
              type: "string",
              enum: ["up", "down", "left", "right"],
              description: "Direction to scroll",
            },
            amount: {
              type: "number",
              description: "Pixels to scroll (default: 300)",
            },
          },
          required: ["direction"],
        },
      },
      {
        name: "mouse_move",
        description: "Move the mouse to specific coordinates.",
        inputSchema: {
          type: "object",
          properties: {
            x: {
              type: "number",
              description: "X coordinate",
            },
            y: {
              type: "number",
              description: "Y coordinate",
            },
          },
          required: ["x", "y"],
        },
      },
      {
        name: "drag_and_drop",
        description: "Perform a drag and drop operation from (startX, startY) to (endX, endY).",
        inputSchema: {
          type: "object",
          properties: {
            startX: {
              type: "number",
              description: "Starting X coordinate",
            },
            startY: {
              type: "number",
              description: "Starting Y coordinate",
            },
            endX: {
              type: "number",
              description: "Ending X coordinate",
            },
            endY: {
              type: "number",
              description: "Ending Y coordinate",
            },
          },
          required: ["startX", "startY", "endX", "endY"],
        },
      },
      {
        name: "smart_type",
        description: "Type text or send keys with modifiers (e.g., 'Enter', 'Cmd+C').",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "Key to press (e.g., 'a', 'Enter', 'Backspace') or text to type",
            },
            modifiers: {
              type: "array",
              items: {
                type: "string",
                enum: ["Ctrl", "Alt", "Shift", "Cmd", "Meta"],
              },
              description: "Array of modifiers to hold down",
            },
          },
          required: ["key"],
        },
      },
      {
        name: "wait_for",
        description: "Wait for an element to appear on the page.",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector to wait for",
            },
            timeout: {
              type: "number",
              description: "Maximum wait time in milliseconds (default: 5000)",
            },
          },
          required: ["selector"],
        },
      },
      {
        name: "canvas_zoom",
        description: "Zoom in/out on canvas-based apps like Figma, Miro, or other design tools. Uses Ctrl+scroll which is the standard zoom gesture for these applications.",
        inputSchema: {
          type: "object",
          properties: {
            zoomIn: {
              type: "boolean",
              description: "True to zoom in, false to zoom out (default: true)",
            },
            amount: {
              type: "number",
              description: "Zoom intensity in scroll delta units (default: 100). Higher = more zoom per action.",
            },
          },
          required: [],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "launch_chrome": {
        const { url, profile } = args as { url?: string; profile?: string };
        const result = await chromeClient.launchChrome(url, profile);
        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
      }

      case "screenshot": {
        const data = await chromeClient.screenshot();
        return {
          content: [
            {
              type: "image",
              data,
              mimeType: "image/png",
            },
          ],
        };
      }

      case "click": {
        const { selector, x, y } = args as { selector?: string; x?: number; y?: number };
        await chromeClient.click({ selector, x, y });
        return {
          content: [
            {
              type: "text",
              text: selector
                ? `Clicked element: ${selector}`
                : `Clicked at coordinates (${x}, ${y})`,
            },
          ],
        };
      }

      case "type": {
        const { text, selector } = args as { text: string; selector?: string };
        await chromeClient.type(text, selector);
        return {
          content: [
            {
              type: "text",
              text: `Typed "${text}"${selector ? ` into ${selector}` : ""}`,
            },
          ],
        };
      }

      case "navigate": {
        const { url } = args as { url: string };
        await chromeClient.navigate(url);
        return {
          content: [
            {
              type: "text",
              text: `Navigated to: ${url}`,
            },
          ],
        };
      }

      case "evaluate": {
        const { script } = args as { script: string };
        const result = await chromeClient.evaluate(script);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_content": {
        const { format } = args as { format: "text" | "html" };
        const content = await chromeClient.getContent(format);
        return {
          content: [
            {
              type: "text",
              text: content,
            },
          ],
        };
      }

      case "list_tabs": {
        const tabs = await chromeClient.listTabs();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(tabs, null, 2),
            },
          ],
        };
      }

      case "switch_tab": {
        const { tabId } = args as { tabId: string };
        await chromeClient.switchTab(tabId);
        return {
          content: [
            {
              type: "text",
              text: `Switched to tab: ${tabId}`,
            },
          ],
        };
      }

      case "scroll": {
        const { direction, amount } = args as {
          direction: "up" | "down" | "left" | "right";
          amount?: number;
        };
        const result = await chromeClient.scroll(direction, amount);
        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
      }

      case "mouse_move": {
        const { x, y } = args as { x: number; y: number };
        await chromeClient.mouseMove(x, y);
        return {
          content: [
            {
              type: "text",
              text: `Moved mouse to (${x}, ${y})`,
            },
          ],
        };
      }

      case "drag_and_drop": {
        const { startX, startY, endX, endY } = args as {
          startX: number;
          startY: number;
          endX: number;
          endY: number;
        };
        await chromeClient.drag(startX, startY, endX, endY);
        return {
          content: [
            {
              type: "text",
              text: `Dragged from (${startX}, ${startY}) to (${endX}, ${endY})`,
            },
          ],
        };
      }

      case "smart_type": {
        const { key, modifiers } = args as { key: string; modifiers?: string[] };
        await chromeClient.sendKey(key, modifiers);
        return {
          content: [
            {
              type: "text",
              text: `Sent key "${key}"${modifiers ? ` with modifiers [${modifiers.join(", ")}]` : ""}`,
            },
          ],
        };
      }

      case "wait_for": {
        const { selector, timeout } = args as { selector: string; timeout?: number };
        await chromeClient.waitFor(selector, timeout);
        return {
          content: [
            {
              type: "text",
              text: `Element found: ${selector}`,
            },
          ],
        };
      }

      case "canvas_zoom": {
        const { zoomIn, amount } = args as {
          zoomIn?: boolean;
          amount?: number;
        };
        const result = await chromeClient.canvasZoom(zoomIn ?? true, amount);
        return {
          content: [
            {
              type: "text",
              text: result,
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
