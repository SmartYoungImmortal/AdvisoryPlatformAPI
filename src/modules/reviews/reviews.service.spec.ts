import { ConflictException, NotFoundException } from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import type { serviceAppointments, serviceReviews } from '@/database/schema';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { ReviewRow } from './dtos/review-response.dto';
import type { ReviewsRepository } from './reviews.repository';
import { REVIEW_MESSAGES } from './reviews.constants';
import { ReviewsService } from './reviews.service';

type Appointment = InferSelectModel<typeof serviceAppointments>;
type Review = InferSelectModel<typeof serviceReviews>;

const advisee = { id: '11111111-1111-1111-1111-111111111111' } as SessionUser;
const advisor = { id: '22222222-2222-2222-2222-222222222222' } as SessionUser;
const stranger = { id: '55555555-5555-5555-5555-555555555555' } as SessionUser;
const bookingId = '44444444-4444-4444-4444-444444444444';

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: bookingId,
    advisorId: advisor.id,
    adviseeId: advisee.id,
    state: 'COMPLETED',
    ...overrides,
  } as Appointment;
}

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    appointmentId: bookingId,
    stars: 5,
    comment: 'Clear and useful',
    advisorReply: null,
    createdAt: new Date('2026-09-12T00:00:00.000Z'),
    modifiedAt: new Date('2026-09-12T00:00:00.000Z'),
    ...overrides,
  };
}

function makeRow(overrides: Partial<ReviewRow> = {}): ReviewRow {
  return {
    appointmentId: bookingId,
    stars: 5,
    comment: 'Clear and useful',
    advisorReply: null,
    createdAt: new Date('2026-09-12T00:00:00.000Z'),
    modifiedAt: new Date('2026-09-12T00:00:00.000Z'),
    appointmentStartTime: new Date('2026-09-10T03:00:00.000Z'),
    serviceName: 'Thesis review',
    serviceDurationMinutes: 45,
    reviewerDisplayName: 'อารยา ส.',
    reviewerAvatarKey: null,
    ...overrides,
  };
}

