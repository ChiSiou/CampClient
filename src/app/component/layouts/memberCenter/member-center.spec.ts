import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberCenter } from './member-center';

describe('MemberCenter', () => {
  let component: MemberCenter;
  let fixture: ComponentFixture<MemberCenter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberCenter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemberCenter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
