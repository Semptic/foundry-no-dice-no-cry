import { handleInstall, isFoundryVTT, getRuntime } from '../src/background';

const runtime = getRuntime();

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
