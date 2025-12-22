import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'assets', 'public');

if (fs.existsSync(publicDir)) {
  fs.rmSync(publicDir, { recursive: true, force: true });
  console.log('✓ Removed local assets - app will load from remote URL');
} else {
  console.log('✓ No local assets to remove');
}
