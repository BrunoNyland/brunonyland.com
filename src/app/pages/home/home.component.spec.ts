import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HomeComponent } from './home.component';
import { LayoutService } from '../../core/layout.service';
import { SceneService } from '../../scene/scene.service';
import { TweaksService } from '../../tweaks/tweaks.service';

describe('HomeComponent', () => {
  it('initializes scene and scroll triggers once appReady is true and cleans up on destroy', () => {
    const sceneStub = {
      init: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
      setHue: vi.fn(),
      setAccentColor: vi.fn(),
      setBVisible: vi.fn(),
      setParticleDensity: vi.fn(),
    };

    const stCallbacks: ScrollTrigger.Vars[] = [];
    const stSpy = vi.spyOn(ScrollTrigger, 'create').mockImplementation((vars) => {
      stCallbacks.push(vars);
      return {} as ScrollTrigger;
    });

    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SceneService, useValue: sceneStub },
      ],
    });

    const layout = TestBed.inject(LayoutService);
    const tweaks = TestBed.inject(TweaksService);
    const http = TestBed.inject(HttpTestingController);

    const fixture = TestBed.createComponent(HomeComponent);
    http.expectOne('/projects-content/projects.json').flush({ projects: [] });
    http.expectOne('/blog-content/posts.json').flush({ posts: [] });

    layout.appReady.set(true);
    fixture.detectChanges();
    TestBed.tick();

    expect(sceneStub.init).toHaveBeenCalled();
    expect(stCallbacks.length).toBeGreaterThan(0);

    // Invoke ScrollTrigger callbacks with lockAccent = false
    tweaks.set('lockAccent', false);
    for (const cb of stCallbacks) {
      cb.onEnter?.({} as ScrollTrigger);
      cb.onEnterBack?.({} as ScrollTrigger);
      cb.onToggle?.({ isActive: true } as ScrollTrigger);
    }
    expect(sceneStub.setHue).toHaveBeenCalled();

    stSpy.mockRestore();
    fixture.destroy();
    expect(sceneStub.destroy).toHaveBeenCalled();
  });
});
