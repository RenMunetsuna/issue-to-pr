import { readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * ディレクトリ構造を表示する
 * @param {string} dir - 表示するディレクトリのパス
 * @param {number} level - インデントレベル
 */
export const printDirectoryStructure = (dir, level = 0) => {
  const files = readdirSync(dir);

  files.forEach((file) => {
    if (file === 'node_modules' || file === '.git') return;

    const path = join(dir, file);
    const stats = statSync(path);
    const prefix = '  '.repeat(level);

    if (stats.isDirectory()) {
      console.log(`${prefix}📁 ${file}/`);
      printDirectoryStructure(path, level + 1);
    } else {
      console.log(`${prefix}📄 ${file}`);
    }
  });
};
