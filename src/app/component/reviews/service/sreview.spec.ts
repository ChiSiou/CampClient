import { TestBed } from '@angular/core/testing';

import { SReview } from './sreview';

describe('SReview', () => {
  let service: SReview;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SReview);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
