import { TestBed } from '@angular/core/testing';

import { Sforum } from './sforum';

describe('Sforum', () => {
  let service: Sforum;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sforum);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
