import { Test, TestingModule } from '@nestjs/testing';
import { OmisePaymentProvider } from './omise.service';

describe('OmiseService', () => {
  let service: OmisePaymentProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OmisePaymentProvider],
    }).compile();

    service = module.get<OmisePaymentProvider>(OmisePaymentProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
