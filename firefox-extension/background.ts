import { handleInstall } from '../src/background';

declare const browser: any;

browser.runtime.onInstalled.addListener(handleInstall);
export {};
