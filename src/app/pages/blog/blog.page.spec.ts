import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BlogPage } from './blog.page';
import { BlogPostMeta } from './blog.types';

const POSTS: BlogPostMeta[] = Array.from({ length: 8 }, (_, i) => ({
  slug: { pt: `post-${i}`, en: `post-${i}-en` },
  date: `2026-0${(i % 8) + 1}`,
  featured: i === 0,
  tag: { pt: i % 2 === 0 ? 'Python' : 'Web', en: i % 2 === 0 ? 'Python' : 'Web' },
  title: { pt: `Título ${i}`, en: `Title ${i}` },
  excerpt: { pt: `Resumo ${i}`, en: `Excerpt ${i}` },
}));

describe('BlogPage', () => {
  let observerCallback: IntersectionObserverCallback | undefined;

  beforeEach(() => {
    class FakeIntersectionObserver {
      constructor(cb: IntersectionObserverCallback) {
        observerCallback = cb;
      }
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
      takeRecords = () => [];
      root = null;
      rootMargin = '';
      thresholds = [];
    }
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('filters posts by search and tag, paginates with IntersectionObserver, and cleans up', () => {
    TestBed.configureTestingModule({
      imports: [BlogPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(BlogPage);
    const comp = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);

    http.expectOne('/blog-content/posts.json').flush({ posts: POSTS });
    fixture.detectChanges();

    expect(comp.tags()).toEqual(['Python', 'Web']);
    expect(comp.filtered().length).toBe(8);
    expect(comp.visible().length).toBe(6);
    expect(comp.hasMore()).toBe(true);
    expect(comp.date('2026-05')).toBe('Mai 2026');

    // Trigger infinite scroll via IntersectionObserver
    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(comp.visible().length).toBe(8);
    expect(comp.hasMore()).toBe(false);

    // Filter by tag and search
    const input = document.createElement('input');
    input.value = 'Python';
    comp.onTag(comp.val({ target: input } as unknown as Event));
    expect(comp.filtered().length).toBe(4);

    comp.onSearch('Título 0');
    expect(comp.filtered().length).toBe(1);

    comp.onSearch('no-match-xyz');
    expect(comp.filtered().length).toBe(0);

    fixture.destroy();
  });
});
