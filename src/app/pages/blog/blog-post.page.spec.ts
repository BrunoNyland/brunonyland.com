import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  ParamMap,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { BlogPostPage } from './blog-post.page';
import { BlogService } from './blog.service';
import { ContentService } from '../../content/content.service';

describe('BlogPostPage', () => {
  it('loads post, updates SEO, and redirects when language slug differs', () => {
    const paramMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({ slug: 'meu-post' }));
    const mockPost = {
      meta: {
        slug: { pt: 'meu-post', en: 'my-post' },
        date: '2026-05',
        tag: { pt: 'Web', en: 'Web' },
        title: { pt: 'Meu Post', en: 'My Post' },
        excerpt: { pt: 'Resumo', en: 'Excerpt' },
      },
      html: '<h1>Hello</h1>',
    };
    const blogStub = {
      getPost: vi.fn().mockReturnValue(of(mockPost)),
    };

    TestBed.configureTestingModule({
      imports: [BlogPostPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        { provide: BlogService, useValue: blogStub },
      ],
    });

    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const content = TestBed.inject(ContentService);
    content.setLang('pt');

    const fixture = TestBed.createComponent(BlogPostPage);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    expect(comp.state().post?.meta.slug.pt).toBe('meu-post');
    expect(comp.date('2026-05')).toBe('Mai 2026');

    // Switching language to EN should navigate to the EN slug
    content.setLang('en');
    TestBed.tick();
    expect(navSpy).toHaveBeenCalledWith(['/blog', 'my-post'], { replaceUrl: true });
  });

  it('handles error state when getPost fails', () => {
    const paramMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({ slug: 'broken' }));
    const blogStub = {
      getPost: vi.fn().mockReturnValue(throwError(() => new Error('Network error'))),
    };

    TestBed.configureTestingModule({
      imports: [BlogPostPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        { provide: BlogService, useValue: blogStub },
      ],
    });

    const fixture = TestBed.createComponent(BlogPostPage);
    fixture.detectChanges();

    expect(fixture.componentInstance.state().error).toBe(true);
    expect(fixture.componentInstance.state().post).toBeNull();
  });
});
