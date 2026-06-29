import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResendVerificationEmail } from './resend-verification-email';

describe('ResendVerificationEmail', () => {
  let component: ResendVerificationEmail;
  let fixture: ComponentFixture<ResendVerificationEmail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResendVerificationEmail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResendVerificationEmail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
