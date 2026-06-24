import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnerCenter } from './owner-center';

describe('OwnerCenter', () => {
  let component: OwnerCenter;
  let fixture: ComponentFixture<OwnerCenter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerCenter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnerCenter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
