import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const fileLoader = (filePath) => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const targetPath = path.resolve(__dirname, filePath);
    return fs.readFileSync(targetPath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to load file at ${filePath}: ${error.message}`);
  }
};
