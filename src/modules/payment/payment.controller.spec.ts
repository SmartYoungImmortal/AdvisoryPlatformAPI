import { Test, type TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import type { CheckoutDto } from '@/modules/payment/dto/checkout.dto';
import type { SessionUser } from '@/modules/auth/auth.config';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: PaymentService;

  const mockPaymentService = {
    checkout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkout', () => {
    it('should call PaymentService.checkout and return its result', async () => {
      const mockUser = { id: 'user-123' } as SessionUser;
      const mockDto: CheckoutDto = {
        serviceId: 'e274e38f-de6f-42da-8098-b94221fd8dd9',
        startTimes: ['2023-01-01T00:00:00.000Z'],
        cardToken: 'tok_test',
      };
      const mockServiceResult = { some: 'result' };

      mockPaymentService.checkout.mockResolvedValue(mockServiceResult);

      const result = await controller.checkout(mockUser, mockDto);

      expect(service.checkout).toHaveBeenCalledTimes(1);
      expect(service.checkout).toHaveBeenCalledWith(mockUser, mockDto);
      expect(result).toEqual(mockServiceResult);
    });
  });
});
