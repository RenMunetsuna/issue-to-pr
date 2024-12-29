/**
 * 生成されたコードをファイル単位でパースする
 * ### フルパス/ファイル名 ### ファイル内容 の形式でパースする
 */
export const parseGeneratedCode = (content: string): Record<string, string> => {
  const files: Record<string, string> = {};

  // セクションを分割して処理
  const sections = content
    .split(/###\s*([^#\n]+)\s*###/)
    .filter(Boolean)
    .map((section) => section.trim());

  // セクションを2つずつ処理（ファイル名とコンテンツのペア）
  for (let i = 0; i < sections.length - 1; i += 2) {
    const fileName = sections[i];
    const fileContent = sections[i + 1];

    if (!fileName || !fileContent) continue;

    // コードブロックのマーカーを削除
    const cleanContent = fileContent
      .replace(/^```(?:typescript)?\n/, '')
      .replace(/\n```$/, '')
      .trim();

    // ファイル名から不要な文字を削除
    const cleanFileName = fileName
      .replace(/^```(?:typescript)?\s*/, '')
      .replace(/\s*```$/, '')
      .trim();

    if (cleanFileName && cleanContent) {
      files[cleanFileName] = cleanContent;
    }
  }

  if (Object.keys(files).length === 0)
    throw new Error('ファイルが生成されませんでした');

  return files;
};
