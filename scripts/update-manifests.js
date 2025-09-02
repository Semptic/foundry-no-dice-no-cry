const fs = require('fs');
const path = require('path');
const root = __dirname ? path.resolve(__dirname, '..') : '..';
const pkg = require(path.join(root, 'package.json'));

for (const target of ['chrome', 'firefox']) {
  const manifestPath = path.join(root, `${target}-extension`, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.version = pkg.version;
  const outDir = path.join(root, 'dist', `no-dice-no-cry-${target}`);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  fs.copyFileSync(path.join(root, 'icon.png'), path.join(outDir, 'icon.png'));
  fs.copyFileSync(
    path.join(root, 'icon_disabled.png'),
    path.join(outDir, 'icon_disabled.png'),
  );
}
