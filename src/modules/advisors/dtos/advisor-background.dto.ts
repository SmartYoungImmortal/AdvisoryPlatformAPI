import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';
import { languageProficiencyEnum } from '@/database/schema';

/** The proficiencies a language can be held at, strongest first. */
export const LANGUAGE_PROFICIENCIES = languageProficiencyEnum.enumValues;
export type LanguageProficiency = (typeof LANGUAGE_PROFICIENCIES)[number];

/** How many entries each list may hold; more is not a profile, it is a CV. */
export const BACKGROUND_LIST_MAX = 20;

const YEAR_MIN = 1950;
const YEAR_MAX = 2100;

/* ------------------------------------------------------------------- input */

/** A job: the role, where, from when to when (no end while it is current), and what it was. */
export class ExperienceInput {
  @ApiProperty({ maxLength: 120 })
  @Trim()
  @IsString()
  @Length(1, 120)
  title!: string;

  @ApiProperty({ maxLength: 120 })
  @Trim()
  @IsString()
  @Length(1, 120)
  organization!: string;

  @ApiProperty({ minimum: YEAR_MIN, maximum: YEAR_MAX })
  @IsInt()
  @Min(YEAR_MIN)
  @Max(YEAR_MAX)
  startYear!: number;

  @ApiProperty({ minimum: 1, maximum: 12, required: false, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  startMonth?: number | null;

  @ApiProperty({
    minimum: YEAR_MIN,
    maximum: YEAR_MAX,
    required: false,
    nullable: true,
    description: 'Left out while it is the current work.',
  })
  @IsOptional()
  @IsInt()
  @Min(YEAR_MIN)
  @Max(YEAR_MAX)
  endYear?: number | null;

  @ApiProperty({ minimum: 1, maximum: 12, required: false, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  endMonth?: number | null;

  @ApiProperty({ maxLength: 600, required: false, nullable: true })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(600)
  description?: string | null;
}

/** Where they studied, the degree and its field as one line, and the years. */
export class EducationInput {
  @ApiProperty({ maxLength: 160 })
  @Trim()
  @IsString()
  @Length(1, 160)
  institution!: string;

  @ApiProperty({ maxLength: 160, required: false, nullable: true })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  degree?: string | null;

  @ApiProperty({
    minimum: YEAR_MIN,
    maximum: YEAR_MAX,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(YEAR_MIN)
  @Max(YEAR_MAX)
  startYear?: number | null;

  @ApiProperty({
    minimum: YEAR_MIN,
    maximum: YEAR_MAX,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(YEAR_MIN)
  @Max(YEAR_MAX)
  endYear?: number | null;
}

export class LanguageInput {
  @ApiProperty({ maxLength: 60 })
  @Trim()
  @IsString()
  @Length(1, 60)
  language!: string;

  @ApiProperty({ enum: LANGUAGE_PROFICIENCIES })
  @IsIn(LANGUAGE_PROFICIENCIES)
  proficiency!: LanguageProficiency;
}

/** A licence, certificate or award: what it is, who gave it, and the year. */
export class CredentialInput {
  @ApiProperty({ maxLength: 200 })
  @Trim()
  @IsString()
  @Length(1, 200)
  title!: string;

  @ApiProperty({ maxLength: 160, required: false, nullable: true })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  issuer?: string | null;

  @ApiProperty({
    minimum: YEAR_MIN,
    maximum: YEAR_MAX,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(YEAR_MIN)
  @Max(YEAR_MAX)
  year?: number | null;
}

/**
 * `PUT /advisors/me/background`: every list whole, in the order the Advisor put it. Each replaces
 * what was there; an empty list clears it.
 */
export class ReplaceAdvisorBackgroundDto {
  @ApiProperty({ type: [ExperienceInput] })
  @IsArray()
  @ArrayMaxSize(BACKGROUND_LIST_MAX)
  @ValidateNested({ each: true })
  @Type(() => ExperienceInput)
  experiences!: ExperienceInput[];

  @ApiProperty({ type: [EducationInput] })
  @IsArray()
  @ArrayMaxSize(BACKGROUND_LIST_MAX)
  @ValidateNested({ each: true })
  @Type(() => EducationInput)
  educations!: EducationInput[];

  @ApiProperty({ type: [LanguageInput] })
  @IsArray()
  @ArrayMaxSize(BACKGROUND_LIST_MAX)
  @ValidateNested({ each: true })
  @Type(() => LanguageInput)
  languages!: LanguageInput[];

  @ApiProperty({ type: [CredentialInput] })
  @IsArray()
  @ArrayMaxSize(BACKGROUND_LIST_MAX)
  @ValidateNested({ each: true })
  @Type(() => CredentialInput)
  credentials!: CredentialInput[];
}

/* ------------------------------------------------------------------ output */

export class ExperienceResponse {
  @ApiProperty() title!: string;
  @ApiProperty() organization!: string;
  @ApiProperty() startYear!: number;
  @ApiProperty({ nullable: true, type: Number }) startMonth!: number | null;
  @ApiProperty({ nullable: true, type: Number }) endYear!: number | null;
  @ApiProperty({ nullable: true, type: Number }) endMonth!: number | null;
  @ApiProperty({ nullable: true, type: String }) description!: string | null;
}

export class EducationResponse {
  @ApiProperty() institution!: string;
  @ApiProperty({ nullable: true, type: String }) degree!: string | null;
  @ApiProperty({ nullable: true, type: Number }) startYear!: number | null;
  @ApiProperty({ nullable: true, type: Number }) endYear!: number | null;
}

export class LanguageResponse {
  @ApiProperty() language!: string;
  @ApiProperty({ enum: LANGUAGE_PROFICIENCIES })
  proficiency!: LanguageProficiency;
}

export class CredentialResponse {
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true, type: String }) issuer!: string | null;
  @ApiProperty({ nullable: true, type: Number }) year!: number | null;
}

/** An Advisor's background, each list in the Advisor's own order. */
export class AdvisorBackgroundResponseDto {
  @ApiProperty({ type: [ExperienceResponse] })
  experiences!: ExperienceResponse[];
  @ApiProperty({ type: [EducationResponse] }) educations!: EducationResponse[];
  @ApiProperty({ type: [LanguageResponse] }) languages!: LanguageResponse[];
  @ApiProperty({ type: [CredentialResponse] })
  credentials!: CredentialResponse[];
}
