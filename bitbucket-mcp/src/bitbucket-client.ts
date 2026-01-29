import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", ".env") });

const API_BASE_URL = "https://api.bitbucket.org/2.0";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface PullRequest {
  id: number;
  title: string;
  description: string;
  state: "OPEN" | "MERGED" | "DECLINED" | "SUPERSEDED";
  source: {
    branch: {
      name: string;
    };
  };
  destination: {
    branch: {
      name: string;
    };
  };
  author?: {
    display_name: string;
    uuid: string;
  };
  created_on?: string;
  updated_on?: string;
  links?: {
    html: {
      href: string;
    };
  };
}

export interface CreatePRParams {
  workspace: string;
  repoSlug: string;
  title: string;
  description: string;
  sourceBranch: string;
  destinationBranch: string;
}

export interface UpdatePRParams {
  title?: string;
  description?: string;
}

export class BitbucketClient {
  private apiToken: string;
  private email: string;
  private authHeader: string;

  constructor() {
    this.apiToken = process.env.BITBUCKET_API_TOKEN || "";
    this.email = process.env.BITBUCKET_EMAIL || "";

    if (!this.apiToken) {
      throw new Error(
        "BITBUCKET_API_TOKEN environment variable is required. Create an API token at: https://bitbucket.org/account/settings/app-passwords/"
      );
    }

    if (!this.email) {
      throw new Error(
        "BITBUCKET_EMAIL environment variable is required. This should be your Atlassian account email address."
      );
    }

    const credentials = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;
  }

  private filterPRData(pr: any): PullRequest {
    return {
      id: pr.id,
      title: pr.title,
      description: pr.description || pr.summary?.raw || "",
      state: pr.state,
      source: {
        branch: {
          name: pr.source?.branch?.name || ""
        }
      },
      destination: {
        branch: {
          name: pr.destination?.branch?.name || ""
        }
      },
      author: pr.author ? {
        display_name: pr.author.display_name,
        uuid: pr.author.uuid
      } : undefined,
      created_on: pr.created_on,
      updated_on: pr.updated_on,
      links: pr.links?.html ? {
        html: {
          href: pr.links.html.href
        }
      } : undefined
    };
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: unknown;
      isText?: boolean;
    } = {}
  ): Promise<T> {
    const { method = "GET", body, isText = false } = options;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers: Record<string, string> = {
          Authorization: this.authHeader,
          "Content-Type": "application/json",
        };

        const response = await fetch(url, {
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
            `Bitbucket API error (${response.status}): ${errorText}`
          );
        }

        if (response.status === 204) {
          return undefined as T;
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

  async createPR(params: CreatePRParams): Promise<PullRequest> {
    const { workspace, repoSlug, title, description, sourceBranch, destinationBranch } = params;

    const body = {
      title,
      description,
      source: {
        branch: {
          name: sourceBranch,
        },
      },
      destination: {
        branch: {
          name: destinationBranch,
        },
      },
    };

    const rawPR = await this.request<any>(
      `/repositories/${workspace}/${repoSlug}/pullrequests`,
      {
        method: "POST",
        body,
      }
    );
    return this.filterPRData(rawPR);
  }

  async getPR(
    workspace: string,
    repoSlug: string,
    prId: number
  ): Promise<PullRequest> {
    const rawPR = await this.request<any>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}`
    );
    return this.filterPRData(rawPR);
  }

  async listPRs(
    workspace: string,
    repoSlug: string,
    state?: string
  ): Promise<PullRequest[]> {
    const stateParam = state ? `?state=${state}` : "";
    const response = await this.request<{ values: any[] }>(
      `/repositories/${workspace}/${repoSlug}/pullrequests${stateParam}`
    );
    return (response.values || []).map(pr => this.filterPRData(pr));
  }

  async updatePR(
    workspace: string,
    repoSlug: string,
    prId: number,
    updates: UpdatePRParams
  ): Promise<PullRequest> {
    const rawPR = await this.request<any>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}`,
      {
        method: "PUT",
        body: updates,
      }
    );
    return this.filterPRData(rawPR);
  }

  async approvePR(
    workspace: string,
    repoSlug: string,
    prId: number
  ): Promise<void> {
    await this.request<void>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/approve`,
      {
        method: "POST",
      }
    );
  }

  async mergePR(
    workspace: string,
    repoSlug: string,
    prId: number,
    strategy?: string
  ): Promise<void> {
    const body = strategy
      ? {
          merge_strategy: strategy,
        }
      : undefined;

    await this.request<void>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/merge`,
      {
        method: "POST",
        body,
      }
    );
  }

  async addComment(
    workspace: string,
    repoSlug: string,
    prId: number,
    content: string
  ): Promise<void> {
    const body = {
      content: {
        raw: content,
      },
    };

    await this.request<void>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/comments`,
      {
        method: "POST",
        body,
      }
    );
  }

  async getDiff(
    workspace: string,
    repoSlug: string,
    prId: number
  ): Promise<string> {
    return this.request<string>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/diff`,
      {
        isText: true,
      }
    );
  }
}

export const bitbucketClient = new BitbucketClient();
