import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { gsap } from 'gsap';
import { App } from './app';
import { routes } from './app.routes';
import { SceneService } from './scene/scene.service';
import { LayoutService } from './core/layout.service';

describe('App and routes', () => {
  const sceneStub = {
    pulse: vi.fn(),
    setScroll: vi.fn(),
    setAccentColor: vi.fn(),
    setBVisible: vi.fn(),
    setParticleDensity: vi.fn(),
    init: vi.fn(),
    destroy: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), { provide: SceneService, useValue: sceneStub }],
    });
  });

  it('resolves all lazy route loadComponent functions', async () => {
    for (const r of routes) {
      if (r.loadComponent) {
        const comp = await r.loadComponent();
        expect(comp).toBeDefined();
      }
    }
  });

  it('initializes App shell, handles navigation, language switching, menu, and mouse events', async () => {
    const origTo = gsap.to.bind(gsap);
    const toSpy = vi
      .spyOn(gsap, 'to')
      .mockImplementation((targets: gsap.TweenTarget, vars: gsap.TweenVars) => {
        vars.onComplete?.();
        return origTo(targets, { ...vars, duration: 0 });
      });

    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const layout = TestBed.inject(LayoutService);

    // Mock loader.run() so microtask completes immediately
    fixture.detectChanges();
    const loader = app.loader();
    if (loader) {
      vi.spyOn(loader, 'run').mockResolvedValue(document.createElement('div'));
    }

    await new Promise((r) => setTimeout(r, 20));
    fixture.detectChanges();

    expect(layout.appReady()).toBe(true);

    // Language switch with a hero title element present
    const heroLine = document.createElement('div');
    heroLine.className = 'hero__title';
    heroLine.innerHTML = '<span class="line"><i>Text</i></span>';
    document.body.appendChild(heroLine);
    app.setLang('en');
    await Promise.resolve();
    expect(sceneStub.pulse).toHaveBeenCalled();
    heroLine.remove();

    // Menu toggle
    app.onMenuToggle(true);
    app.onMenuToggle(false);

    // Scroll to top
    app.goTop();

    // goTo on home when target exists
    const targetSec = document.createElement('section');
    targetSec.id = 'sec-about';
    document.body.appendChild(targetSec);
    app.goTo('sec-about');
    app.goHome();

    // Navigate away and test cross-route goTo and goHome
    await router.navigateByUrl('/blog');
    fixture.detectChanges();
    app.goTo('sec-about');
    expect(layout.pendingFragment()).toBe('sec-about');

    await router.navigateByUrl('/blog');
    app.goHome();

    // Trigger mousemove, mouseover, mouseout, and resize
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 60 }));
    window.dispatchEvent(new Event('resize'));

    const link = document.createElement('a');
    document.body.appendChild(link);
    link.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(app.cursorEl().nativeElement.classList.contains('is-hover')).toBe(true);
    link.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    expect(app.cursorEl().nativeElement.classList.contains('is-hover')).toBe(false);
    link.remove();
    targetSec.remove();

    toSpy.mockRestore();
    fixture.destroy();
  });
});
