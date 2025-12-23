import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distIndex = path.join(__dirname, '..', 'dist', 'index.html');

const html = `<!DOCTYPE html>
<html lang="zh-HK">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OneNightDrink</title>
    <meta http-equiv="refresh" content="0; url=https://www.one-night-drink.com" />
    <script>
      window.location.href = "https://www.one-night-drink.com";
    </script>
    <style>
      body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    </style>
  </head>
  <body>
    <p>Redirecting to OneNightDrink...</p>
  </body>
</html>
`;

fs.writeFileSync(distIndex, html);
console.log('✓ dist/index.html replaced with redirect to https://www.one-night-drink.com');
