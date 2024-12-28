/**
 * 生成されたコードをファイル単位でパースする
 * @param {string} content - 生成されたコードの内容
 * @returns {Object} ファイル名とコンテンツのマップ
 */
export const parseGeneratedCode = (content) => {
  const files = {};

  // セクションを分割して処理
  const sections = content
    .split(/###\s*([^#\n]+)\s*###/)
    .filter(Boolean)
    .map((section) => section.trim());

  // セクションを2つずつ処理（ファイル名とコンテンツのペア）
  for (let i = 0; i < sections.length; i += 2) {
    const fileName = sections[i].trim();
    const fileContent = sections[i + 1];

    if (fileName && fileContent) {
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

      files[cleanFileName] = cleanContent;
    }
  }

  return files;
};
