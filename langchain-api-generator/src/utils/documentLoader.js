import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(__dirname, '../../');

/**
 * ドキュメントファイルを読み込む
 * @param {string} filename - 読み込むファイル名
 * @returns {string} ファイルの内容
 */
export const readDocFile = (filename) => {
  try {
    const filePath = path.join(WORKSPACE_ROOT, 'docs', filename);
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.warn(
      `ドキュメントファイル ${filename} の読み込みに失敗しました: ${error.message}`
    );
    return '';
  }
};

/**
 * 必要なドキュメントファイルをすべて読み込む
 * @param {string[]} documentFiles - 読み込むドキュメントファイルの配列
 * @returns {Object} 読み込んだドキュメントのオブジェクト
 */
export const loadAllDocuments = (documentFiles) => {
  return documentFiles.reduce((acc, filename) => {
    const key = filename.replace('.md', '').toLowerCase();
    acc[key] = readDocFile(filename);
    return acc;
  }, {});
};
