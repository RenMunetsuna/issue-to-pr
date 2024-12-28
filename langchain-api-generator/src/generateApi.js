import { ChatAnthropic } from '@langchain/anthropic';
import { PromptTemplate } from '@langchain/core/prompts';
import { Octokit } from '@octokit/rest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * API生成を担当するメインクラス
 * LangChainとGitHub APIを使用してAPIコードを生成しPRを作成する
 */
class ApiGenerator {
  constructor(anthropicApiKey, githubToken, workspaceRoot) {
    // APIキーの状態を確認
    console.log('Constructor API Key status:', {
      exists: !!anthropicApiKey,
      length: anthropicApiKey?.length,
      prefix: anthropicApiKey?.substring(0, 20),
      isString: typeof anthropicApiKey === 'string'
    });

    // Claude 3 Sonnetモデルの初期化
    this.model = new ChatAnthropic({
      anthropicApiKey,
      modelName: 'claude-3-sonnet-20240229'
    });
    // GitHub APIクライアントの初期化
    this.octokit = new Octokit({ auth: githubToken });
    this.workspaceRoot = workspaceRoot;

    // ワークスペースの構造を確認
    console.log('\nWorkspace structure:');
    this.printDirectoryStructure(this.workspaceRoot);
  }

  printDirectoryStructure(dir, level = 0) {
    const files = readdirSync(dir);

    files.forEach((file) => {
      if (file === 'node_modules' || file === '.git') return;

      const path = join(dir, file);
      const stats = statSync(path);
      const prefix = '  '.repeat(level);

      if (stats.isDirectory()) {
        console.log(`${prefix}📁 ${file}/`);
        this.printDirectoryStructure(path, level + 1);
      } else {
        console.log(`${prefix}📄 ${file}`);
      }
    });
  }

  /**
   * ドキュメントファイルを読み込む
   * @param {string} filename - 読み込むファイル名
   * @returns {string} ファイルの内容
   */
  readDocFile(filename) {
    try {
      const filePath = join(this.workspaceRoot, 'docs', filename);
      console.log(`Attempting to read file: ${filePath}`);
      console.log('Current directory:', process.cwd());
      console.log('Workspace root:', this.workspaceRoot);
      console.log(
        'Directory contents of docs/:',
        readdirSync(join(this.workspaceRoot, 'docs'))
      );
      return readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.warn(
        `Warning: Could not read ${filename}. Error:`,
        error.message
      );
      console.log('Error stack:', error.stack);
      return '';
    }
  }

  /**
   * APIコードを生成する
   * @param {object} issue - Issue情報
   * @returns {Promise<object>} 生成されたコード
   */
  async generateApiCode(issue) {
    try {
      console.log('Reading project documentation...');
      // APIキーのプレフィックスを確認
      const apiKeyPrefix = this.model.anthropicApiKey.substring(0, 4);
      console.log('ANTHROPIC_API_KEY prefix:', apiKeyPrefix);

      const architectureDoc = this.readDocFile('ARCHITECTURE.md');
      const schemaDoc = this.readDocFile('SCHEMA.md');
      const controllerDoc = this.readDocFile('CONTROLLER.md');
      const databaseDoc = this.readDocFile('DATABASE_SERVICES.md');
      const testingDoc = this.readDocFile('TESTING.md');

      if (!issue || typeof issue !== 'object') {
        throw new Error('Invalid issue object');
      }

      console.log('Validating issue content...');
      const { title, content } = issue;
      if (!title || !content) {
        throw new Error(`Invalid issue format. Required fields are missing:
          title: ${title ? 'present' : 'missing'}
          content: ${content ? 'present' : 'missing'}`);
      }

      const issueInfo = {
        title,
        endpoint:
          content.match(/エンドポイント[^\n]*\n+([^\n]+)/)?.[1]?.trim() ||
          'Not specified',
        method:
          content.match(/メソッド[^\n]*\n+([^\n]+)/)?.[1]?.trim() ||
          'Not specified'
      };
      console.log('Parsed issue info:', issueInfo);

      // プロンプトテンプレートの設定
      const prompt = new PromptTemplate({
        template: `あなたはTypeScriptのエキスパートエンジニアです。
以下のプロジェクトのアーキテクチャとガイドラインに従って、APIエンドポイントを実装してください。

# プロジェクトアーキテクチャ
\${architecture}

# スキーマガイドライン
\${schema}

# コントローラーガイドライン
\${controller}

# データベースサービスガイドライン
\${database}

# テストガイドライン
\${testing}

# Issue情報
タイトル: \${title}
内容:
\${content}

以下の要件に従ってください：
1. コードは TypeScript で記述してください
2. エラーハンドリングを適切に実装してください
3. テストコードは Jest を使用してください
4. コードはクリーンアーキテクチャの原則に従ってください
5. 必要なインポート文をすべて含めてください
6. ESLintのルールに従ってください
7. パフォーマンスを考慮したPrismaクエリを実装してくだ���い
8. 適切なエラーコードとステータスコードを使用してください

以下のファイルを生成してください。各ファイルは ### ファイル名 ### で区切って出力してください。`,
        inputVariables: [
          'architecture',
          'schema',
          'controller',
          'database',
          'testing',
          'title',
          'content'
        ]
      });

      const formattedPrompt = await prompt.format({
        architecture: architectureDoc,
        schema: schemaDoc,
        controller: controllerDoc,
        database: databaseDoc,
        testing: testingDoc,
        title: issue.title,
        content: issue.content
      });

      const response = await this.model.invoke(formattedPrompt);

      console.log('LLM Response:', response);
      console.log('LLM Response Content:', response.content);

      console.log('Code generation completed');
      const files = this.parseGeneratedCode(response.content);
      console.log('Generated files:', Object.keys(files));

      return files;
    } catch (error) {
      console.error('Error in generateApiCode:', error);
      throw error;
    }
  }

