import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnerProfile } from './owner-profile';

describe('OwnerProfile', () => {
  let component: OwnerProfile;
  let fixture: ComponentFixture<OwnerProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnerProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
