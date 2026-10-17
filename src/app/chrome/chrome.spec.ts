import { TestBed } from '@angular/core/testing';
import { gsap } from 'gsap';
import { FooterComponent } from './footer.component';
import { TotopComponent } from './totop.component';
import { LoaderComponent } from './loader.component';

describe('Chrome components', () => {
  it('renders FooterComponent with translated text', () => {
    TestBed.configureTestingModule({
      imports: [FooterComponent],
    });
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('footer.foot')).toBeTruthy();
  });

  it('renders TotopComponent and emits click event', () => {
    TestBed.configureTestingModule({
      imports: [TotopComponent],
    });
    const fixture = TestBed.createComponent(TotopComponent);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button.totop');
    expect(btn.classList.contains('is-on')).toBe(true);

    let clicked = false;
    fixture.componentInstance.click.subscribe(() => (clicked = true));
    btn.click();
    expect(clicked).toBe(true);
  });

  it('runs LoaderComponent timeline and resolves with root element', async () => {
    TestBed.configureTestingModule({
      imports: [LoaderComponent],
    });
    const fixture = TestBed.createComponent(LoaderComponent);
    fixture.detectChanges();

    const origTimeline = gsap.timeline.bind(gsap);
    const spy = vi.spyOn(gsap, 'timeline').mockImplementation((vars?: gsap.TimelineVars) => {
      const tl = origTimeline();
      queueMicrotask(() => vars?.onComplete?.());
      return tl;
    });

    const el = await fixture.componentInstance.run();
    expect(el.classList.contains('loader')).toBe(true);
    spy.mockRestore();
  });
});
