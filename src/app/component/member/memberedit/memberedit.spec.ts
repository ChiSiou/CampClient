import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Memberedit } from './memberedit';

describe('Memberedit', () => {
  let component: Memberedit;
  let fixture: ComponentFixture<Memberedit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Memberedit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Memberedit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
