import { TestBed } from '@angular/core/testing';
import { FragComponent } from './frag.component';

describe('FragComponent', () => {
  it('renders plain text, em, and outline tokens', () => {
    TestBed.configureTestingModule({
      imports: [FragComponent],
    });
    const fixture = TestBed.createComponent(FragComponent);
    fixture.componentRef.setInput('parts', ['Hello ', { em: 'world' }, { outline: 'now' }]);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Hello ');
    expect(el.querySelector('em')?.textContent).toBe('world');
    expect(el.querySelector('.outline')?.textContent).toBe('now');
  });
});
