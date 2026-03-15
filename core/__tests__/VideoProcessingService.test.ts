import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoProcessingService } from '../services/VideoProcessingService';
import {
  IVideoRepository,
  IVideoProcessingStrategy,
  IVideoMergeOptions,
  IProcessingObserver,
  IProcessingEvent,
} from '../interfaces/IVideoProcessing';

function createMockRepo(): IVideoRepository {
  return {
    validate: vi.fn().mockResolvedValue(true),
    getMetadata: vi.fn().mockResolvedValue({ path: 'test.mp4', size: 1024 }),
    save: vi.fn().mockResolvedValue(undefined),
    deleteFile: vi.fn().mockResolvedValue(undefined),
  };
}

/**
 * Create a mock strategy where process() captures the onProgress callback
 * so tests can invoke it manually.
 */
function createCapturingStrategy(result = { success: true, outputPath: '/out.mp4' }) {
  let capturedOnProgress: ((output: string) => void) | undefined;

  const strategy: IVideoProcessingStrategy = {
    process: vi.fn().mockImplementation(
      async (_opts: IVideoMergeOptions, onProgress?: (output: string) => void) => {
        capturedOnProgress = onProgress;
        return result;
      }
    ),
  };

  return {
    strategy,
    getOnProgress: () => capturedOnProgress,
  };
}

describe('VideoProcessingService', () => {
  let repo: IVideoRepository;

  beforeEach(() => {
    repo = createMockRepo();
  });

  it('should reject merge with fewer than 2 videos', async () => {
    const { strategy } = createCapturingStrategy();
    const service = new VideoProcessingService(repo, strategy);
    const result = await service.mergeVideos({ inputPaths: ['a.mp4'], outputPath: 'out.mp4' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('At least 2 videos');
  });

  it('should call strategy.process on valid merge', async () => {
    const { strategy } = createCapturingStrategy();
    const service = new VideoProcessingService(repo, strategy);
    const options: IVideoMergeOptions = {
      inputPaths: ['a.mp4', 'b.mp4'],
      outputPath: 'out.mp4',
    };
    const result = await service.mergeVideos(options);
    expect(result.success).toBe(true);
    expect(strategy.process).toHaveBeenCalledTimes(1);
  });

  it('should emit started and complete events on successful merge', async () => {
    const { strategy } = createCapturingStrategy();
    const service = new VideoProcessingService(repo, strategy);
    const events: IProcessingEvent[] = [];
    const observer: IProcessingObserver = { onEvent: (e) => events.push(e) };
    service.subscribe(observer);

    await service.mergeVideos({ inputPaths: ['a.mp4', 'b.mp4'], outputPath: 'out.mp4' });

    const types = events.map((e) => e.type);
    expect(types).toContain('started');
    expect(types).toContain('complete');
  });

  it('should emit error event when strategy fails', async () => {
    const { strategy } = createCapturingStrategy({ success: false, error: 'FFmpeg crashed' } as any);
    const service = new VideoProcessingService(repo, strategy);

    const events: IProcessingEvent[] = [];
    service.subscribe({ onEvent: (e) => events.push(e) });

    const result = await service.mergeVideos({ inputPaths: ['a.mp4', 'b.mp4'], outputPath: 'out.mp4' });
    expect(result.success).toBe(false);
    expect(events.some((e) => e.type === 'error')).toBe(true);
  });

  it('should parse PROGRESS: lines and emit progress events', async () => {
    // Use a plain async function to avoid vitest mock arg handling issues
    const processCalls: any[] = [];
    const progressStrategy: IVideoProcessingStrategy = {
      async process(opts: IVideoMergeOptions, onProgress?: (output: string) => void) {
        processCalls.push({ opts, onProgress });
        if (onProgress) {
          onProgress('PROGRESS: 25');
          onProgress('PROGRESS: 75');
        }
        return { success: true, outputPath: 'out.mp4' };
      },
    };
    const service = new VideoProcessingService(repo, progressStrategy);

    const allEvents: IProcessingEvent[] = [];
    service.subscribe({ onEvent: (e) => allEvents.push(e) });

    await service.mergeVideos({ inputPaths: ['a.mp4', 'b.mp4'], outputPath: 'out.mp4' });

    const progressEvents = allEvents.filter((e) => e.type === 'progress');
    expect(progressEvents.length).toBe(2);
    expect(progressEvents[0].progress).toBe(25);
    expect(progressEvents[1].progress).toBe(75);
  });

  it('should validate videos', async () => {
    const { strategy } = createCapturingStrategy();
    const service = new VideoProcessingService(repo, strategy);
    const result = await service.validateVideos(['a.mp4', 'b.mp4']);
    expect(result).toBe(true);
    expect(repo.validate).toHaveBeenCalledTimes(2);
  });

  it('should return false if any video fails validation', async () => {
    (repo.validate as any).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const { strategy } = createCapturingStrategy();
    const service = new VideoProcessingService(repo, strategy);
    const result = await service.validateVideos(['a.mp4', 'bad.txt']);
    expect(result).toBe(false);
  });

  it('should get video info from repository', async () => {
    const { strategy } = createCapturingStrategy();
    const service = new VideoProcessingService(repo, strategy);
    const info = await service.getVideoInfo('test.mp4');
    expect(info.path).toBe('test.mp4');
    expect(repo.getMetadata).toHaveBeenCalledWith('test.mp4');
  });
});
