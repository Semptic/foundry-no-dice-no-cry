declare const chrome: any;
declare const browser: any;

function getRuntime(): any {
  return typeof browser !== "undefined" ? browser : chrome;
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
  const runtime = getRuntime();
  if (!runtime) {
    console.log("No runtime available for handleInstall on tab", tabId);
    return;
  }

  const message =
    "Rolling dice with unknown results gives me a lot of stress, so I'm using <a href='https://github.com/foundry-no-dice-no-cry'>no-dice-no-cry</a> to reduce it.";

  try {
    if (runtime.scripting?.executeScript) {
      console.log("Injecting message via runtime.scripting to tab", tabId);
      await runtime.scripting.executeScript({
        target: { tabId },
        func: (msg: string) => {
          const send = () =>
            (window as any).ChatMessage?.create({ content: msg });
          if ((window as any).ChatMessage) {
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
        code: `(function(){const send=()=>window.ChatMessage?.create({content: ${JSON.stringify(
          message,
        )}});if(window.ChatMessage){send();}else{window.Hooks?.once?.("ready",send);}})();`,
      });
    }
    console.log("Message injection attempted for tab", tabId);
  } catch (err) {
    console.warn("handleInstall failed for tab", tabId, err);
  }

  console.log("No Dice, No Cry! extension installed");
}
