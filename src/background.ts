declare const chrome: any;
declare const browser: any;

const injectedTabs = new Map<number, string | undefined>();

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
      console.log("Checking for Foundry VTT via runtime.scripting on tab", tabId);
      const [result] = await runtime.scripting.executeScript({
        target: { tabId },
        // Run in the page context so window.game is accessible
        world: "MAIN",
        func: () => Boolean((window as any).game),
      });
      const isFoundry = Boolean(result?.result);
      console.log("runtime.scripting result for tab", tabId, isFoundry);
      return isFoundry;
    } else if (runtime.tabs?.executeScript) {
      console.log("Checking for Foundry VTT via runtime.tabs on tab", tabId);
      const [result] = await runtime.tabs.executeScript(tabId, {
        code: "Boolean(window.game)",
      });
      const isFoundry = Boolean(result);
      console.log("runtime.tabs result for tab", tabId, isFoundry);
      return isFoundry;
    }
  } catch (err) {
    console.warn("isFoundryVTT failed for tab", tabId, err);
  }

  console.log("isFoundryVTT returning false for tab", tabId);
  return false;
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

  try {
    if (runtime.scripting?.executeScript) {
        console.log("Injecting message via runtime.scripting to tab", tabId);
        await runtime.scripting.executeScript({
          target: { tabId },
          // Execute in page context so ChatMessage is available
          world: "MAIN",
          func: (msg: string) => {
            const send = () => {
              const author = (window as any).game?.user?.id;
              const ChatMessage = (window as any).ChatMessage;
              if (!author || !ChatMessage) {
                console.warn("Cannot inject message: missing author or ChatMessage");
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
    } else if (runtime.tabs?.executeScript) {
        console.log("Injecting message via runtime.tabs to tab", tabId);
        await runtime.tabs.executeScript(tabId, {
          code: `(function(){const send=()=>{const a=window.game?.user?.id;const CM=window.ChatMessage;if(!a||!CM){console.warn("Cannot inject message: missing author or ChatMessage");return;}CM.create({content: ${JSON.stringify(
            message,
          )},author:a});};if(window.game?.ready){send();}else{window.Hooks?.once?("ready",send);}})();`,
        });
      }
    console.log("Message injection attempted for tab", tabId);
  } catch (err) {
    console.warn("handleInstall failed for tab", tabId, err);
  }

  console.log("No Dice, No Cry! extension installed");
}

