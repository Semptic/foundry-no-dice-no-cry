const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = __dirname ? path.resolve(__dirname, '..') : '..';
const pkg = require(path.join(root, 'package.json'));

const sizes = [16, 32, 48, 128];

async function build() {
  for (const target of ['chrome', 'firefox']) {
    const manifestPath = path.join(root, `${target}-extension`, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.version = pkg.version;
    const outDir = path.join(root, 'dist', `no-dice-no-cry-${target}`);
    fs.mkdirSync(outDir, { recursive: true });

    const makeIcons = (src, base) =>
      Promise.all(
        sizes.map((size) =>
          sharp(path.join(root, src))
            .resize(size, size)
            .toFile(path.join(outDir, `${base}-${size}.png`)),
        ),
      );

    await makeIcons('icon.png', 'icon');
    await makeIcons('icon_disabled.png', 'icon_disabled');

    manifest.icons = Object.fromEntries(
      sizes.map((size) => [size, `icon-${size}.png`]),
    );
    manifest.action = manifest.action || {};
    manifest.action.default_icon = Object.fromEntries(
      sizes.map((size) => [size, `icon_disabled-${size}.png`]),
    );

    fs.writeFileSync(
      path.join(outDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
    );
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
