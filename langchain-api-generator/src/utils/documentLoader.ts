import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(__dirname, '../../');

/**
 * ドキュメントファイルを読み込む
 */
export const readDocFile = (filename: string) => {
  try {
    const filePath = path.join(WORKSPACE_ROOT, 'docs', filename);
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.warn(
      `ドキュメントファイル ${filename} の読み込みに失敗しました: ${String(
        error
      )}`
    );
  }
  return '';
};

/**
 * 必要なドキュメントファイルをすべて読み込む
 */
export const loadDocuments = (
  documentFiles: string[]
): Record<string, string> => {
  return documentFiles.reduce<Record<string, string>>((acc, filename) => {
    const key = filename.replace('.md', '').toLowerCase();
    acc[key] = readDocFile(filename);
    return acc;
  }, {});
};
