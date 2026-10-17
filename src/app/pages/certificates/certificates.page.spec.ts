import { Location } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CertificatesPage } from './certificates.page';
import { Certificate } from './certificate.types';
import { ContentService } from '../../content/content.service';
import { LayoutService } from '../../core/layout.service';

const COURSES: Certificate[] = [
  {
    name: 'Curso Angular',
    nameEn: 'Angular Course',
    platform: 'Alura',
    date: '05-2026',
    workload: '20h',
    topics: ['Angular', 'TypeScript'],
    specializations: [],
    language: 'PT',
    pdf: 'angular cert.pdf',
    validationUrl: 'https://example.com/1',
  },
  {
    name: 'Python Avançado',
    nameEn: '',
    platform: 'Coursera',
    date: '12-2025',
    workload: '10h',
    topics: ['Python'],
    specializations: [],
    language: 'EN',
    pdf: 'python.pdf',
    validationUrl: 'https://example.com/2',
  },
];

describe('CertificatesPage', () => {
  it('syncs language with URL, computes statistics, and filters certificates', () => {
    const locationStub = {
      path: vi.fn().mockReturnValue('/certificates'),
      replaceState: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [CertificatesPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Location, useValue: locationStub },
      ],
    });

    const fixture = TestBed.createComponent(CertificatesPage);
    const comp = fixture.componentInstance;
    const content = TestBed.inject(ContentService);
    const layout = TestBed.inject(LayoutService);
    const http = TestBed.inject(HttpTestingController);

    http.expectOne('/certificates-content/certificates.json').flush({ courses: COURSES });
    fixture.detectChanges();

    expect(content.lang()).toBe('en');
    expect(layout.onCertificates()).toBe(true);
    expect(comp.totalCourses()).toBe(2);
    expect(comp.totalHours()).toBe(30);
    expect(comp.totalTopics()).toBe(3);
    expect(comp.maxTopicHours()).toBe(20);
    expect(comp.platforms()).toEqual(['Alura', 'Coursera']);
    expect(comp.languages()).toEqual(['EN', 'PT']);

    // Display name in EN vs fallback when nameEn is empty
    expect(comp.displayName(COURSES[0])).toBe('Angular Course');
    expect(comp.displayName(COURSES[1])).toBe('Python Avançado');
    expect(comp.pdfHref(COURSES[0])).toBe('certificates-content/angular%20cert.pdf');
    expect(comp.formatDate('05-2026')).toBe('May 2026');
    expect(comp.formatDate('invalid')).toBe('invalid');

    // Filtering
    comp.selectedPlatform.set('Alura');
    expect(comp.filtered().length).toBe(1);
    comp.selectedPlatform.set('');

    comp.selectedLanguage.set('EN');
    expect(comp.filtered().length).toBe(1);
    comp.selectedLanguage.set('');

    comp.selectedTopic.set('TypeScript');
    expect(comp.filtered().length).toBe(1);
    comp.selectedTopic.set('');

    const input = document.createElement('input');
    input.value = 'coursera';
    comp.searchTerm.set(comp.val({ target: input } as unknown as Event));
    expect(comp.filtered().length).toBe(1);

    comp.searchTerm.set('nonexistent');
    expect(comp.filtered().length).toBe(0);

    // Switching language updates URL via replaceState
    content.setLang('pt');
    TestBed.tick();
    expect(locationStub.replaceState).toHaveBeenCalledWith('/certificados');

    fixture.destroy();
    expect(layout.onCertificates()).toBe(false);
  });
});
