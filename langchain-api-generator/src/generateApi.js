import { ChatAnthropic } from '@langchain/anthropic';
import { createApiGenerationPrompt } from './prompt/apiGenerationPrompt.js';
import { createPullRequest } from './github/PullRequestCreator.js';
import { loadAllDocuments } from './utils/documentLoader.js';
import { parseGeneratedCode } from './utils/codeParser.js';
import { validateEnvVars } from './utils/envValidator.js';

/**
 * APIコードを生成する
 * @param {object} params - パラメータ
 * @param {string} params.anthropicApiKey - Anthropic APIキー
 * @param {object} params.issue - Issue情報
 * @returns {Promise<object>} 生成されたコード
 */
const generateApiCode = async ({ anthropicApiKey, issue }) => {
  try {
    if (!issue || typeof issue !== 'object')
      throw new Error('Issueオブジェクトが無効です');

    const { title, content } = issue;
    if (!title || !content)
      throw new Error(`必須フィールドが不足しています:
        タイトル: ${title ? 'あり' : 'なし'}
        内容: ${content ? 'あり' : 'なし'}`);

    // モデルの初期化
    const model = new ChatAnthropic({
      anthropicApiKey,
      modelName: 'claude-3-sonnet-20240229'
    });

    // ドキュメントの読み込み
    const docs = loadAllDocuments([
      'ARCHITECTURE.md',
      'SCHEMA.md',
      'CONTROLLER.md',
      'DATABASE_SERVICES.md'
    ]);

    // プロンプトテンプレートの設定と実行
    const prompt = createApiGenerationPrompt();
    const formattedPrompt = await prompt.format({
      ...docs,
      title: issue.title,
      content: issue.content
    });

    const response = await model.invoke(formattedPrompt);
    const files = parseGeneratedCode(response.content);

    console.log('生成されたファイル:', Object.keys(files));
    return files;
  } catch (error) {
    console.error('APIコード生成中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * Issueの内容をパースして検証する
 * @param {string} issueContent - IssueのJSON文字列
 * @returns {object} パース済みのIssueオブジェクト
 */
const parseAndValidateIssue = (issueContent) => {
  try {
    let parsedContent;
    try {
      parsedContent = JSON.parse(issueContent);
      if (typeof parsedContent === 'string') {
        parsedContent = JSON.parse(parsedContent);
      }
    } catch (parseError) {
      throw new Error(`JSONのパースに失敗しました: ${parseError.message}`);
    }

    const issue = parsedContent;

    if (!issue || typeof issue !== 'object')
      throw new Error('Issueの形式が無効です: オブジェクトではありません');

    if (!issue.title || typeof issue.title !== 'string')
      throw new Error('Issueの形式が無効です: タイトルが不正です');

    if (!issue.content || typeof issue.content !== 'string')
      throw new Error('Issueの形式が無効です: 内容が不正です');

    return issue;
  } catch (error) {
    throw new Error(`Issueのパースと検証に失敗しました: ${error.message}`);
  }
};

// GitHub Actions から呼び出されるメイン関数
export const main = async () => {
  try {
    // 環境変数の検証
    const env = validateEnvVars([
      'ANTHROPIC_API_KEY',
      'GITHUB_TOKEN',
      'ISSUE_NUMBER',
      'REPO_OWNER',
      'REPO_NAME',
      'ISSUE_CONTENT'
    ]);

    // Issueの検証
    const issue = parseAndValidateIssue(env.ISSUE_CONTENT);

    // APIコードの生成
    const generatedFiles = await generateApiCode({
      anthropicApiKey: env.ANTHROPIC_API_KEY,
      githubToken: env.GITHUB_TOKEN,
      issue
    });

    if (!generatedFiles || Object.keys(generatedFiles).length === 0)
      throw new Error('ファイルが生成されませんでした');

    // プルリクエストの作成
    await createPullRequest({
      githubToken: env.GITHUB_TOKEN,
      owner: env.REPO_OWNER,
      repo: env.REPO_NAME,
      issueNumber: Number(env.ISSUE_NUMBER),
      files: generatedFiles
    });
    console.log('プルリクエストの作成が完了しました');
  } catch (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  }
};

main().catch((error) => {
  console.error('予期せぬエラーが発生しました:', error.message);
  process.exit(1);
});
