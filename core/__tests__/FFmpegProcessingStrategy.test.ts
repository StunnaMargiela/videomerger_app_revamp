import { describe, it, expect, vi } from 'vitest';
import { FFmpegProcessingStrategy } from '../strategies/VideoProcessingStrategies';
import { IFFmpegAdapter, IVideoMergeOptions } from '../interfaces/IVideoProcessing';

function createMockAdapter(): IFFmpegAdapter {
  return {
    isAvailable: vi.fn().mockResolvedValue(true),
    getVersion: vi.fn().mockResolvedValue('ffmpeg 6.0'),
    execute: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
    mergeVideos: vi.fn().mockResolvedValue({ success: true, outputPath: '/out.mp4' }),
  };
}

describe('FFmpegProcessingStrategy', () => {
  it('should delegate process() to adapter.mergeVideos()', async () => {
    const adapter = createMockAdapter();
    const strategy = new FFmpegProcessingStrategy(adapter);
    const options: IVideoMergeOptions = {
      inputPaths: ['a.mp4', 'b.mp4'],
      outputPath: 'out.mp4',
    };
    const onProgress = vi.fn();

    const result = await strategy.process(options, onProgress);

    expect(adapter.mergeVideos).toHaveBeenCalledTimes(1);
    expect((adapter.mergeVideos as any).mock.calls[0][0]).toEqual(options);
    expect(result.success).toBe(true);
  });

  it('should propagate adapter errors', async () => {
    const adapter = createMockAdapter();
    (adapter.mergeVideos as any).mockResolvedValue({ success: false, error: 'codec error' });
    const strategy = new FFmpegProcessingStrategy(adapter);

    const result = await strategy.process({
      inputPaths: ['a.mp4', 'b.mp4'],
      outputPath: 'out.mp4',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('codec error');
  });
});
