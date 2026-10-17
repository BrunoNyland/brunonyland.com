import { Location } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProjectsPage } from './projects.page';
import { Project } from './project.types';
import { ContentService } from '../../content/content.service';
import { LayoutService } from '../../core/layout.service';

const PROJECTS: Project[] = Array.from({ length: 8 }, (_, i) => ({
  slug: { pt: `p-${i}`, en: `p-${i}-en` },
  year: `202${i % 6}`,
  category: { pt: i % 2 === 0 ? 'Web' : 'Dados', en: i % 2 === 0 ? 'Web' : 'Data' },
  tags: i % 2 === 0 ? ['Angular'] : ['Python'],
  url: `https://example.com/${i}`,
  repo: i === 0 ? 'https://github.com/example/repo' : undefined,
  blog: i === 0 ? { pt: 'post-pt', en: 'post-en' } : undefined,
  client: i === 0 ? { pt: 'Cliente', en: 'Client' } : undefined,
  role: i === 0 ? { pt: 'Autor', en: 'Author' } : undefined,
  status: i % 2 === 0 ? 'live' : 'archived',
  image: `img ${i}.png`,
  imageAlt: { pt: 'Alt', en: 'Alt' },
  featured: i < 2,
  title: { pt: `Projeto ${i}`, en: `Project ${i}` },
  excerpt: { pt: `Resumo ${i}`, en: `Excerpt ${i}` },
  description: { pt: `Descrição ${i}`, en: `Description ${i}` },
}));

describe('ProjectsPage', () => {
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

  it('syncs language with URL, filters projects, paginates, and cleans up', () => {
    const locationStub = {
      path: vi.fn().mockReturnValue('/projects'),
      replaceState: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [ProjectsPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Location, useValue: locationStub },
      ],
    });

    const fixture = TestBed.createComponent(ProjectsPage);
    const comp = fixture.componentInstance;
    const content = TestBed.inject(ContentService);
    const layout = TestBed.inject(LayoutService);
    const http = TestBed.inject(HttpTestingController);

    http.expectOne('/projects-content/projects.json').flush({ projects: PROJECTS });
    fixture.detectChanges();

    expect(content.lang()).toBe('en');
    expect(layout.onProjects()).toBe(true);
    expect(comp.categories()).toEqual(['Data', 'Web']);
    expect(comp.tags()).toEqual(['Angular', 'Python']);
    expect(comp.visible().length).toBe(6);
    expect(comp.hasMore()).toBe(true);

    expect(comp.imageHref(PROJECTS[0])).toBe('projects-content/img%200.png');
    expect(comp.blogSlug(PROJECTS[0])).toBe('post-en');
    expect(comp.blogSlug(PROJECTS[1])).toBe('');

    // Trigger infinite scroll
    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    fixture.detectChanges();
    expect(comp.visible().length).toBe(8);

    // Filter by category, tag, and search via DOM events
    const searchEl: HTMLInputElement =
      fixture.nativeElement.querySelector('.projects-page__search');
    searchEl.value = 'Project 0';
    searchEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(comp.filtered().length).toBe(1);

    const selects = fixture.nativeElement.querySelectorAll('.projects-page__select');
    selects[0].value = 'Web';
    selects[0].dispatchEvent(new Event('change'));
    selects[1].value = 'Angular';
    selects[1].dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(comp.filtered().length).toBe(1);

    comp.onCategory('');
    comp.onTag('Python');
    comp.onSearch('');
    fixture.detectChanges();
    expect(comp.filtered().length).toBe(4);
    comp.onTag('');

    comp.onSearch('nothing-matches');
    fixture.detectChanges();
    expect(comp.filtered().length).toBe(0);

    // Switch language updates URL
    content.setLang('pt');
    fixture.detectChanges();
    TestBed.tick();
    expect(locationStub.replaceState).toHaveBeenCalledWith('/projetos');

    fixture.destroy();
    expect(layout.onProjects()).toBe(false);
  });
});
