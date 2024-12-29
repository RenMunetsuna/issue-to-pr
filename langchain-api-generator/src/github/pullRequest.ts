import { Octokit } from '@octokit/rest';

type FileContent = {
  path: string;
  content: string;
};

type CreatePullRequestParams = {
  octokit: Octokit;
  owner: string;
  repo: string;
  issueNumber: number;
  files: FileContent[];
  options?: {
    branchPrefix?: string;
    defaultBranch?: string;
    commitMessage?: (fileName: string) => string;
  };
};

/**
 * プルリクエストを作成
 */
export const createPullRequest = async ({
  octokit,
  owner,
  repo,
  issueNumber,
  files,
  options = {}
}: CreatePullRequestParams): Promise<void> => {
  const {
    branchPrefix = 'feature',
    defaultBranch = 'main',
    commitMessage = (fileName: string) => `feat: ${fileName} を追加`
  } = options;

  const { data: issue } = await octokit.issues.get({
    owner,
    repo,
    issue_number: issueNumber
  });

  const timestamp = Date.now().toString().slice(-6);
  const branchName = `${branchPrefix}/${issueNumber}-${timestamp}`;

  const { data: defaultBranchData } = await octokit.repos.getBranch({
    owner,
    repo,
    branch: defaultBranch
  });

  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: defaultBranchData.commit.sha
  });

  for (const file of files) {
    if (!file.content || file.content.trim() === '') {
      console.warn(`空のファイルをスキップします: ${file.path}`);
      continue;
    }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: file.path,
      message: commitMessage(file.path),
      content: Buffer.from(file.content).toString('base64'),
      branch: branchName
    });
  }

  await octokit.pulls.create({
    owner,
    repo,
    title: `${issue.title} (#${issueNumber}-${timestamp})`,
    body: `Closes #${issueNumber}`,
    head: branchName,
    base: defaultBranch
  });
};
