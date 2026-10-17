import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavComponent } from './nav.component';
import { ContentService } from '../content/content.service';
import { LayoutService } from '../core/layout.service';
import { TweaksService } from '../tweaks/tweaks.service';
import { SceneService } from '../scene/scene.service';

describe('NavComponent', () => {
  const sceneStub: Partial<SceneService> = {
    setAccentColor: () => {},
    setBVisible: () => {},
    setParticleDensity: () => {},
  };

  function setup() {
    TestBed.configureTestingModule({
      imports: [NavComponent],
      providers: [provideRouter([]), { provide: SceneService, useValue: sceneStub }],
    });
    const fixture = TestBed.createComponent(NavComponent);
    const comp = fixture.componentInstance;
    const content = TestBed.inject(ContentService);
    const layout = TestBed.inject(LayoutService);
    const tweaks = TestBed.inject(TweaksService);
    fixture.detectChanges();
    return { fixture, comp, content, layout, tweaks };
  }

  it('computes localized paths and active section based on layout and language', () => {
    const { comp, content, layout } = setup();
    content.setLang('pt');
    expect(comp.certsPath()).toBe('/certificados');
    expect(comp.projectsPath()).toBe('/projetos');
    expect(comp.active()).toBe('sec-hero');

    content.setLang('en');
    expect(comp.certsPath()).toBe('/certificates');
    expect(comp.projectsPath()).toBe('/projects');

    layout.onCertificates.set(true);
    expect(comp.active()).toBe('');
    layout.onCertificates.set(false);
    layout.onProjects.set(true);
    expect(comp.active()).toBe('');
  });

  it('emits navigate, home, langChange, and menuOpenChange events', () => {
    const { comp } = setup();
    const navigated: string[] = [];
    let homeCount = 0;
    const langs: string[] = [];
    const menuStates: boolean[] = [];

    comp.navigate.subscribe((id) => navigated.push(id));
    comp.home.subscribe(() => homeCount++);
    comp.langChange.subscribe((l) => langs.push(l));
    comp.menuOpenChange.subscribe((open) => menuStates.push(open));

    const ev = new MouseEvent('click', { cancelable: true });
    comp.scrollTo(ev, 'sec-about');
    expect(ev.defaultPrevented).toBe(true);
    expect(navigated).toEqual(['sec-about']);

    // Close when already closed is a no-op
    comp.closeMenu();
    expect(menuStates).toEqual([]);

    comp.toggleMenu();
    expect(comp.menuOpen()).toBe(true);
    expect(menuStates).toEqual([true]);

    comp.goSection(new MouseEvent('click'), 'sec-xp');
    expect(comp.menuOpen()).toBe(false);
    expect(navigated).toEqual(['sec-about', 'sec-xp']);

    comp.toggleMenu();
    comp.goHome(new MouseEvent('click'));
    expect(comp.menuOpen()).toBe(false);
    expect(homeCount).toBe(1);

    comp.setLang('en');
    expect(langs).toEqual(['en']);
  });

  it('handles accent color picker open/pick/outside click and window resize', () => {
    const { fixture, comp, tweaks } = setup();

    comp.onDocumentClick(new MouseEvent('click'));
    expect(comp.open()).toBe(false);

    comp.toggleOpen(new MouseEvent('click'));
    expect(comp.open()).toBe(true);
    fixture.detectChanges();

    // Clicking outside picker closes it
    comp.onDocumentClick({ target: document.body } as unknown as MouseEvent);
    expect(comp.open()).toBe(false);

    comp.toggleOpen(new MouseEvent('click'));
    fixture.detectChanges();
    const dot = fixture.nativeElement.querySelector('.accent-picker__dot') as HTMLButtonElement;
    dot?.click();
    expect(comp.open()).toBe(false);

    comp.pick('#ff5b3a');
    expect(tweaks.tweaks().accent).toBe('#ff5b3a');

    // Click desktop and mobile nav links via DOM
    const navLinks = fixture.nativeElement.querySelectorAll('.nav__menu a[href^="#"]');
    navLinks.forEach((a: HTMLElement) => a.click());
    const mobileLinks = fixture.nativeElement.querySelectorAll('.mobile-menu__nav a[href^="#"]');
    mobileLinks.forEach((a: HTMLElement) => a.click());
    const langBtns = fixture.nativeElement.querySelectorAll('.lang button');
    langBtns.forEach((b: HTMLElement) => b.click());
    (fixture.nativeElement.querySelector('.nav__brand') as HTMLElement)?.click();
    (fixture.nativeElement.querySelector('.nav__burger') as HTMLElement)?.click();

    // Resize closes mobile menu on desktop width
    if (!comp.menuOpen()) comp.toggleMenu();
    expect(comp.menuOpen()).toBe(true);
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    comp.onResize();
    expect(comp.menuOpen()).toBe(false);
  });
});
