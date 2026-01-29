import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", ".env") });

const API_BASE_URL = "https://api.figma.com/v1";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface FigmaFile {
  name: string;
  key: string;
  lastModified: string;
  version: string;
  document: FigmaNode;
  components: Record<string, Component>;
  schemaVersion: number;
  thumbnails?: Record<string, string>;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Component {
  key: string;
  node_id: string;
  name: string;
  description?: string;
  file_key: string;
  containing_frame?: FigmaNode;
  thumbnail_url?: string;
}

export interface Variable {
  id: string;
  name: string;
  variableId: string;
  resolvedType: string;
  valuesByMode: Record<string, unknown>;
  codeSyntax?: Record<string, unknown>;
}

export interface VariableCollection {
  id: string;
  name: string;
  modeIds: Record<string, string>;
  variableIds: string[];
  defaultModeId: string;
}

export interface DevResource {
  type: string;
  node_id: string;
  name: string;
  url?: string;
  children?: DevResource[];
}

export interface TextEvent {
  id: string;
  timestamp: string;
  trigger: {
    type: string;
    user_id: string;
  };
  changes: TextChange[];
  file_key: string;
  project_id: string;
}

export interface TextChange {
  id: string;
  old_label: string;
  label: string;
  guid: string;
  component_ref?: {
    file_key: string;
    node_id: string;
  };
}

export interface ImageRenderOptions {
  format?: "jpg" | "png" | "svg" | "pdf";
  scale?: number;
  svgExportId?: string;
}

export interface FileNodesResponse {
  name: string;
  lastModified: string;
  version: string;
  nodes: Record<string, FigmaNode | null>;
}

export class FigmaClient {
  private accessToken: string;
  private authHeader: string;

  constructor() {
    this.accessToken = process.env.FIGMA_ACCESS_TOKEN || "";

    if (!this.accessToken) {
      throw new Error(
        "FIGMA_ACCESS_TOKEN environment variable is required. Create a personal access token at: https://www.figma.com/developer/personal-access-tokens"
      );
    }

    this.authHeader = `Bearer ${this.accessToken}`;
  }

  private filterNodeData(node: any, depth: number = 0): any {
    if (!node || depth > 10) return null;

    const filtered: any = {
      id: node.id,
      name: node.name,
      type: node.type,
    };

    if (node.type === "TEXT" && node.characters) {
      filtered.characters = node.characters;
    }

    if (node.children && Array.isArray(node.children) && depth < 10) {
      filtered.children = node.children
        .slice(0, 100)
        .map((child: any) => this.filterNodeData(child, depth + 1))
        .filter((c: any) => c !== null);
    }

    if (node.fills) filtered.fills = node.fills;
    if (node.strokes) filtered.strokes = node.strokes;
    if (node.effects) filtered.effects = node.effects;

    return filtered;
  }

  private filterFileData(file: any): FigmaFile {
    return {
      name: file.name,
      key: file.key,
      lastModified: file.lastModified,
      version: file.version,
      document: this.filterNodeData(file.document) as FigmaNode,
      components: file.components || {},
      schemaVersion: file.schemaVersion || 0,
      thumbnails: file.thumbnails,
    };
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: unknown;
      isText?: boolean;
      queryParams?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const { method = "GET", body, isText = false, queryParams } = options;
    let lastError: Error | null = null;

    const url = new URL(`${API_BASE_URL}${endpoint}`);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const headers: Record<string, string> = {
          "Authorization": this.authHeader,
          "Content-Type": "application/json",
        };

        const response = await fetch(url.toString(), {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get("retry-after");
          const delay = retryAfter
            ? parseInt(retryAfter) * 1000
            : RETRY_DELAY_MS * attempt;
          await this.sleep(delay);
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Figma API error (${response.status}): ${errorText}`
          );
        }

        if (isText) {
          const text = await response.text();
          return text as T;
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < MAX_RETRIES) {
          await this.sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    throw new Error(
      `Failed after ${MAX_RETRIES} attempts: ${lastError?.message || "Unknown error"}`
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getFile(key: string, version?: string, depth?: number): Promise<FigmaFile> {
    const params: Record<string, string> = {};
    if (version) params.version = version;
    if (depth !== undefined) params.depth = depth.toString();

    const response = await this.request<any>(
      `/files/${key}`,
      { queryParams: params }
    );
    return this.filterFileData(response);
  }

  async getFileNodes(key: string, ids: string[], version?: string, depth?: number): Promise<FileNodesResponse> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("ids must be a non-empty array of node IDs");
    }

    const params: Record<string, string> = {
      ids: ids.join(","),
    };
    if (version) params.version = version;
    if (depth !== undefined) params.depth = depth.toString();

    const response = await this.request<any>(
      `/files/${key}/nodes`,
      { queryParams: params }
    );

    const filteredNodes: Record<string, any> = {};
    for (const [id, node] of Object.entries(response.nodes)) {
      if (node !== null) {
        filteredNodes[id] = this.filterNodeData((node as any).document);
      } else {
        filteredNodes[id] = null;
      }
    }

    return {
      name: response.name,
      lastModified: response.lastModified,
      version: response.version,
      nodes: filteredNodes,
    };
  }

  async getImageRender(
    key: string,
    ids: string[],
    options: ImageRenderOptions = {}
  ): Promise<Record<string, string>> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("ids must be a non-empty array of node IDs");
    }

    const params: Record<string, string> = {
      ids: ids.join(","),
    };
    if (options.format) params.format = options.format;
    if (options.scale) params.scale = options.scale.toString();
    if (options.svgExportId) params.svg_export_id = options.svgExportId;

    return this.request<Record<string, string>>(
      `/images/${key}`,
      { queryParams: params }
    );
  }

  async getComponents(key: string, since?: string): Promise<Component[]> {
    const params: Record<string, string> = {};
    if (since) params.since = since;

    const response = await this.request<{ components: Component[] }>(
      `/files/${key}/components`,
      { queryParams: params }
    );

    const components = response.components || [];
    return components.slice(0, 500).map((c) => ({
      key: c.key,
      node_id: c.node_id,
      name: c.name,
      description: c.description,
      file_key: c.file_key,
      containing_frame: c.containing_frame,
      thumbnail_url: c.thumbnail_url,
    }));
  }

  async getLocalComponents(key: string): Promise<Component[]> {
    const response = await this.request<{ local_components: Component[] }>(
      `/files/${key}/local_components`
    );

    const components = response.local_components || [];
    return components.slice(0, 500).map((c) => ({
      key: c.key,
      node_id: c.node_id,
      name: c.name,
      description: c.description,
      file_key: c.file_key,
      containing_frame: c.containing_frame,
      thumbnail_url: c.thumbnail_url,
    }));
  }

  async getVariables(key: string): Promise<Variable[]> {
    const response = await this.request<{ variables: Variable[] }>(
      `/files/${key}/variables`
    );

    const variables = response.variables || [];
    return variables.slice(0, 500).map((v) => ({
      id: v.id,
      name: v.name,
      variableId: v.variableId,
      resolvedType: v.resolvedType,
      valuesByMode: v.valuesByMode,
      codeSyntax: v.codeSyntax,
    }));
  }

  async getVariableCollections(key: string): Promise<VariableCollection[]> {
    const response = await this.request<{
      variableCollections: VariableCollection[]
    }>(`/files/${key}/variable_collections`);

    const collections = response.variableCollections || [];
    return collections.slice(0, 100).map((c) => ({
      id: c.id,
      name: c.name,
      modeIds: c.modeIds,
      variableIds: c.variableIds,
      defaultModeId: c.defaultModeId,
    }));
  }

  async getDevResources(key: string, since?: string): Promise<DevResource[]> {
    const params: Record<string, string> = {};
    if (since) params.since = since;

    const response = await this.request<{ dev_resources: DevResource[] }>(
      `/files/${key}/dev_resources`,
      { queryParams: params }
    );

    const resources = response.dev_resources || [];
    return resources.slice(0, 500).map((r) => ({
      type: r.type,
      node_id: r.node_id,
      name: r.name,
      url: r.url,
      children: r.children ? r.children.slice(0, 50) : undefined,
    }));
  }

  async getTextEvents(
    teamId: string,
    projectKey?: string,
    fileKey?: string,
    since?: string,
    before?: string
  ): Promise<TextEvent[]> {
    const params: Record<string, string> = {};
    if (projectKey) params.project_key = projectKey;
    if (fileKey) params.file_key = fileKey;
    if (since) params.since = since;
    if (before) params.before = before;

    const response = await this.request<{ text_events: TextEvent[] }>(
      `/teams/${teamId}/text_events`,
      { queryParams: params }
    );

    const events = response.text_events || [];
    return events.slice(0, 500).map((e) => ({
      id: e.id,
      timestamp: e.timestamp,
      trigger: e.trigger,
      changes: e.changes.slice(0, 50),
      file_key: e.file_key,
      project_id: e.project_id,
    }));
  }
}

export const figmaClient = new FigmaClient();
