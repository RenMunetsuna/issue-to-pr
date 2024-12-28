import fs from 'fs';
import path from 'path';

export const fileLoader = (filePath) => {
  try {
    const targetPath = path.resolve(process.cwd(), '..', filePath);
    return fs.readFileSync(targetPath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to load file at ${filePath}: ${error.message}`);
  }
};
