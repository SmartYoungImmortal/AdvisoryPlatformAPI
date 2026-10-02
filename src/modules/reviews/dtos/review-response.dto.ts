import { ApiProperty } from '@nestjs/swagger';

/**
 * One row of the review list, shaped by what the review card actually renders: who wrote it,
 * which consultation it was, the stars, the body, and the Advisor's reply when there is one.
 *
 * The reviewer is named by `displayName` and `avatarKey` — their public display identity, and
 * deliberately nothing else. `fullName`, `email` and everything in the access rules' field-level
 * list stay out of this DTO on every route, including the Advisor's own.
 */
export interface ReviewRow {
  appointmentId: string;
  stars: number;
  comment: string | null;
  advisorReply: string | null;
  createdAt: Date;
  modifiedAt: Date;
  appointmentStartTime: Date;
  serviceName: string;
  serviceDurationMinutes: number;
  reviewerDisplayName: string;
  reviewerAvatarKey: string | null;
}

export class ReviewResponseDto {
  /** The appointment's id is the review's id — a consultation has at most one review. */
  @ApiProperty({ format: 'uuid' }) appointmentId: string;
  @ApiProperty({ minimum: 1, maximum: 5 }) stars: number;
  @ApiProperty({ nullable: true, type: String }) comment: string | null;
  @ApiProperty({ nullable: true, type: String }) advisorReply: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ format: 'date-time' }) modifiedAt: Date;
  @ApiProperty({ format: 'date-time' }) appointmentStartTime: Date;
  @ApiProperty() serviceName: string;
  @ApiProperty() serviceDurationMinutes: number;
  @ApiProperty() reviewerDisplayName: string;
  @ApiProperty({ nullable: true, type: String })
  reviewerAvatarKey: string | null;

  constructor(row: ReviewRow) {
    this.appointmentId = row.appointmentId;
    this.stars = row.stars;
    this.comment = row.comment;
    this.advisorReply = row.advisorReply;
    this.createdAt = row.createdAt;
    this.modifiedAt = row.modifiedAt;
    this.appointmentStartTime = row.appointmentStartTime;
    this.serviceName = row.serviceName;
    this.serviceDurationMinutes = row.serviceDurationMinutes;
    this.reviewerDisplayName = row.reviewerDisplayName;
    this.reviewerAvatarKey = row.reviewerAvatarKey;
  }
}
