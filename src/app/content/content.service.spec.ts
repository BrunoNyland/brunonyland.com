import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContentService } from './content.service';
import { StorageService } from '../core/storage.service';

class FakeStorage {
  readonly store = new Map<string, string>();
  get = (key: string): string | null => this.store.get(key) ?? null;
  set = (key: string, value: string): void => void this.store.set(key, value);
}

function configure(storage: FakeStorage) {
  TestBed.configureTestingModule({
    providers: [{ provide: StorageService, useValue: storage }],
  });
}

describe('ContentService', () => {
  it('defaults to "pt" when nothing is stored', () => {
    configure(new FakeStorage());
    expect(TestBed.inject(ContentService).lang()).toBe('pt');
  });

  it('restores the stored language on init', () => {
    const storage = new FakeStorage();
    storage.set('lang', 'en');
    configure(storage);
    expect(TestBed.inject(ContentService).lang()).toBe('en');
  });

  it('ignores an invalid stored value', () => {
    const storage = new FakeStorage();
    storage.set('lang', 'fr');
    configure(storage);
    expect(TestBed.inject(ContentService).lang()).toBe('pt');
  });

  it('persists and reflects the language on the document when set', () => {
    const storage = new FakeStorage();
    configure(storage);
    const service = TestBed.inject(ContentService);

    service.setLang('en');

    expect(service.lang()).toBe('en');
    expect(storage.get('lang')).toBe('en');
    expect(TestBed.inject(DOCUMENT).documentElement.lang).toBe('en');
  });

  it('toggles between languages and updates dict()', () => {
    configure(new FakeStorage());
    const service = TestBed.inject(ContentService);
    expect(service.dict().nav.about).toBe('Sobre');
    service.toggleLang();
    expect(service.lang()).toBe('en');
    expect(service.dict().nav.about).toBe('About');
    service.toggleLang();
    expect(service.lang()).toBe('pt');
  });
});
