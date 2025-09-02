import { replaceDiceWithZero, restoreDice } from './replaceDiceWithZero';

declare const chrome: any;
declare const browser: any;

// Background utilities for Foundry detection and chat messaging

const injectedTabs = new Map<number, string | undefined>();
const activeTabs = new Set<number>();

export function resetInjected(
  tabId: number,
  url: string | undefined,
  transitionType?: string,
): void {
  const prev = injectedTabs.get(tabId);
  if (prev === undefined) {
    return;
  }
  if (transitionType === "reload") {
    injectedTabs.delete(tabId);
    return;
  }
  if (url !== undefined && prev !== url) {
    injectedTabs.delete(tabId);
  }
}

export function getRuntime(): any {
  if (typeof browser !== "undefined") {
    return browser;
  }
  if (typeof chrome !== "undefined") {
    return chrome;
  }
  return undefined;
}

export async function isFoundryVTT(tabId: number): Promise<boolean> {
  const runtime = getRuntime();
  if (!runtime) {
    console.log("No runtime available while checking tab", tabId);
    return false;
  }

  try {
    if (runtime.scripting?.executeScript) {
      console.log(
        "Checking for Foundry VTT via runtime.scripting on tab",
        tabId,
      );
      const [result] = await runtime.scripting.executeScript({
        target: { tabId },
        // Run in the page context so window.game is accessible
        world: "MAIN",
        func: () => Boolean((window as any).game),
      });
      const isFoundry = Boolean(result?.result);
      console.log("runtime.scripting result for tab", tabId, isFoundry);
      return isFoundry;
    }
  } catch (err) {
    console.warn("isFoundryVTT failed for tab", tabId, err);
  }

  console.log("isFoundryVTT returning false for tab", tabId);
  return false;
}

export async function sendChatMessage(
  tabId: number,
  message: string,
): Promise<void> {
  const runtime = getRuntime();
  if (!runtime) {
    console.log("No runtime available for sendChatMessage on tab", tabId);
    return;
  }
  try {
    if (runtime.scripting?.executeScript) {
      console.log("Injecting message via runtime.scripting to tab", tabId);
      await runtime.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: (msg: string) => {
          const send = () => {
            const author = (window as any).game?.user?.id;
            const ChatMessage = (window as any).ChatMessage;
            if (!author || !ChatMessage) {
              console.warn(
                "Cannot inject message: missing author or ChatMessage",
              );
              return;
            }
            ChatMessage.create({ content: msg, author });
          };
          if ((window as any).game?.ready) {
            send();
          } else {
            (window as any).Hooks?.once?.("ready", send);
          }
        },
        args: [message],
      });
    }
    console.log("Chat message injection attempted for tab", tabId);
  } catch (err) {
    console.warn("sendChatMessage failed for tab", tabId, err);
  }
}

export async function handleInstall(tabId: number): Promise<void> {
  if (injectedTabs.has(tabId)) {
    console.log("Message already injected for tab", tabId);
    return;
  }
  // Mark this tab as processed to prevent duplicate injections
  injectedTabs.set(tabId, undefined);
  const runtime = getRuntime();
  if (!runtime) {
    console.log("No runtime available for handleInstall on tab", tabId);
    return;
  }

  let url: string | undefined;
  try {
    url = (await runtime.tabs?.get?.(tabId))?.url;
  } catch {
    url = undefined;
  }

  if (injectedTabs.get(tabId) === url) {
    console.log("Message already injected for tab", tabId);
    return;
  }
  injectedTabs.set(tabId, url);

  const message =
    "Rolling dice with unknown results gives me a lot of stress, so I'm using <a href='https://github.com/foundry-no-dice-no-cry'>no-dice-no-cry</a> to reduce it.";

  await sendChatMessage(tabId, message);
  try {
    if (runtime.scripting?.executeScript) {
      await runtime.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: replaceDiceWithZero,
      });
    }
  } catch (err) {
    console.warn("replaceDiceWithZero injection failed for tab", tabId, err);
  }
  console.log("No Dice, No Cry! extension installed");
}

export function isActive(tabId: number): boolean {
  return activeTabs.has(tabId);
}

export async function toggleActive(tabId: number): Promise<void> {
  const runtime = getRuntime();
  const currentlyActive = isActive(tabId);
  const makePaths = (base: string): Record<number, string> => {
    const url = (size: number) =>
      runtime?.runtime?.getURL
        ? runtime.runtime.getURL(`${base}-${size}.png`)
        : `${base}-${size}.png`;
    return { 16: url(16), 32: url(32), 48: url(48), 128: url(128) };
  };
  if (currentlyActive) {
    activeTabs.delete(tabId);
    injectedTabs.delete(tabId);
    await sendChatMessage(
      tabId,
      "I feel the whims of fate on my side; let the dice roll as the gods (or demons) decree!",
    );
    try {
      if (runtime?.scripting?.executeScript) {
        await runtime.scripting.executeScript({
          target: { tabId },
          world: "MAIN",
          func: restoreDice,
        });
      }
    } catch (err) {
      console.warn("restoreDice injection failed for tab", tabId, err);
    }
    const disabledPaths = makePaths('icon_disabled');
    if (runtime?.action?.setIcon) {
      runtime.action.setIcon({ tabId, path: disabledPaths });
    } else if (runtime?.browserAction?.setIcon) {
      runtime.browserAction.setIcon({ tabId, path: disabledPaths });
    }
  } else {
    activeTabs.add(tabId);
    await handleInstall(tabId);
    const activePaths = makePaths('icon');
    if (runtime?.action?.setIcon) {
      runtime.action.setIcon({ tabId, path: activePaths });
    } else if (runtime?.browserAction?.setIcon) {
      runtime.browserAction.setIcon({ tabId, path: activePaths });
    }
  }
  console.log("Toggled active state for tab", tabId, !currentlyActive);
}
