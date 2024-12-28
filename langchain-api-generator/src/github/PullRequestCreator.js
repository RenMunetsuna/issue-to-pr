import { Octokit } from '@octokit/rest';

/**
 * 生成されたコードをPRとして作成
 * @param {object} params - パラメータ
 * @param {string} params.githubToken - GitHubトークン
 * @param {string} params.owner - リポジトリオーナー
 * @param {string} params.repo - リポジトリ名
 * @param {number} params.issueNumber - Issue番号
 * @param {object} params.files - 生成されたファイル群
 * @returns {Promise<object>} 作成されたPRの情報
 */
export async function createPullRequest({
  githubToken,
  owner,
  repo,
  issueNumber,
  files
}) {
  try {
    const octokit = new Octokit({ auth: githubToken });

    // Issueのタイトルを取得
    console.log('Issueのタイトルを取得中...');
    const { data: issue } = await octokit.issues.get({
      owner,
      repo,
      issue_number: issueNumber
    });
    const issueTitle = issue.title;
    const timestamp = Date.now().toString().slice(-6);

    // ブランチ名を生成
    const branchName = `feature/${issueNumber}-${timestamp}`;
    const defaultBranch = 'main';

    // デフォルトブランチのSHAを取得
    console.log('デフォルトブランチのSHAを取得中...');
    const { data: defaultBranchData } = await octokit.repos.getBranch({
      owner,
      repo,
      branch: defaultBranch
    });
    const baseSha = defaultBranchData.commit.sha;

    // 新しいブランチを作成
    console.log(`ブランチを作成中: ${branchName}`);
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha
    });

    // 各ファイルのコミットを作成
    console.log('コミットを作成中...');
    for (const [fileName, content] of Object.entries(files)) {
      if (!content || content.trim() === '') {
        console.warn(`空のファイルをスキップします: ${fileName}`);
        continue;
      }

      const filePath = `apps/server/src/routes/app/users/${fileName}`;
      console.log(`ファイルを作成中: ${filePath}`);

      try {
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: filePath,
          message: `feat: ${fileName} を追加`,
          content: Buffer.from(content).toString('base64'),
          branch: branchName
        });
        console.log(`ファイルの作成が完了しました: ${filePath}`);
      } catch (error) {
        console.error(`ファイルの作成に失敗しました ${filePath}:`, error);
        throw error;
      }
    }

    // プルリクエストを作成
    console.log('プルリクエストを作成中...');
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      title: `${issueTitle} (#${issueNumber}-${timestamp})`,
      body: `Closes #${issueNumber}`,
      head: branchName,
      base: defaultBranch
    });

    console.log('プルリクエストが作成されました:', pr.html_url);
    return pr;
  } catch (error) {
    console.error('プルリクエストの作成中にエラーが発生しました:', error);
    throw error;
  }
}
