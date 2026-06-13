import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderWMenu } from './header-w-menu';

describe('HeaderWMenu', () => {
  let component: HeaderWMenu;
  let fixture: ComponentFixture<HeaderWMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderWMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderWMenu);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
