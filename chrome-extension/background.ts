import { handleInstall } from '../src/background';

declare const chrome: any;

chrome.runtime.onInstalled.addListener(handleInstall);
export {};