describe('ReviewsService', () => {
  let service: ReviewsService;
  let repository: jest.Mocked<ReviewsRepository>;

  beforeEach(() => {
    repository = {
      findByAppointmentId: jest.fn(),
      findAppointmentForAdvisee: jest.fn(),
      findAppointmentForAdvisor: jest.fn(),
      create: jest.fn(),
      updateRating: jest.fn(),
      setAdvisorReply: jest.fn(),
      findDetailed: jest.fn(),
      findManyForAdvisor: jest.fn(),
      countForAdvisor: jest.fn(),
      countByStarsForAdvisor: jest.fn(),
      publicAdvisorExists: jest.fn(),
    } as unknown as jest.Mocked<ReviewsRepository>;
    service = new ReviewsService(repository);
  });

  describe('create', () => {
    it('writes the review and returns the joined row', async () => {
      repository.findAppointmentForAdvisee.mockResolvedValue(makeAppointment());
      repository.findByAppointmentId.mockResolvedValue(undefined);
      repository.create.mockResolvedValue(makeReview());
      repository.findDetailed.mockResolvedValue(makeRow());

      const result = await service.create(advisee, bookingId, {
        stars: 5,
        comment: 'Clear and useful',
      });

      expect(repository.create).toHaveBeenCalledWith({
        appointmentId: bookingId,
        stars: 5,
        comment: 'Clear and useful',
      });
      expect(result.reviewerDisplayName).toBe('อารยา ส.');
      expect(result.serviceDurationMinutes).toBe(45);
    });

    it('stores a missing comment as null rather than undefined', async () => {
      repository.findAppointmentForAdvisee.mockResolvedValue(makeAppointment());
      repository.findByAppointmentId.mockResolvedValue(undefined);
      repository.create.mockResolvedValue(makeReview({ comment: null }));
      repository.findDetailed.mockResolvedValue(makeRow({ comment: null }));

      await service.create(advisee, bookingId, { stars: 4 });

      expect(repository.create).toHaveBeenCalledWith({
        appointmentId: bookingId,
        stars: 4,
        comment: null,
      });
    });

    it('is a 404 when the caller is not the appointment’s advisee', async () => {
      repository.findAppointmentForAdvisee.mockResolvedValue(undefined);

      await expect(
        service.create(stranger, bookingId, { stars: 5 }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('refuses a consultation that has not completed', async () => {
      repository.findAppointmentForAdvisee.mockResolvedValue(
        makeAppointment({ state: 'BOOKED' }),
      );

      await expect(
        service.create(advisee, bookingId, { stars: 5 }),
      ).rejects.toThrow(new ConflictException(REVIEW_MESSAGES.notCompleted));
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('refuses a consultation that already carries a review', async () => {
      repository.findAppointmentForAdvisee.mockResolvedValue(makeAppointment());
      repository.findByAppointmentId.mockResolvedValue(makeReview());

      await expect(
        service.create(advisee, bookingId, { stars: 5 }),
      ).rejects.toThrow(new ConflictException(REVIEW_MESSAGES.alreadyReviewed));
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('rewrites the rating without touching the advisor reply', async () => {
      repository.findAppointmentForAdvisee.mockResolvedValue(makeAppointment());
      repository.findByAppointmentId.mockResolvedValue(makeReview());
      repository.updateRating.mockResolvedValue(makeReview({ stars: 3 }));
      repository.findDetailed.mockResolvedValue(makeRow({ stars: 3 }));

      const result = await service.update(advisee, bookingId, { stars: 3 });

      expect(repository.updateRating).toHaveBeenCalledWith(bookingId, {
        stars: 3,
        comment: null,
      });
      expect(result.stars).toBe(3);
    });

    it('is a 404 when there is no review to rewrite', async () => {
      repository.findAppointmentForAdvisee.mockResolvedValue(makeAppointment());
      repository.findByAppointmentId.mockResolvedValue(undefined);

      await expect(
        service.update(advisee, bookingId, { stars: 3 }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.updateRating).not.toHaveBeenCalled();
    });
  });

  describe('findOneForParticipant', () => {
    it.each([
      ['advisee', advisee],
      ['advisor', advisor],
    ])('returns the review to the %s', async (_role, user) => {
      repository.findAppointmentForAdvisee.mockResolvedValue(
        user === advisee ? makeAppointment() : undefined,
      );
      repository.findAppointmentForAdvisor.mockResolvedValue(
        user === advisor ? makeAppointment() : undefined,
      );
      repository.findDetailed.mockResolvedValue(makeRow());

      await expect(
        service.findOneForParticipant(user, bookingId),
      ).resolves.toMatchObject({ appointmentId: bookingId });
    });

    it('is a 404 for somebody who took no part in the consultation', async () => {
      repository.findAppointmentForAdvisee.mockResolvedValue(undefined);
      repository.findAppointmentForAdvisor.mockResolvedValue(undefined);

      await expect(
        service.findOneForParticipant(stranger, bookingId),
      ).rejects.toThrow(NotFoundException);
      expect(repository.findDetailed).not.toHaveBeenCalled();
    });
  });

  describe('reply', () => {
    it('stores the advisor reply', async () => {
      repository.findAppointmentForAdvisor.mockResolvedValue(makeAppointment());
      repository.setAdvisorReply.mockResolvedValue(
        makeReview({ advisorReply: 'Thank you' }),
      );
      repository.findDetailed.mockResolvedValue(
        makeRow({ advisorReply: 'Thank you' }),
      );

      const result = await service.reply(advisor, bookingId, {
        reply: 'Thank you',
      });

      expect(repository.setAdvisorReply).toHaveBeenCalledWith(
        bookingId,
        'Thank you',
      );
      expect(result.advisorReply).toBe('Thank you');
    });

    it('is a 404 when the caller is not the appointment’s advisor', async () => {
      repository.findAppointmentForAdvisor.mockResolvedValue(undefined);

      await expect(
        service.reply(stranger, bookingId, { reply: 'Thank you' }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.setAdvisorReply).not.toHaveBeenCalled();
    });

    it('is a 404 when the consultation carries no review yet', async () => {
      repository.findAppointmentForAdvisor.mockResolvedValue(makeAppointment());
      repository.setAdvisorReply.mockResolvedValue(undefined);

      await expect(
        service.reply(advisor, bookingId, { reply: 'Thank you' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('lists and summary', () => {
    it('pages the advisor’s own reviews', async () => {
      repository.findManyForAdvisor.mockResolvedValue([makeRow()]);
      repository.countForAdvisor.mockResolvedValue(1);

      const result = await service.findMineAsAdvisor(
        advisor,
        new OffsetPaginationDto(),
      );

      expect(repository.findManyForAdvisor).toHaveBeenCalledWith(advisor.id, {
        limit: 20,
        offset: 0,
      });
      expect(result).toMatchObject({ total: 1, page: 1, totalPages: 1 });
      expect(result.items[0].appointmentId).toBe(bookingId);
    });

    it('hides a suspended advisor from the public list', async () => {
      repository.publicAdvisorExists.mockResolvedValue(false);

      await expect(
        service.findPublicForAdvisor(advisor.id, new OffsetPaginationDto()),
      ).rejects.toThrow(NotFoundException);
      expect(repository.findManyForAdvisor).not.toHaveBeenCalled();
    });

    it('pages the public list for a visible advisor', async () => {
      repository.publicAdvisorExists.mockResolvedValue(true);
      repository.findManyForAdvisor.mockResolvedValue([]);
      repository.countForAdvisor.mockResolvedValue(0);

      await expect(
        service.findPublicForAdvisor(advisor.id, new OffsetPaginationDto()),
      ).resolves.toMatchObject({ items: [], total: 0, totalPages: 0 });
    });

    it('summarises the star distribution', async () => {
      repository.publicAdvisorExists.mockResolvedValue(true);
      repository.countByStarsForAdvisor.mockResolvedValue(
        new Map([
          [5, 8],
          [4, 2],
        ]),
      );

      const summary = await service.summaryForAdvisor(advisor.id);

      expect(summary.total).toBe(10);
      expect(summary.average).toBe(4.8);
      expect(summary.distribution).toHaveLength(5);
      expect(summary.distribution[0]).toEqual({ stars: 5, count: 8 });
      expect(summary.distribution[4]).toEqual({ stars: 1, count: 0 });
    });

    it('hides a suspended advisor from the public summary', async () => {
      repository.publicAdvisorExists.mockResolvedValue(false);

      await expect(service.summaryForAdvisor(advisor.id)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.countByStarsForAdvisor).not.toHaveBeenCalled();
    });
  });
});
