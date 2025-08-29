import { handleInstall, isFoundryVTT } from '../src/background';

declare const chrome: any;

chrome.tabs.onUpdated.addListener(async (tabId: number, changeInfo: any) => {
  console.log('Tab updated', tabId, changeInfo.status);
  if (changeInfo.status === 'complete') {
    const isFoundry = await isFoundryVTT(tabId);
    console.log('isFoundryVTT', tabId, isFoundry);
    if (isFoundry) {
      await handleInstall(tabId);
    }
  }
});

export {};
