import { TestBed } from '@angular/core/testing';

import { NegotiationService } from './negotiation.service';

describe('NegotiationService', () => {
  let service: NegotiationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NegotiationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
