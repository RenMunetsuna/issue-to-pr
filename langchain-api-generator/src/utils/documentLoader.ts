import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(__dirname, '../../');

/**
 * ドキュメントファイルを読み込む
 */
export const readDocFile = (filename: string): string => {
  try {
    const filePath = path.join(WORKSPACE_ROOT, 'docs', filename);
    console.log(`ドキュメントファイルを読み込み中: ${filePath}`);
    console.log(`ファイルの存在確認:`, {
      exists: fs.existsSync(filePath),
      isFile: fs.existsSync(filePath) && fs.statSync(filePath).isFile(),
      dirname: __dirname,
      workspaceRoot: WORKSPACE_ROOT
    });

    const content = readFileSync(filePath, 'utf-8');
    console.log(`ドキュメントファイル ${filename} の読み込み結果:`, {
      length: content.length,
      firstLine: content.split('\n')[0],
      isEmpty: !content.trim()
    });
    return content;
  } catch (error) {
    console.warn(
      `ドキュメントファイル ${filename} の読み込みに失敗しました:`,
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            code: (error as any).code
          }
        : String(error)
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
  console.log('読み込むドキュメントファイル:', documentFiles);
  const result: Record<string, string> = {};

  for (const filename of documentFiles) {
    const key = filename.replace('.md', '').toLowerCase();
    result[key] = readDocFile(filename);
  }

  console.log('ドキュメント読み込み結果:', Object.keys(result));
  return result;
};
