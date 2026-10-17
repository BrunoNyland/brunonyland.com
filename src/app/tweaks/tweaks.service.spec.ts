import { TestBed } from '@angular/core/testing';
import { TweaksService, TWEAK_DEFAULTS } from './tweaks.service';
import { StorageService } from '../core/storage.service';
import { SceneService } from '../scene/scene.service';

class FakeStorage {
  readonly store = new Map<string, string>();
  get = (key: string): string | null => this.store.get(key) ?? null;
  set = (key: string, value: string): void => void this.store.set(key, value);
}

const sceneStub: Partial<SceneService> = {
  setAccentColor: () => {},
  setBVisible: () => {},
  setParticleDensity: () => {},
};

function configure(storage: FakeStorage) {
  TestBed.configureTestingModule({
    providers: [
      { provide: StorageService, useValue: storage },
      { provide: SceneService, useValue: sceneStub },
    ],
  });
}

describe('TweaksService', () => {
  it('falls back to the default accent when nothing is stored', () => {
    configure(new FakeStorage());
    expect(TestBed.inject(TweaksService).tweaks().accent).toBe(TWEAK_DEFAULTS.accent);
  });

  it('restores the stored accent on init', () => {
    const storage = new FakeStorage();
    storage.set('accent', '#ff0066');
    configure(storage);
    expect(TestBed.inject(TweaksService).tweaks().accent).toBe('#ff0066');
  });

  it('persists the accent when changed', () => {
    const storage = new FakeStorage();
    configure(storage);
    const service = TestBed.inject(TweaksService);

    service.set('accent', '#123456');
    TestBed.tick(); // flush the persistence effect

    expect(service.tweaks().accent).toBe('#123456');
    expect(storage.get('accent')).toBe('#123456');
  });

  it('reflects the accent on the document root as a CSS variable', () => {
    configure(new FakeStorage());
    const service = TestBed.inject(TweaksService);

    service.set('accent', '#abcdef');
    TestBed.tick();

    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#abcdef');
  });

  it('patches multiple tweaks and toggles #cursor display', () => {
    const cursorEl = document.createElement('div');
    cursorEl.id = 'cursor';
    document.body.appendChild(cursorEl);

    configure(new FakeStorage());
    const service = TestBed.inject(TweaksService);

    service.patch({ cursor: false, particles: 200 });
    TestBed.tick();
    expect(service.tweaks().cursor).toBe(false);
    expect(service.tweaks().particles).toBe(200);
    expect(cursorEl.style.display).toBe('none');

    service.patch({ cursor: true });
    TestBed.tick();
    expect(cursorEl.style.display).toBe('');

    cursorEl.remove();
  });
});
