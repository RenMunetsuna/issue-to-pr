import fs from 'fs';
import path from 'path';

/**
 * 特定のファイルを読み込む
 * パスはプロジェクトルートからの相対パスで指定する
 */
export const fileLoader = (filePath: string) => {
  try {
    const projectRoot = path.resolve(process.cwd(), '..');
    const targetPath = path.resolve(projectRoot, filePath);

    if (!fs.existsSync(targetPath))
      throw new Error(`指定されたパスにファイルが存在しません: ${targetPath}`);

    const content = fs.readFileSync(targetPath, 'utf8');
    if (!content) throw new Error('ファイルの内容が空です');

    return content;
  } catch (error) {
    console.error('ファイル読み込みエラー:', {
      filePath,
      cwd: process.cwd(),
      projectRoot: path.resolve(process.cwd(), '..'),
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};
