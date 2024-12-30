import fs from 'fs';
import path from 'path';

/**
 * 特定のファイルを読み込む
 * パスはプロジェクトルートからの相対パスで指定する
 */
export const fileLoader = (filePath: string): string => {
  try {
    const projectRoot = path.resolve(process.cwd(), '..');
    const targetPath = path.resolve(projectRoot, filePath);

    if (!fs.existsSync(targetPath)) {
      console.error('❌ ファイルが存在しません:', targetPath);
      process.exit(1);
    }

    if (!fs.statSync(targetPath).isFile()) {
      console.error('❌ 指定されたパスはファイルではありません:', targetPath);
      process.exit(1);
    }

    const content = fs.readFileSync(targetPath, 'utf8');
    if (!content) {
      console.error('❌ ファイルの内容が空です:', targetPath);
      process.exit(1);
    }

    return content;
  } catch (error) {
    console.error(
      '❌ ファイル読み込みエラー:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
};
