import type { components } from '@octokit/openapi-types';

type GitHubIssue = components['schemas']['issue'];
export type IssueField = keyof GitHubIssue;

// ジェネリクス型で指定されたフィールドの型を抽出
export type ParsedIssue<T extends IssueField> = Pick<GitHubIssue, T>;

const convertToParseIssue = <T extends IssueField>(
  issue: Partial<GitHubIssue>,
  fields: T[]
): ParsedIssue<T> => {
  return fields.reduce(
    (acc, field) => ({
      ...acc,
      [field]: issue[field] ?? null
    }),
    {}
  ) as ParsedIssue<T>;
};

export const parseAndValidateIssue = <T extends IssueField>(
  issueContent: string,
  requiredFields: T[]
): ParsedIssue<T> => {
  try {
    const parsed = parseIssueContent(issueContent);
    return validateIssue(parsed, requiredFields);
  } catch (error) {
    throw new Error(
      `Issueのパースと検証に失敗しました: ${
        error instanceof Error ? error.message : '不明なエラー'
      }`
    );
  }
};

const parseIssueContent = (content: string): unknown => {
  try {
    const parsed = JSON.parse(content);
    return typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
  } catch (error) {
    throw new Error(
      `JSONのパースに失敗しました: ${
        error instanceof Error ? error.message : '不明なエラー'
      }`
    );
  }
};

const validateIssue = <T extends IssueField>(
  data: unknown,
  requiredFields: T[]
): ParsedIssue<T> => {
  if (!data || typeof data !== 'object') {
    throw new Error('Issueの形式が無効です: オブジェクトではありません');
  }

  const issue = data as Partial<GitHubIssue>;
  const missingFields = requiredFields.filter((field) => !issue[field]);

  if (missingFields.length > 0) {
    throw new Error(
      `必須フィールドが不足しています: ${missingFields.join(', ')}`
    );
  }

  return convertToParseIssue(issue, requiredFields);
};
