import {
  handleInstall,
  isFoundryVTT,
  getRuntime,
  resetInjected,
  toggleActive,
} from '../src/background';

const runtime = getRuntime();

if (runtime?.webNavigation?.onBeforeNavigate?.addListener) {
  runtime.webNavigation.onBeforeNavigate.addListener(
    ({ tabId, frameId, url, transitionType }: any) => {
      if (frameId === 0) {
        resetInjected(tabId, url, transitionType);
      }
    },
  );
} else if (runtime?.tabs?.onUpdated?.addListener) {
  // Fallback if webNavigation is unavailable
  runtime.tabs.onUpdated.addListener((tabId: number, changeInfo: any) => {
    if (changeInfo.status === 'loading' || changeInfo.url) {
      resetInjected(tabId, changeInfo.url);
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

if (runtime?.action?.onClicked?.addListener) {
  runtime.action.onClicked.addListener(async (tab: any) => {
    const tabId = tab?.id;
    if (typeof tabId === 'number') {
      const isFoundry = await isFoundryVTT(tabId);
      console.log('Toggle requested on tab', tabId, isFoundry);
      if (isFoundry) {
        await toggleActive(tabId);
      } else {
        console.log(
          'Skipping toggle; Foundry not detected on tab',
          tabId,
        );
      }
    }
  });
} else if (runtime?.browserAction?.onClicked?.addListener) {
  runtime.browserAction.onClicked.addListener(async (tab: any) => {
    const tabId = tab?.id;
    if (typeof tabId === 'number') {
      const isFoundry = await isFoundryVTT(tabId);
      console.log('Toggle requested on tab', tabId, isFoundry);
      if (isFoundry) {
        await toggleActive(tabId);
      } else {
        console.log(
          'Skipping toggle; Foundry not detected on tab',
          tabId,
        );
      }
    }
  });
} else {
  console.warn('No runtime available for action clicks');
}

export {};
