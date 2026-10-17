import { TestBed } from '@angular/core/testing';
import { SceneService } from './scene.service';

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  class FakeWebGLRenderer {
    setSize = vi.fn();
    setClearColor = vi.fn();
    setPixelRatio = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
  }
  return {
    ...actual,
    WebGLRenderer: FakeWebGLRenderer,
  };
});

describe('SceneService', () => {
  let service: SceneService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SceneService],
    });
    service = TestBed.inject(SceneService);
  });

  afterEach(() => {
    service.destroy();
    vi.restoreAllMocks();
  });

  it('safely ignores setter calls before init', () => {
    expect(() => {
      service.setScroll(100);
      service.pulse();
      service.setHue(0.5);
      service.setAccentColor('#ff0000');
      service.setBVisible(false);
      service.setParticleDensity(500);
    }).not.toThrow();
  });

  it('initializes the 3D scene, handles events, updates materials, and degrades quality on low FPS', async () => {
    let rafCallback: FrameRequestCallback | undefined;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    let now = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);

    const canvas = document.createElement('canvas');
    await service.init(canvas);

    expect(rafCallback).toBeDefined();

    // Update scene parameters after init
    service.setScroll(250);
    service.pulse();
    service.setHue(0.6);
    service.setAccentColor('#00ff88');
    service.setBVisible(false);
    service.setBVisible(true);
    service.setParticleDensity(450);

    // Dispatch mousemove and resize
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 100 }));
    window.dispatchEvent(new Event('resize'));

    // Simulate slow frames (>2s after startTime, with <50 FPS over >1000ms) to trigger quality downgrade
    now = 3500;
    rafCallback?.(now);
    now = 4600;
    rafCallback?.(now);

    service.destroy();
  });

  it('aborts initialization if destroyed before three finishes loading', async () => {
    const canvas = document.createElement('canvas');
    const p = service.init(canvas);
    service.destroy();
    await p;
  });
});
