import {
  handleInstall,
  isFoundryVTT,
  getRuntime,
  resetInjected,
} from '../src/background';

const runtime = getRuntime();

if (runtime?.webNavigation?.onBeforeNavigate?.addListener) {
  runtime.webNavigation.onBeforeNavigate.addListener(
    ({ tabId, frameId }: any) => {
      if (frameId === 0) {
        resetInjected(tabId);
      }
    },
  );
} else if (runtime?.tabs?.onUpdated?.addListener) {
  // Fallback if webNavigation is unavailable
  runtime.tabs.onUpdated.addListener((tabId: number, changeInfo: any) => {
    if (changeInfo.status === 'loading') {
      resetInjected(tabId);
    }
  });
} else {
  console.warn('No runtime available for navigation events');
}

if (runtime?.tabs?.onUpdated?.addListener) {
  runtime.tabs.onUpdated.addListener(
    async (tabId: number, changeInfo: any, tab: any) => {
      const status = changeInfo.status ?? tab?.status;
      if (status) {
        console.log('Tab updated', tabId, status);
      }
      if (changeInfo.status === 'complete') {
        const isFoundry = await isFoundryVTT(tabId);
        console.log('isFoundryVTT', tabId, isFoundry);
        if (isFoundry) {
          await handleInstall(tabId);
        } else {
          console.log(
            'Skipping message injection; Foundry not detected on tab',
            tabId,
          );
        }
      }
    },
  );
} else {
  console.warn('No runtime available for tabs.onUpdated');
}

export {};
