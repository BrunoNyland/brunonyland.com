import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { BlogService } from './blog.service';

const INDEX = {
  posts: [
    {
      slug: { pt: 'older', en: 'older-en' },
      date: '2026-01',
      featured: false,
      tag: { pt: 'Dados', en: 'Data' },
      title: { pt: 'Antigo', en: 'Older' },
      excerpt: { pt: 'ex-a', en: 'ex-a' },
    },
    {
      slug: { pt: 'newer', en: 'newer-en' },
      date: '2026-05',
      featured: true,
      tag: { pt: 'Python', en: 'Python' },
      title: { pt: 'Novo', en: 'Newer' },
      excerpt: { pt: 'ex-b', en: 'ex-b' },
    },
  ],
};

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), BlogService],
  });
  const service = TestBed.inject(BlogService);
  const http = TestBed.inject(HttpTestingController);
  return { service, http };
}

describe('BlogService', () => {
  it('loads the index sorted newest-first and exposes featured posts', () => {
    const { service, http } = setup();
    http.expectOne('/blog-content/posts.json').flush(INDEX);

    expect(service.loaded()).toBe(true);
    expect(service.posts().map((p) => p.slug.pt)).toEqual(['newer', 'older']);
    expect(service.featured().map((p) => p.slug.pt)).toEqual(['newer']);
    http.verify();
  });

  it('getPost returns null for an unknown slug', async () => {
    const { service, http } = setup();
    http.expectOne('/blog-content/posts.json').flush(INDEX);

    const post = await firstValueFrom(service.getPost('does-not-exist', 'pt'));
    expect(post).toBeNull();
  });

  it('getPost downloads and renders the markdown body', async () => {
    const { service, http } = setup();
    http.expectOne('/blog-content/posts.json').flush(INDEX);

    const promise = firstValueFrom(service.getPost('older', 'pt'));
    http.expectOne('/blog-content/older.pt.md').flush('# Hello\n\nbody text');

    const post = await promise;
    expect(post?.meta.slug.pt).toBe('older');
    expect(post?.html).toBeTruthy();
  });

  it('falls back to the PT body when the EN file is missing', async () => {
    const { service, http } = setup();
    http.expectOne('/blog-content/posts.json').flush(INDEX);

    const promise = firstValueFrom(service.getPost('older-en', 'en'));
    http.expectOne('/blog-content/older-en.en.md').error(new ProgressEvent('error'));
    http.expectOne('/blog-content/older.pt.md').flush('# PT body');

    const post = await promise;
    expect(post?.meta.slug.pt).toBe('older');
    expect(post?.html).toBeTruthy();
  });

  it('returns empty body when PT markdown fails or both EN and PT fail', async () => {
    const { service, http } = setup();
    http.expectOne('/blog-content/posts.json').flush(INDEX);

    const ptPromise = firstValueFrom(service.getPost('older', 'pt'));
    http.expectOne('/blog-content/older.pt.md').error(new ProgressEvent('error'));
    const ptPost = await ptPromise;
    expect(ptPost?.meta.slug.pt).toBe('older');

    const enPromise = firstValueFrom(service.getPost('older-en', 'en'));
    http.expectOne('/blog-content/older-en.en.md').error(new ProgressEvent('error'));
    http.expectOne('/blog-content/older.pt.md').error(new ProgressEvent('error'));
    const enPost = await enPromise;
    expect(enPost?.meta.slug.pt).toBe('older');
  });

  it('sets error and loaded when loading the index fails', () => {
    const { service, http } = setup();
    http.expectOne('/blog-content/posts.json').error(new ProgressEvent('error'));

    expect(service.error()).toBe(true);
    expect(service.loaded()).toBe(true);
    expect(service.posts()).toEqual([]);
  });
});