  parseGeneratedCode(content) {
    console.log('Parsing generated code...');
    // ### で区切られたセクションを分割
    const sections = content
      .split(/###\s*([^#]+?)\s*###/)
      .filter(Boolean)
      .map((section) => section.trim());

    const files = {};

    // セクションを2つずつ処理（ファイル名とコンテンツのペア）
    for (let i = 0; i < sections.length; i += 2) {
      const fileName = sections[i].trim();
      const fileContent = sections[i + 1];

      if (fileName && fileContent) {
        // コードブロックのマーカーを削除
        const cleanContent = fileContent
          .replace(/^```typescript\n/, '')
          .replace(/^```\n/, '')
          .replace(/```$/, '')
          .trim();

        files[fileName] = cleanContent;
        console.log(`Parsed file: ${fileName} (${cleanContent.length} bytes)`);
      }
    }

    return files;
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
      for (const [path, content] of Object.entries(generatedFiles)) {
        if (!content || content.trim() === '') {
          console.warn(`Skipping empty file: ${path}`);
          continue;
        }

        console.log(`Creating commit for file: ${path}`);
        try {
          await this.octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: `apps/server/src/routes/app/users/${path}`,
            message: `feat: Add ${path}`,
            content: Buffer.from(content).toString('base64'),
            branch: branchName
          });
          console.log(`Successfully created/updated file: ${path}`);
        } catch (error) {
          console.error(`Error creating/updating file ${path}:`, error);
          throw error;
        }
      }

      // Create pull request with issue title and timestamp
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

// GitHub Actions から呼び出されるメイン関数
export async function main() {
  try {
    console.log('Starting main function...');

    const {
      ANTHROPIC_API_KEY,
      GITHUB_TOKEN,
      ISSUE_NUMBER,
      REPO_OWNER,
      REPO_NAME,
      ISSUE_CONTENT
    } = process.env;

    // APIキーのデバッグ情報を追加
    console.log('API Key status:', {
      exists: !!ANTHROPIC_API_KEY,
      length: ANTHROPIC_API_KEY?.length,
      prefix: ANTHROPIC_API_KEY?.substring(0, 20),
      isString: typeof ANTHROPIC_API_KEY === 'string'
    });

    console.log('Validating environment variables...');
    const missingVars = [];
    if (!ANTHROPIC_API_KEY) missingVars.push('ANTHROPIC_API_KEY');
    if (!GITHUB_TOKEN) missingVars.push('GITHUB_TOKEN');
    if (!ISSUE_NUMBER) missingVars.push('ISSUE_NUMBER');
    if (!REPO_OWNER) missingVars.push('REPO_OWNER');
    if (!REPO_NAME) missingVars.push('REPO_NAME');
    if (!ISSUE_CONTENT) missingVars.push('ISSUE_CONTENT');

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`
      );
    }

    console.log('Parsing issue content...');
    let issue;
    try {
      console.log('Raw ISSUE_CONTENT:', ISSUE_CONTENT);
      // ISSUECONTENTが二重にJSON文字列化されている可能性があるため、必要に応じて2回パースする
      let parsedContent;
      try {
        // 最初のパース
        parsedContent = JSON.parse(ISSUE_CONTENT);
        // 文字列として渡された場合は2回目のパースを試みる
        if (typeof parsedContent === 'string') {
          console.log('Content is still a string, attempting second parse');
          parsedContent = JSON.parse(parsedContent);
        }
      } catch (parseError) {
        throw new Error(`JSON parse error: ${parseError.message}`);
      }

      issue = parsedContent;
      console.log('Parsed issue:', JSON.stringify(issue, null, 2));

      // イシューの内容を検証
      if (!issue || typeof issue !== 'object') {
        throw new Error('Invalid issue format: not an object');
      }

      if (!issue.title || typeof issue.title !== 'string') {
        throw new Error('Invalid issue format: missing or invalid title');
      }

      if (!issue.content || typeof issue.content !== 'string') {
        throw new Error('Invalid issue format: missing or invalid content');
      }

      // イシューの内容をログ出力
      console.log('Issue validation passed:', {
        title: issue.title,
        contentLength: issue.content.length,
        hasMethod: issue.content.includes('メソッド'),
        hasEndpoint: issue.content.includes('エンドポイント')
      });
    } catch (error) {
      console.error('Parse error details:', {
        error: error.message,
        content: ISSUE_CONTENT,
        typeof_content: typeof ISSUE_CONTENT
      });
      throw new Error(
        `Failed to parse or validate ISSUE_CONTENT: ${error.message}\nContent: ${ISSUE_CONTENT}`
      );
    }

    console.log('Initializing API generator...');
    const generator = new ApiGenerator(
      ANTHROPIC_API_KEY,
      GITHUB_TOKEN,
      process.cwd()
    );
    console.log('ApiGenerator initialized');

    console.log('Generating API code...');
    const generatedFiles = await generator.generateApiCode(issue);
    if (!generatedFiles || Object.keys(generatedFiles).length === 0) {
      throw new Error('No files were generated');
    }
    console.log('Generated files:', Object.keys(generatedFiles));

    console.log('Creating pull request...');
    await generator.createPullRequest(
      REPO_OWNER,
      REPO_NAME,
      ISSUE_NUMBER,
      generatedFiles
    );
    console.log('Pull request created successfully');
  } catch (error) {
    console.error('Error in main function:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
