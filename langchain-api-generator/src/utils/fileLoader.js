import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const fileLoader = (filePath) => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectRoot = path.resolve(__dirname, '../../../..');
    const targetPath = path.resolve(projectRoot, filePath);
    return fs.readFileSync(targetPath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to load file at ${filePath}: ${error.message}`);
  }
};
