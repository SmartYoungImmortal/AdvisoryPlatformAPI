import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/** The text part of the multipart body; the document itself is the `file` part. */
export class SubmitSkillProofDto {
  @ApiProperty({
    format: 'uuid',
    description: 'The catalogue skill this document proves.',
  })
  @IsUUID()
  skillId!: string;
}
