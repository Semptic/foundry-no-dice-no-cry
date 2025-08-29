import { handleInstall, isFoundryVTT } from '../src/background';

declare const browser: any;

browser.tabs.onUpdated.addListener(async (tabId: number, changeInfo: any) => {
  if (changeInfo.status === 'complete' && await isFoundryVTT(tabId)) {
    handleInstall();
  }
});

export {};
