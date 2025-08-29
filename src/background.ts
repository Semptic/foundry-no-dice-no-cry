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

export function handleInstall() {
  console.log("No Dice, No Cry! extension installed");
}
