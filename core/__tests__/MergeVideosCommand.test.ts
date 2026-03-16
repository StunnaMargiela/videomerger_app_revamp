import { describe, it, expect, vi } from 'vitest';
import { MergeVideosCommand } from '../commands/MergeVideosCommand';
import { IFFmpegAdapter, IVideoRepository, IVideoMergeOptions } from '../interfaces/IVideoProcessing';

function createMockAdapter(available = true): IFFmpegAdapter {
  return {
    isAvailable: vi.fn().mockResolvedValue(available),
    getVersion: vi.fn().mockResolvedValue('6.0'),
    execute: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
    mergeVideos: vi.fn().mockResolvedValue({ success: true, outputPath: '/out.mp4' }),
  };
}

function createMockRepo(valid = true): IVideoRepository {
  return {
    validate: vi.fn().mockResolvedValue(valid),
    getMetadata: vi.fn().mockResolvedValue({ path: 'test.mp4', size: 1024 }),
    save: vi.fn().mockResolvedValue(undefined),
    deleteFile: vi.fn().mockResolvedValue(undefined),
  };
}

describe('MergeVideosCommand', () => {
  const options: IVideoMergeOptions = {
    inputPaths: ['a.mp4', 'b.mp4'],
    outputPath: 'out.mp4',
  };

  it('should validate inputs, check FFmpeg, and merge', async () => {
    const adapter = createMockAdapter();
    const repo = createMockRepo();
    const cmd = new MergeVideosCommand(options, adapter, repo);

    const result = await cmd.execute();

    expect(repo.validate).toHaveBeenCalledTimes(2);
    expect(adapter.isAvailable).toHaveBeenCalledTimes(1);
    expect(adapter.mergeVideos).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });

  it('should fail if a video is invalid', async () => {
    const repo = createMockRepo(false);
    const cmd = new MergeVideosCommand(options, createMockAdapter(), repo);

    const result = await cmd.execute();
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid video file');
  });

  it('should fail if FFmpeg is not available', async () => {
    const adapter = createMockAdapter(false);
    const cmd = new MergeVideosCommand(options, adapter, createMockRepo());

    const result = await cmd.execute();
    expect(result.success).toBe(false);
    expect(result.error).toContain('FFmpeg is not available');
  });

  it('should delete output file on merge failure', async () => {
    const adapter = createMockAdapter();
    (adapter.mergeVideos as any).mockResolvedValue({ success: false, error: 'fail' });
    const repo = createMockRepo();
    const cmd = new MergeVideosCommand(options, adapter, repo);

    const result = await cmd.execute();
    expect(result.success).toBe(false);
    expect(repo.deleteFile).toHaveBeenCalledWith('out.mp4');
  });
});
