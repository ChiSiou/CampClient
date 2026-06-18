import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnerRegister } from './owner-register';

describe('OwnerRegister', () => {
  let component: OwnerRegister;
  let fixture: ComponentFixture<OwnerRegister>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerRegister]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnerRegister);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
