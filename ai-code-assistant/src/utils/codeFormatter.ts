import prettier from 'prettier';

export type GeneratedFiles = {
  [key: string]: string;
};

/**
 * 生成されたファイルをPrettierでフォーマットする
 * @param files フォーマットする元のファイルオブジェクト
 * @returns フォーマット後のファイルオブジェクト
 */
export const formatGeneratedFiles = async (
  files: GeneratedFiles
): Promise<GeneratedFiles> => {
  const formattedFiles: GeneratedFiles = {};

  for (const [fileName, fileContent] of Object.entries(files)) {
    try {
      const formattedContent = await prettier.format(fileContent, {
        parser: fileName.endsWith('.ts')
          ? 'typescript'
          : fileName.endsWith('.js')
            ? 'javascript'
            : fileName.endsWith('.json')
              ? 'json'
              : 'babel'
      });
      formattedFiles[fileName] = formattedContent;
    } catch (error) {
      console.warn(
        `ファイル ${fileName} のフォーマット中にエラーが発生しました:`,
        error
      );
      formattedFiles[fileName] = fileContent; // エラー時は元のコンテンツを使用
    }
  }

  return formattedFiles;
};
