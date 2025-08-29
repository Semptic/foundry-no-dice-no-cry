# foundry-no-dice-no-cry

Removes the stress of rolling dice in vtt foundry

When Foundry finishes loading, it posts a first-person chat message linking to this repository to explain that it's being used to ease the anxiety of unknown dice rolls.

## Browser Extension Stubs

This repository now includes minimal stubs for the **No Dice, No Cry!** browser extensions:

- `chrome-extension/` – Manifest V3 stub for Google Chrome.
- `firefox-extension/` – Manifest V2 stub for Mozilla Firefox.

These stubs share a tiny TypeScript library that logs when **No Dice, No Cry!** installs. Each extension's background script
registers this handler with its browser's runtime API and bundles the result into its own directory. Before installing, the
script confirms the active tab is running Foundry VTT by checking for `window.game`.

### Building the extensions

1. Install dependencies: `npm install`
2. Build the TypeScript background scripts: `npm run build`

The generated `background.js` files and updated manifests are written to `dist/no-dice-no-cry-{chrome,firefox}` and are ignored by git.
