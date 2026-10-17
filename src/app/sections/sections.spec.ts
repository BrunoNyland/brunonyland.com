import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ContentService } from '../content/content.service';
import { HeroComponent } from './hero.component';
import { AboutComponent } from './about.component';
import { SkillsComponent } from './skills.component';
import { ContactComponent } from './contact.component';
import { EducationComponent } from './education.component';
import { ExperienceComponent } from './experience.component';
import { BlogComponent } from './blog.component';
import { WorkComponent } from './work.component';
import { Project } from '../pages/projects/project.types';

describe('Section components', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('renders HeroComponent, AboutComponent, SkillsComponent, and ContactComponent', () => {
    const hero = TestBed.createComponent(HeroComponent);
    const about = TestBed.createComponent(AboutComponent);
    const skills = TestBed.createComponent(SkillsComponent);
    const contact = TestBed.createComponent(ContactComponent);

    hero.detectChanges();
    about.detectChanges();
    skills.detectChanges();
    contact.detectChanges();

    expect(hero.nativeElement.querySelector('#sec-hero')).toBeTruthy();
    expect(about.nativeElement.querySelector('#sec-about')).toBeTruthy();
    expect(skills.nativeElement.querySelector('#sec-skills')).toBeTruthy();
    expect(contact.nativeElement.querySelector('#sec-contact')).toBeTruthy();
  });

  it('renders EducationComponent and formats hosts and padded numbers', () => {
    const fixture = TestBed.createComponent(EducationComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    expect(comp.pad(3)).toBe('03');
    expect(comp.shortHost('https://www.example.com/path')).toBe('example.com');
    expect(comp.shortHost('not-a-url')).toBe('not-a-url');
  });

  it('renders ExperienceComponent and computes durations in PT and EN', () => {
    const fixture = TestBed.createComponent(ExperienceComponent);
    const comp = fixture.componentInstance;
    const content = TestBed.inject(ContentService);
    fixture.detectChanges();

    expect(comp.pad(1)).toBe('01');
    expect(comp.formatDate('01/01/2025')).toBe('01/01/2025');
    expect(comp.formatDate('present')).toBe(comp.x().presentLabel);
    expect(comp.formatTo('present')).toBe(comp.x().presentLabel);
    expect(comp.formatTo('01/02/2025')).toBe('01/02/2025');
    expect(comp.duration('invalid', '01/02/2025')).toBe('');

    content.setLang('pt');
    expect(comp.duration('01/01/2024', '02/02/2025')).toBe('1 ano, 1 mês e 1 dia');
    expect(comp.duration('15/05/2022', '10/03/2025')).toContain('2 anos');
    expect(comp.duration('01/01/2025', '01/01/2025')).toBe('0 dias');

    content.setLang('en');
    expect(comp.duration('01/01/2024', '02/02/2025')).toBe('1 year, 1 month and 1 day');
    expect(comp.duration('01/01/2023', '03/03/2025')).toBe('2 years, 2 months and 2 days');
    expect(comp.duration('01/01/2025', '01/01/2025')).toBe('0 days');
  });

  it('renders BlogComponent in empty and featured states', () => {
    const fixture = TestBed.createComponent(BlogComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/blog-content/posts.json').flush({
      posts: [
        {
          slug: { pt: 'p1', en: 'p1-en' },
          date: '2026-05',
          featured: true,
          tag: { pt: 'Web', en: 'Web' },
          title: { pt: 'T1', en: 'T1' },
          excerpt: { pt: 'E1', en: 'E1' },
        },
      ],
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.date('2026-05')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.post').length).toBe(1);
  });

  it('renders WorkComponent, formats links, and applies card tilt effect', () => {
    const fixture = TestBed.createComponent(WorkComponent);
    const comp = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);

    const sampleProject: Project = {
      slug: { pt: 'proj', en: 'proj-en' },
      year: '2026',
      category: { pt: 'Web', en: 'Web' },
      tags: ['Angular'],
      url: 'https://example.com',
      status: 'live',
      image: 'my img.png',
      imageAlt: { pt: 'Alt', en: 'Alt' },
      featured: true,
      title: { pt: 'Title', en: 'Title' },
      excerpt: { pt: 'Ex', en: 'Ex' },
      description: { pt: 'Desc', en: 'Desc' },
    };

    http.expectOne('/projects-content/projects.json').flush({ projects: [sampleProject] });
    fixture.detectChanges();

    expect(comp.pad(2)).toBe('02');
    expect(comp.index(comp.featured()[0])).toBe(0);
    expect(comp.imgHref(sampleProject)).toBe('projects-content/my%20img.png');

    const card = document.createElement('a');
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      top: 20,
      width: 100,
      height: 200,
    } as DOMRect);

    // Tilt before cacheRect is a no-op
    comp.tilt({ currentTarget: card, clientX: 60, clientY: 120 } as unknown as MouseEvent);
    expect(card.style.getPropertyValue('--mx')).toBe('');

    comp.cacheRect({ currentTarget: card } as unknown as MouseEvent);
    comp.tilt({ currentTarget: card, clientX: 60, clientY: 120 } as unknown as MouseEvent);
    expect(card.style.getPropertyValue('--mx')).toBe('50%');
    expect(card.style.getPropertyValue('--my')).toBe('50%');
  });
});
