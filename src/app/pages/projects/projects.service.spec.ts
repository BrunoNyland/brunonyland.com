import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProjectsService } from './projects.service';
import { ProjectsIndexFile } from './project.types';

const INDEX: ProjectsIndexFile = {
  projects: [
    {
      slug: { pt: 'p-old', en: 'p-old-en' },
      year: '2024',
      category: { pt: 'Web', en: 'Web' },
      tags: ['Angular'],
      url: 'https://example.com/old',
      status: 'archived',
      image: 'old.png',
      imageAlt: { pt: 'Alt PT', en: 'Alt EN' },
      featured: false,
      title: { pt: 'Antigo', en: 'Old' },
      excerpt: { pt: 'Resumo A', en: 'Excerpt A' },
      description: { pt: 'Desc A', en: 'Desc A' },
    },
    {
      slug: { pt: 'p-new', en: 'p-new-en' },
      year: '2026',
      category: { pt: 'Dados', en: 'Data' },
      tags: ['Python'],
      url: 'https://example.com/new',
      status: 'live',
      image: 'new.png',
      imageAlt: { pt: 'Alt PT', en: 'Alt EN' },
      featured: true,
      title: { pt: 'Novo', en: 'New' },
      excerpt: { pt: 'Resumo B', en: 'Excerpt B' },
      description: { pt: 'Desc B', en: 'Desc B' },
    },
  ],
};

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), ProjectsService],
  });
  const service = TestBed.inject(ProjectsService);
  const http = TestBed.inject(HttpTestingController);
  return { service, http };
}

describe('ProjectsService', () => {
  it('loads projects sorted newest-first and exposes featured projects', () => {
    const { service, http } = setup();
    http.expectOne('/projects-content/projects.json').flush(INDEX);

    expect(service.loaded()).toBe(true);
    expect(service.error()).toBe(false);
    expect(service.projects().map((p) => p.slug.pt)).toEqual(['p-new', 'p-old']);
    expect(service.featured().map((p) => p.slug.pt)).toEqual(['p-new']);
    http.verify();
  });

  it('treats missing projects array as empty', () => {
    const { service, http } = setup();
    http.expectOne('/projects-content/projects.json').flush({});

    expect(service.loaded()).toBe(true);
    expect(service.error()).toBe(false);
    expect(service.projects()).toEqual([]);
    http.verify();
  });

  it('sets error and loaded when request fails', () => {
    const { service, http } = setup();
    http.expectOne('/projects-content/projects.json').error(new ProgressEvent('error'));

    expect(service.loaded()).toBe(true);
    expect(service.error()).toBe(true);
    expect(service.projects()).toEqual([]);
    http.verify();
  });
});
