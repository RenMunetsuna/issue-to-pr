import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// プロジェクトルートのパスを取得
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(__dirname, '../../');

/**
 * ドキュメントファイルを読み込む
 * @param {string} filename - 読み込むファイル名
 * @param {string} workspaceRoot - ワークスペースのルートパス
 * @returns {string} ファイルの内容
 */
export const readDocFile = (filename, workspaceRoot) => {
  try {
    const filePath = path.join(workspaceRoot, 'docs', filename);
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.warn(`Warning: Could not read ${filename}. Error:`, error.message);
    return '';
  }
};

/**
 * 必要なドキュメントファイルをすべて読み込む
 * @param {string[]} documentFiles - 読み込むドキュメントファイルの配列
 * @returns {Object} 読み込んだドキュメントのオブジェクト
 */
export const loadAllDocuments = (documentFiles) => {
  const docsDir = path.join(WORKSPACE_ROOT, 'docs');

  return documentFiles.reduce((acc, filename) => {
    const key = filename.replace('.md', '').toLowerCase();
    acc[key] = readDocFile(filename, docsDir);
    return acc;
  }, {});
};
