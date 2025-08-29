import { handleInstall, isFoundryVTT } from '../src/background';

declare const chrome: any;

chrome.tabs.onUpdated.addListener(async (tabId: number, changeInfo: any) => {
  if (changeInfo.status === 'complete' && await isFoundryVTT(tabId)) {
    await handleInstall(tabId);
  }
});

export {};
