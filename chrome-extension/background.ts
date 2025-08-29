import { handleInstall, isFoundryVTT, getRuntime } from '../src/background';

const runtime = getRuntime();

if (runtime?.tabs?.onUpdated?.addListener) {
  runtime.tabs.onUpdated.addListener(async (tabId: number, changeInfo: any) => {
    console.log('Tab updated', tabId, changeInfo.status);
    if (changeInfo.status === 'complete') {
      const isFoundry = await isFoundryVTT(tabId);
      console.log('isFoundryVTT', tabId, isFoundry);
      if (isFoundry) {
        await handleInstall(tabId);
      }
    }
  });
} else {
  console.warn('No runtime available for tabs.onUpdated');
}

export {};
