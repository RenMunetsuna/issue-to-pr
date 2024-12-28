import fs from 'fs';
import path from 'path';

export const fileLoader = (filePath) => {
  try {
    const projectRoot = path.resolve(process.cwd(), '..');
    const targetPath = path.resolve(projectRoot, filePath);

    console.log('Project root:', projectRoot);
    console.log('Attempting to read file:', targetPath);
    console.log('Current working directory:', process.cwd());

    if (!fs.existsSync(targetPath)) {
      throw new Error(`File does not exist at path: ${targetPath}`);
    }

    const content = fs.readFileSync(targetPath, 'utf8');
    if (!content) {
      throw new Error('File content is empty');
    }
    return content;
  } catch (error) {
    console.error('File loading error details:', {
      filePath,
      cwd: process.cwd(),
      projectRoot: path.resolve(process.cwd(), '..'),
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};
