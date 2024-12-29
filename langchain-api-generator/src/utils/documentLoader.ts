import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(__dirname, '../../');

/**
 * ドキュメントファイルを読み込む
 */
export const readDocFile = (filename: string): string => {
  try {
    const filePath = path.join(WORKSPACE_ROOT, 'docs', filename);
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.warn(
      `ドキュメントファイル ${filename} の読み込みに失敗しました: ${String(
        error
      )}`
    );
    return '';
  }
};

/**
 * 必要なドキュメントファイルをすべて読み込む
 */
export const loadDocuments = (
  documentFiles: string[]
): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const filename of documentFiles) {
    const key = filename.replace('.md', '').toLowerCase();
    result[key] = readDocFile(filename);
  }

  return result;
};
