import { readFileSync } from 'fs';
import path from 'path';
import { readDocFile, loadDocuments } from '../documentLoader';

// モックの設定
jest.mock('fs');
const mockReadFileSync = readFileSync as jest.MockedFunction<
  typeof readFileSync
>;

interface MockFiles {
  [key: string]: string;
}

describe('documentLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('readDocFile', () => {
    it('正常にファイルを読み込めること', () => {
      const mockContent = '# Test Document\nThis is a test';
      mockReadFileSync.mockReturnValue(mockContent);

      const result = readDocFile('test.md');

      expect(result).toBe(mockContent);
      expect(mockReadFileSync).toHaveBeenCalledTimes(1);
      expect(mockReadFileSync).toHaveBeenCalledWith(
        expect.stringContaining(path.join('docs', 'test.md')),
        'utf-8'
      );
    });

    it('ファイルが存在しない場合は空文字を返すこと', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      const result = readDocFile('nonexistent.md');

      expect(result).toBe('');
      expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadDocuments', () => {
    it('複数のドキュメントを読み込めること', () => {
      const mockFiles: MockFiles = {
        'doc1.md': '# Document 1',
        'doc2.md': '# Document 2'
      };

      mockReadFileSync.mockImplementation((filePath) => {
        const fileName = path.basename(filePath.toString());
        return mockFiles[fileName] || '';
      });

      const result = loadDocuments(['doc1.md', 'doc2.md']);

      expect(result).toEqual({
        doc1: '# Document 1',
        doc2: '# Document 2'
      });
      expect(mockReadFileSync).toHaveBeenCalledTimes(2);
    });

    it('一部のファイルが存在しない場合でも処理を継続すること', () => {
      mockReadFileSync
        .mockReturnValueOnce('# Existing Document')
        .mockImplementationOnce(() => {
          throw new Error('ENOENT');
        });

      const result = loadDocuments(['existing.md', 'nonexistent.md']);

      expect(result).toEqual({
        existing: '# Existing Document',
        nonexistent: ''
      });
      expect(mockReadFileSync).toHaveBeenCalledTimes(2);
    });
  });
});
