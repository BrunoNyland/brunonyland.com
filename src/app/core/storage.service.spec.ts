import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  describe('in the browser', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      });
      localStorage.clear();
    });

    it('persists and reads values', () => {
      const storage = TestBed.inject(StorageService);
      storage.set('k', 'v');
      expect(storage.get('k')).toBe('v');
    });

    it('returns null for missing keys', () => {
      expect(TestBed.inject(StorageService).get('missing')).toBeNull();
    });

    it('gracefully handles localStorage exceptions in get and set', () => {
      const storage = TestBed.inject(StorageService);
      const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(storage.get('k')).toBeNull();
      expect(() => storage.set('k', 'v')).not.toThrow();

      getSpy.mockRestore();
      setSpy.mockRestore();
    });
  });

  describe('on the server', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });
    });

    it('is a no-op and never touches localStorage', () => {
      const storage = TestBed.inject(StorageService);
      expect(() => storage.set('k', 'v')).not.toThrow();
      expect(storage.get('k')).toBeNull();
    });
  });
});
