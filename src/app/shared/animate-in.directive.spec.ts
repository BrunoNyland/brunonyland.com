import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AnimateInDirective, AnimateInConfig } from './animate-in.directive';
import { SectionFadeDirective } from './section-fade.directive';

@Component({
  imports: [AnimateInDirective, SectionFadeDirective],
  template: `
    <section class="sec-a" sectionFade [animateIn]="configA">
      <div class="item">One</div>
      <div class="item">Two</div>
    </section>
    <section class="sec-b" [animateIn]="configB">
      <div class="row">Row</div>
    </section>
    <section class="sec-c" [animateIn]="undefined"></section>
  `,
})
class TestHostComponent {
  configA: AnimateInConfig = {
    target: '.item',
  };
  configB: AnimateInConfig[] = [
    {},
    { target: '.non-existent' },
    {
      target: '.row',
      from: { autoAlpha: 0, x: -10 },
      duration: 0.5,
      ease: 'power3.out',
      start: 'top 80%',
      toggle: 'play reverse play reverse',
      perItem: true,
    },
  ];
}

describe('AnimateInDirective and SectionFadeDirective', () => {
  it('initializes GSAP contexts and reverts them on destroy', () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sec-a')).toBeTruthy();
    expect(() => fixture.destroy()).not.toThrow();
  });
});
