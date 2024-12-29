import { Octokit } from '@octokit/rest';
import type { components } from '@octokit/openapi-types';

export type GitHubIssue = components['schemas']['issue'];
type IssueField = keyof GitHubIssue;

type PickIssueFields<T extends IssueField> = {
  [K in T]: GitHubIssue[K];
};

/**
 * イシューの詳細情報を取得する
 * @param octokit Octokitインスタンス
 * @param owner リポジトリのオーナー
 * @param repo リポジトリ名
 * @param issueNumber イシュー番号
 * @param fields 取得したいフィールドの配列
 * @returns 指定されたフィールドを持つイシューの情報
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

  // 型安全な方法でオブジェクトを構築
  const result = fields.reduce<Partial<PickIssueFields<T>>>((acc, field) => {
    acc[field] = issue[field];
    return acc;
  }, {});

  // すべてのフィールドが存在することを確認
  for (const field of fields) {
    if (!(field in result))
      throw new Error(`issueのフィールド ${field} が存在しません`);
  }

  return result as PickIssueFields<T>;
};

/**
 * イシューのラベルを確認する
 */
export const hasLabel = (
  issue: Pick<GitHubIssue, 'labels'>,
  targetLabel: string
): boolean => {
  if (!issue.labels) return false;

  return issue.labels.some((label) =>
    typeof label === 'string'
      ? label === targetLabel
      : label.name === targetLabel
  );
};
