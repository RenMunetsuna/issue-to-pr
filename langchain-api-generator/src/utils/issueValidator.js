/**
 * Issueの内容をパースして検証する
 * @param {string} issueContent - IssueのJSON文字列
 * @returns {object} パース済みのIssueオブジェクト
 */
export const parseAndValidateIssue = (issueContent) => {
  try {
    let parsedContent;
    try {
      parsedContent = JSON.parse(issueContent);
      if (typeof parsedContent === 'string')
        parsedContent = JSON.parse(parsedContent);
    } catch (parseError) {
      throw new Error(`JSONのパースに失敗しました: ${parseError.message}`);
    }

    return validateIssue(parsedContent);
  } catch (error) {
    throw new Error(`Issueのパースと検証に失敗しました: ${error.message}`);
  }
};

/**
 * Issueオブジェクトの形式を検証する
 * @param {object} issue - 検証するIssueオブジェクト
 * @returns {object} 検証済みのIssueオブジェクト
 */
export const validateIssue = (issue) => {
  if (!issue || typeof issue !== 'object')
    throw new Error('Issueの形式が無効です: オブジェクトではありません');

  const { title, content } = issue;
  if (!title || !content)
    throw new Error(`必須フィールドが不足しています:
      タイトル: ${title ? 'あり' : 'なし'}
      内容: ${content ? 'あり' : 'なし'}`);

  if (typeof title !== 'string')
    throw new Error('Issueの形式が無効です: タイトルが不正です');

  if (typeof content !== 'string')
    throw new Error('Issueの形式が無効です: 内容が不正です');

  return issue;
};
