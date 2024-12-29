import { Octokit } from '@octokit/rest';
import type { components } from '@octokit/openapi-types';

export type GitHubIssue = components['schemas']['issue'];
export type IssueField = keyof GitHubIssue;

type PickIssueFields<T extends IssueField> = {
  [K in T]: GitHubIssue[K];
};

/**
 * イシューの詳細情報を取得する
 */
export const fetchIssueDetails = async <T extends IssueField>(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  fields: readonly T[]
): Promise<PickIssueFields<T>> => {
  const { data: issue } = await octokit.issues.get({
    owner,
    repo,
    issue_number: issueNumber
  });

  return validateAndPickFields(issue, fields);
};

/**
 * イシューのデータを検証して、必要なフィールドを選択する
 */
const validateAndPickFields = <T extends IssueField>(
  data: unknown,
  fields: readonly T[]
): PickIssueFields<T> => {
  if (!data || typeof data !== 'object')
    throw new Error('Issueの形式が無効です: オブジェクトではありません');

  const issue = data as Partial<GitHubIssue>;
  const missingFields = fields.filter((field) => !issue[field]);

  if (missingFields.length > 0)
    throw new Error(
      `必須フィールドが不足しています: ${missingFields.join(', ')}`
    );

  return fields.reduce(
    (acc, field) => ({
      ...acc,
      [field]: issue[field]
    }),
    {} as PickIssueFields<T>
  );
};
