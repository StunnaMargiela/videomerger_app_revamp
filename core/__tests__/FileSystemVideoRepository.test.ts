/**
 * FileSystemVideoRepository tests
 *
 * Since vi.mock('fs/promises') has ESM resolution issues in this project,
 * we test the repository logic by using real temp files and directories.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { FileSystemVideoRepository } from '../repositories/FileSystemVideoRepository';
import { IAppConfig } from '../interfaces/IVideoProcessing';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const tempDir = path.join(os.tmpdir(), 'videomerger_test_' + Date.now());

const testConfig: IAppConfig = {
  pythonPath: 'python',
  pythonScriptPath: 'cli.py',
  supportedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  maxFileSizeMb: 1, // 1 MB limit for easy testing
};

describe('FileSystemVideoRepository', () => {
  let repo: FileSystemVideoRepository;

  beforeEach(() => {
    repo = new FileSystemVideoRepository(testConfig);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('validate()', () => {
    it('should return true for a valid, small video file', async () => {
      const filePath = path.join(tempDir, 'test.mp4');
      fs.writeFileSync(filePath, 'fake video content');

      const result = await repo.validate(filePath);
      expect(result).toBe(true);
    });

    it('should return false for an unsupported extension', async () => {
      const filePath = path.join(tempDir, 'document.pdf');
      fs.writeFileSync(filePath, 'fake pdf content');

      const result = await repo.validate(filePath);
      expect(result).toBe(false);
    });

    it('should return false if file exceeds max size', async () => {
      const filePath = path.join(tempDir, 'huge.mp4');
      // Write > 1 MB of data
      fs.writeFileSync(filePath, Buffer.alloc(2 * 1024 * 1024));

      const result = await repo.validate(filePath);
      expect(result).toBe(false);
    });

    it('should return false if file does not exist', async () => {
      const result = await repo.validate(path.join(tempDir, 'nonexistent.mp4'));
      expect(result).toBe(false);
    });
  });

  describe('getMetadata()', () => {
    it('should return metadata for an existing file', async () => {
      const filePath = path.join(tempDir, 'meta_test.mp4');
      fs.writeFileSync(filePath, 'sample content');

      const meta = await repo.getMetadata(filePath);
      expect(meta.path).toBe(filePath);
      expect(meta.format).toBe('mp4');
      expect(meta.size).toBeGreaterThan(0);
    });

    it('should throw for a non-existent file', async () => {
      await expect(
        repo.getMetadata(path.join(tempDir, 'ghost.mp4'))
      ).rejects.toThrow('Failed to get metadata');
    });
  });

  describe('deleteFile()', () => {
    it('should delete an existing file', async () => {
      const filePath = path.join(tempDir, 'to_delete.mp4');
      fs.writeFileSync(filePath, 'delete me');

      await repo.deleteFile(filePath);
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('should not throw when deleting a non-existent file', async () => {
      await expect(
        repo.deleteFile(path.join(tempDir, 'nope.mp4'))
      ).resolves.not.toThrow();
    });
  });
});
