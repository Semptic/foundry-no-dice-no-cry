declare const chrome: any;
declare const browser: any;

function getRuntime(): any {
  return typeof browser !== "undefined" ? browser : chrome;
}

export async function isFoundryVTT(tabId: number): Promise<boolean> {
  const runtime = getRuntime();
  if (!runtime) return false;

  try {
    if (runtime.scripting?.executeScript) {
      const [result] = await runtime.scripting.executeScript({
        target: { tabId },
        func: () => Boolean((window as any).game),
      });
      return Boolean(result?.result);
    } else if (runtime.tabs?.executeScript) {
      const [result] = await runtime.tabs.executeScript(tabId, {
        code: "Boolean(window.game)",
      });
      return Boolean(result);
    }
  } catch {
    // ignored
  }

  return false;
}

export async function handleInstall(tabId: number): Promise<void> {
  const runtime = getRuntime();
  if (!runtime) return;

  const message =
    "Rolling dice with unknown results gives me a lot of stress, so I'm using <a href='https://github.com/foundry-no-dice-no-cry'>no-dice-no-cry</a> to reduce it.";

  try {
    if (runtime.scripting?.executeScript) {
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
      await runtime.tabs.executeScript(tabId, {
        code: `(function(){const send=()=>window.ChatMessage?.create({content: ${JSON.stringify(
          message,
        )}});if(window.ChatMessage){send();}else{window.Hooks?.once?.("ready",send);}})();`,
      });
    }
  } catch {
    // ignored
  }

  console.log("No Dice, No Cry! extension installed");
}
