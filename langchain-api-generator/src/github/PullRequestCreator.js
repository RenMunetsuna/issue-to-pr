import { Octokit } from '@octokit/rest';

export class PullRequestCreator {
  constructor(githubToken) {
    this.octokit = new Octokit({ auth: githubToken });
  }

  /**
   * 生成されたコードをPRとして作成
   * @param {string} owner - リポジトリオーナー
   * @param {string} repo - リポジトリ名
   * @param {number} issueNumber - Issue番号
   * @param {object} generatedFiles - 生成されたファイル群
   */
  async createPullRequest(owner, repo, issueNumber, generatedFiles) {
    try {
      // Get issue title
      console.log('Getting issue title...');
      const { data: issue } = await this.octokit.issues.get({
        owner,
        repo,
        issue_number: issueNumber
      });
      const issueTitle = issue.title;
      const timestamp = Date.now().toString().slice(-6);

      // Create branch name with timestamp
      const branchName = `feature/${issueNumber}-${timestamp}`;
      const defaultBranch = 'main';

      // Get the SHA of the default branch
      console.log('Getting default branch SHA...');
      const { data: defaultBranchData } = await this.octokit.repos.getBranch({
        owner,
        repo,
        branch: defaultBranch
      });
      const baseSha = defaultBranchData.commit.sha;

      // Create a new branch
      console.log(`Creating branch: ${branchName}`);
      await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: baseSha
      });

      // Create commits for each file
      console.log('Creating commits...');
      for (const [fileName, content] of Object.entries(generatedFiles)) {
        if (!content || content.trim() === '') {
          console.warn(`Skipping empty file: ${fileName}`);
          continue;
        }

        const filePath = `apps/server/src/routes/app/users/${fileName}`;
        console.log(`Creating commit for file: ${filePath}`);

        try {
          await this.octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: filePath,
            message: `feat: Add ${fileName}`,
            content: Buffer.from(content).toString('base64'),
            branch: branchName
          });
          console.log(`Successfully created/updated file: ${filePath}`);
        } catch (error) {
          console.error(`Error creating/updating file ${filePath}:`, error);
          throw error;
        }
      }

      // Create pull request
      console.log('Creating pull request...');
      const { data: pr } = await this.octokit.pulls.create({
        owner,
        repo,
        title: `${issueTitle} (#${issueNumber}-${timestamp})`,
        body: `Closes #${issueNumber}`,
        head: branchName,
        base: defaultBranch
      });

      console.log('Pull request created:', pr.html_url);
      return pr;
    } catch (error) {
      console.error('Error in createPullRequest:', error);
      throw error;
    }
  }
}
