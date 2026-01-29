import type { Client } from "chrome-remote-interface";
export interface TabInfo {
    id: string;
    title: string;
    url: string;
    type: string;
}
export interface InitializationStatus {
    state: 'not_started' | 'in_progress' | 'ready' | 'failed';
    chromeRunning: boolean;
    connected: boolean;
    error?: string;
}
export declare class ChromeClient {
    private client;
    private currentTargetId;
    private initializationPromise;
    private initializationState;
    private initializationError;
    connect(targetId?: string): Promise<void>;
    launchChrome(url?: string, profile?: string): Promise<string>;
    private waitForTab;
    ensureChromeRunning(): Promise<void>;
    ensureConnected(): Promise<Client>;
    listTabs(): Promise<TabInfo[]>;
    switchTab(tabId: string): Promise<void>;
    screenshot(): Promise<string>;
    navigate(url: string): Promise<void>;
    click(options: {
        selector?: string;
        x?: number;
        y?: number;
    }): Promise<void>;
    type(text: string, selector?: string): Promise<void>;
    evaluate<T>(script: string): Promise<T>;
    getContent(format: "text" | "html"): Promise<string>;
    scroll(direction: "up" | "down" | "left" | "right", amount?: number): Promise<string>;
    private tryWheelScroll;
    private tryDomScroll;
    waitFor(selector: string, timeout?: number): Promise<void>;
    mouseMove(x: number, y: number): Promise<void>;
    drag(startX: number, startY: number, endX: number, endY: number): Promise<void>;
    sendKey(key: string, modifiers?: string[]): Promise<void>;
    canvasZoom(zoomIn?: boolean, amount?: number): Promise<string>;
    close(): Promise<void>;
    private ensureInitialized;
    getInitializationStatus(): InitializationStatus;
    initialize(): Promise<void>;
}
export declare const chromeClient: ChromeClient;
//# sourceMappingURL=chrome-client.d.ts.map