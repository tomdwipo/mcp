"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chromeClient = exports.ChromeClient = void 0;
const chrome_remote_interface_1 = __importDefault(require("chrome-remote-interface"));
const child_process_1 = require("child_process");
const CDP_HOST = "localhost";
const CDP_PORT = 9222;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const CHROME_LAUNCH_WAIT_MS = 2000;
const CDP_POLL_INTERVAL_MS = 100;
// Utility function to check if CDP is available
async function isCdpAvailable() {
    try {
        const response = await fetch(`http://${CDP_HOST}:${CDP_PORT}/json/version`);
        return response.ok;
    }
    catch {
        return false;
    }
}
// Utility function to sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Get platform-specific Chrome path
function getChromePath() {
    switch (process.platform) {
        case "darwin":
            return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
        case "win32":
            return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
        default:
            return "google-chrome";
    }
}
class ChromeClient {
    client = null;
    currentTargetId = null;
    async connect(targetId) {
        // First, ensure Chrome is running with debug port
        await this.ensureChromeRunning();
        // Retry logic for connection
        let lastError = null;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                if (this.client) {
                    try {
                        await this.client.close();
                    }
                    catch {
                    }
                    this.client = null;
                }
                const options = {
                    host: CDP_HOST,
                    port: CDP_PORT,
                };
                if (targetId) {
                    options.target = targetId;
                }
                this.client = await (0, chrome_remote_interface_1.default)(options);
                this.currentTargetId = targetId || null;
                await Promise.all([
                    this.client.Page.enable(),
                    this.client.Runtime.enable(),
                    this.client.DOM.enable(),
                ]);
                return; // Success!
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (attempt < MAX_RETRIES) {
                    await sleep(RETRY_DELAY_MS * attempt); // Exponential backoff
                }
            }
        }
        // All retries failed
        const message = lastError?.message || "Unknown error";
        if (message.includes("ECONNREFUSED")) {
            throw new Error(`Cannot connect to Chrome after ${MAX_RETRIES} attempts. Make sure Chrome is running with --remote-debugging-port=${CDP_PORT}\n` +
                `Launch Chrome with: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=${CDP_PORT}`);
        }
        throw new Error(`Failed to connect to Chrome after ${MAX_RETRIES} attempts: ${message}`);
    }
    // Launch Chrome with debugging port enabled
    async launchChrome(url, profile) {
        // Check if Chrome is already running with debug port
        if (await isCdpAvailable()) {
            return `Chrome is already running with debugging port ${CDP_PORT}`;
        }
        const chromePath = getChromePath();
        const targetUrl = url || "about:blank";
        let args;
        if (profile) {
            // Use existing Chrome profile
            const chromeDataDir = process.platform === "darwin"
                ? `${process.env.HOME}/Library/Application Support/Google/Chrome`
                : process.platform === "win32"
                    ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\User Data`
                    : `${process.env.HOME}/.config/google-chrome`;
            args = [
                `--remote-debugging-port=${CDP_PORT}`,
                `--user-data-dir=${chromeDataDir}`,
                `--profile-directory=${profile}`,
                targetUrl,
            ];
        }
        else {
            // Use temporary profile (original behavior)
            const userDataDir = `/tmp/chrome-debug-profile-${Date.now()}`;
            args = [
                `--remote-debugging-port=${CDP_PORT}`,
                `--user-data-dir=${userDataDir}`,
                "--no-first-run",
                "--no-default-browser-check",
                targetUrl,
            ];
        }
        try {
            // Use spawn with detached to properly run Chrome in background
            const chromeProcess = (0, child_process_1.spawn)(chromePath, args, {
                detached: true,
                stdio: "ignore",
            });
            // Unref so Node.js doesn't wait for this process
            chromeProcess.unref();
            // Poll for CDP availability with faster interval
            const maxAttempts = Math.ceil(CHROME_LAUNCH_WAIT_MS / CDP_POLL_INTERVAL_MS);
            for (let i = 0; i < maxAttempts; i++) {
                await sleep(CDP_POLL_INTERVAL_MS);
                if (await isCdpAvailable()) {
                    // Wait for at least one page tab to be available
                    await this.waitForTab();
                    return `Chrome launched successfully with debugging port ${CDP_PORT}`;
                }
            }
            throw new Error("Chrome started but debugging port is not responding");
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to launch Chrome: ${message}`);
        }
    }
    // Wait for at least one page tab to be available
    async waitForTab(timeout = 5000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                const targets = await chrome_remote_interface_1.default.List({ host: CDP_HOST, port: CDP_PORT });
                const pageTargets = targets.filter((t) => t.type === "page");
                if (pageTargets.length > 0) {
                    // Give the page a moment to initialize
                    await sleep(500);
                    return;
                }
            }
            catch {
                // Ignore errors during polling
            }
            await sleep(CDP_POLL_INTERVAL_MS);
        }
    }
    // Ensure Chrome is running with debug port, launch if not
    async ensureChromeRunning() {
        if (await isCdpAvailable()) {
            return; // Chrome is already running with debug port
        }
        // Try to launch Chrome
        try {
            await this.launchChrome();
        }
        catch {
            // If launch fails, it might be because Chrome is running without debug port
            // Just let the connection attempt fail with a helpful message
        }
    }
    async ensureConnected() {
        if (!this.client) {
            await this.connect();
        }
        return this.client;
    }
    async listTabs() {
        try {
            const targets = await chrome_remote_interface_1.default.List({ host: CDP_HOST, port: CDP_PORT });
            return targets
                .filter((t) => t.type === "page")
                .map((t) => ({
                id: t.id,
                title: t.title || "Untitled",
                url: t.url,
                type: t.type,
            }));
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to list tabs: ${message}`);
        }
    }
    async switchTab(tabId) {
        await chrome_remote_interface_1.default.Activate({ host: CDP_HOST, port: CDP_PORT, id: tabId });
        await this.connect(tabId);
    }
    async screenshot() {
        const client = await this.ensureConnected();
        const { data } = await client.Page.captureScreenshot({ format: "png" });
        return data;
    }
    async navigate(url) {
        const client = await this.ensureConnected();
        await client.Page.navigate({ url });
        await client.Page.loadEventFired();
    }
    async click(options) {
        const client = await this.ensureConnected();
        let x;
        let y;
        if (options.selector) {
            const { root } = await client.DOM.getDocument();
            const { nodeId } = await client.DOM.querySelector({
                nodeId: root.nodeId,
                selector: options.selector,
            });
            if (!nodeId) {
                throw new Error(`Element not found: ${options.selector}`);
            }
            const { model } = await client.DOM.getBoxModel({ nodeId });
            const content = model.content;
            x = (content[0] + content[2]) / 2;
            y = (content[1] + content[5]) / 2;
        }
        else if (options.x !== undefined && options.y !== undefined) {
            x = options.x;
            y = options.y;
        }
        else {
            throw new Error("Either selector or x,y coordinates required");
        }
        await client.Input.dispatchMouseEvent({
            type: "mousePressed",
            x,
            y,
            button: "left",
            clickCount: 1,
        });
        await client.Input.dispatchMouseEvent({
            type: "mouseReleased",
            x,
            y,
            button: "left",
            clickCount: 1,
        });
    }
    async type(text, selector) {
        const client = await this.ensureConnected();
        if (selector) {
            await this.click({ selector });
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        for (const char of text) {
            await client.Input.dispatchKeyEvent({
                type: "keyDown",
                text: char,
            });
            await client.Input.dispatchKeyEvent({
                type: "keyUp",
                text: char,
            });
        }
    }
    async evaluate(script) {
        const client = await this.ensureConnected();
        const { result, exceptionDetails } = await client.Runtime.evaluate({
            expression: script,
            returnByValue: true,
            awaitPromise: true,
        });
        if (exceptionDetails) {
            throw new Error(`JavaScript error: ${exceptionDetails.text}`);
        }
        return result.value;
    }
    async getContent(format) {
        const client = await this.ensureConnected();
        if (format === "text") {
            const result = await client.Runtime.evaluate({
                expression: "document.body.innerText",
                returnByValue: true,
            });
            return result.result.value;
        }
        else {
            const result = await client.Runtime.evaluate({
                expression: "document.documentElement.outerHTML",
                returnByValue: true,
            });
            return result.result.value;
        }
    }
    async scroll(direction, amount = 300) {
        const client = await this.ensureConnected();
        // Strategy 1: Try wheel event first (works for canvas apps and native scroll)
        const wheelResult = await this.tryWheelScroll(client, direction, amount);
        if (wheelResult.success) {
            return `Scrolled ${direction} by ${amount}px (wheel event)`;
        }
        // Strategy 2: Fallback to DOM-based scroll detection
        const domResult = await this.tryDomScroll(client, direction, amount);
        if (domResult.success) {
            return `Scrolled ${direction} ${amount}px on ${domResult.element}`;
        }
        return `No scrollable content found or already at scroll limit`;
    }
    async tryWheelScroll(client, direction, amount) {
        // Get initial scroll position
        const { result: beforeResult } = await client.Runtime.evaluate({
            expression: `JSON.stringify({
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight
      })`,
            returnByValue: true,
        });
        const before = JSON.parse(beforeResult.value);
        const centerX = Math.floor(before.width / 2);
        const centerY = Math.floor(before.height / 2);
        let deltaX = 0;
        let deltaY = 0;
        switch (direction) {
            case "up":
                deltaY = -amount;
                break;
            case "down":
                deltaY = amount;
                break;
            case "left":
                deltaX = -amount;
                break;
            case "right":
                deltaX = amount;
                break;
        }
        // Move mouse to center first
        await client.Input.dispatchMouseEvent({
            type: "mouseMoved",
            x: centerX,
            y: centerY,
        });
        // Dispatch wheel event
        await client.Input.dispatchMouseEvent({
            type: "mouseWheel",
            x: centerX,
            y: centerY,
            deltaX,
            deltaY,
        });
        // Small delay to let scroll happen
        await new Promise(resolve => setTimeout(resolve, 50));
        // Check if scroll position changed
        const { result: afterResult } = await client.Runtime.evaluate({
            expression: `JSON.stringify({ scrollX: window.scrollX, scrollY: window.scrollY })`,
            returnByValue: true,
        });
        const after = JSON.parse(afterResult.value);
        const scrolled = after.scrollX !== before.scrollX || after.scrollY !== before.scrollY;
        return { success: scrolled };
    }
    async tryDomScroll(client, direction, amount) {
        const script = `
      (function() {
        const direction = "${direction}";
        const amount = ${amount};

        // Find all scrollable elements
        function findScrollableElements() {
          const elements = [];
          const allElements = document.querySelectorAll('*');

          for (const el of allElements) {
            const style = getComputedStyle(el);
            const overflowY = style.overflowY;
            const overflowX = style.overflowX;

            const isVerticallyScrollable = (overflowY === 'auto' || overflowY === 'scroll') &&
                                           el.scrollHeight > el.clientHeight;
            const isHorizontallyScrollable = (overflowX === 'auto' || overflowX === 'scroll') &&
                                             el.scrollWidth > el.clientWidth;

            if (isVerticallyScrollable || isHorizontallyScrollable) {
              elements.push({
                el,
                area: el.clientWidth * el.clientHeight,
                isVerticallyScrollable,
                isHorizontallyScrollable
              });
            }
          }

          return elements.sort((a, b) => b.area - a.area);
        }

        const scrollables = findScrollableElements();
        let scrolled = false;
        let scrolledElement = null;

        for (const item of scrollables) {
          const el = item.el;
          const beforeScrollTop = el.scrollTop;
          const beforeScrollLeft = el.scrollLeft;

          if (direction === 'down' && item.isVerticallyScrollable) {
            el.scrollTop += amount;
            if (el.scrollTop !== beforeScrollTop) {
              scrolled = true;
              scrolledElement = el.className || el.tagName;
              break;
            }
          } else if (direction === 'up' && item.isVerticallyScrollable) {
            el.scrollTop -= amount;
            if (el.scrollTop !== beforeScrollTop) {
              scrolled = true;
              scrolledElement = el.className || el.tagName;
              break;
            }
          } else if (direction === 'right' && item.isHorizontallyScrollable) {
            el.scrollLeft += amount;
            if (el.scrollLeft !== beforeScrollLeft) {
              scrolled = true;
              scrolledElement = el.className || el.tagName;
              break;
            }
          } else if (direction === 'left' && item.isHorizontallyScrollable) {
            el.scrollLeft -= amount;
            if (el.scrollLeft !== beforeScrollLeft) {
              scrolled = true;
              scrolledElement = el.className || el.tagName;
              break;
            }
          }
        }

        // Final fallback: window.scrollBy
        if (!scrolled) {
          const beforeY = window.scrollY;
          const beforeX = window.scrollX;

          if (direction === 'down') window.scrollBy(0, amount);
          else if (direction === 'up') window.scrollBy(0, -amount);
          else if (direction === 'right') window.scrollBy(amount, 0);
          else if (direction === 'left') window.scrollBy(-amount, 0);

          if (window.scrollY !== beforeY || window.scrollX !== beforeX) {
            scrolled = true;
            scrolledElement = 'window';
          }
        }

        return JSON.stringify({ success: scrolled, element: scrolledElement });
      })();
    `;
        const { result } = await client.Runtime.evaluate({
            expression: script,
            returnByValue: true,
        });
        return JSON.parse(result.value);
    }
    async waitFor(selector, timeout = 5000) {
        const client = await this.ensureConnected();
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                const { root } = await client.DOM.getDocument();
                const { nodeId } = await client.DOM.querySelector({
                    nodeId: root.nodeId,
                    selector,
                });
                if (nodeId) {
                    return;
                }
            }
            catch {
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        throw new Error(`Timeout waiting for element: ${selector}`);
    }
    async mouseMove(x, y) {
        const client = await this.ensureConnected();
        await client.Input.dispatchMouseEvent({
            type: "mouseMoved",
            x,
            y,
        });
    }
    async drag(startX, startY, endX, endY) {
        const client = await this.ensureConnected();
        // Move to start
        await client.Input.dispatchMouseEvent({
            type: "mouseMoved",
            x: startX,
            y: startY,
        });
        // Press down
        await client.Input.dispatchMouseEvent({
            type: "mousePressed",
            x: startX,
            y: startY,
            button: "left",
            clickCount: 1,
        });
        // Interpolate steps for smooth drag (simulating human movement)
        const steps = 20;
        for (let i = 1; i <= steps; i++) {
            const x = startX + (endX - startX) * (i / steps);
            const y = startY + (endY - startY) * (i / steps);
            await client.Input.dispatchMouseEvent({
                type: "mouseMoved",
                x,
                y,
                button: "left",
            });
            await new Promise(resolve => setTimeout(resolve, 10)); // tiny delay
        }
        // Release at end
        await client.Input.dispatchMouseEvent({
            type: "mouseReleased",
            x: endX,
            y: endY,
            button: "left",
            clickCount: 1,
        });
    }
    async sendKey(key, modifiers = []) {
        const client = await this.ensureConnected();
        // Calculate modifier bitmask
        // Alt=1, Ctrl=2, Meta/Command=4, Shift=8
        let modifierMask = 0;
        if (modifiers.includes("Alt"))
            modifierMask |= 1;
        if (modifiers.includes("Ctrl"))
            modifierMask |= 2;
        if (modifiers.includes("Cmd") || modifiers.includes("Meta"))
            modifierMask |= 4;
        if (modifiers.includes("Shift"))
            modifierMask |= 8;
        // Determine if it's a special key or char
        // This is a simplified mapping. For full support we might need a mapping table.
        // For now, we support single chars and common keys.
        const isChar = key.length === 1;
        let type = "keyDown";
        let text = undefined;
        if (isChar) {
            text = key;
            // For characters, we often send a char event or raw key down/up with text
            // But Input.dispatchKeyEvent supports 'keyDown', 'keyUp', 'rawKeyDown', 'char'
            // For simple typing with modifiers, keyDown + keyUp is usually best.
        }
        // Dispatch KeyDown
        await client.Input.dispatchKeyEvent({
            type: "keyDown",
            modifiers: modifierMask,
            text: text,
            unmodifiedText: text,
            key: key,
            // code, nativeVirtualKeyCode, windowsVirtualKeyCode could be added for better compat
        });
        // Dispatch KeyUp
        await client.Input.dispatchKeyEvent({
            type: "keyUp",
            modifiers: modifierMask, // Modifiers might be released? usually keep consistent
            key: key,
        });
    }
    async canvasZoom(zoomIn = true, amount = 100) {
        const client = await this.ensureConnected();
        // Get canvas center position
        const { result } = await client.Runtime.evaluate({
            expression: `
        (function() {
          const canvas = document.querySelector('canvas');
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            return JSON.stringify({
              found: true,
              x: Math.floor(rect.left + rect.width / 2),
              y: Math.floor(rect.top + rect.height / 2)
            });
          }
          return JSON.stringify({
            found: false,
            x: Math.floor(window.innerWidth / 2),
            y: Math.floor(window.innerHeight / 2)
          });
        })();
      `,
            returnByValue: true,
        });
        const pos = JSON.parse(result.value);
        // Move mouse to canvas center first
        await client.Input.dispatchMouseEvent({
            type: "mouseMoved",
            x: pos.x,
            y: pos.y,
        });
        // Small delay to ensure mouse position is registered
        await new Promise(resolve => setTimeout(resolve, 50));
        // Dispatch wheel event with Ctrl modifier for zoom
        // Ctrl modifier = 2 in CDP
        // Negative deltaY = zoom in, Positive deltaY = zoom out
        await client.Input.dispatchMouseEvent({
            type: "mouseWheel",
            x: pos.x,
            y: pos.y,
            deltaX: 0,
            deltaY: zoomIn ? -amount : amount,
            modifiers: 2, // Ctrl key - this triggers zoom in apps like Figma
        });
        return `Zoomed ${zoomIn ? 'in' : 'out'} at (${pos.x}, ${pos.y}) with Ctrl+scroll`;
    }
    async close() {
        if (this.client) {
            try {
                await this.client.close();
            }
            catch {
            }
            this.client = null;
        }
    }
}
exports.ChromeClient = ChromeClient;
exports.chromeClient = new ChromeClient();
//# sourceMappingURL=chrome-client.js.map