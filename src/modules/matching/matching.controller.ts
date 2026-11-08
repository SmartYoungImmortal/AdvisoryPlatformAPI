import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiGetOne } from '@/common/decorators/api-docs.decorator';
import { Public } from '@/common/decorators/public.decorator';
import {
  MatchingRequestDto,
  MatchingResponseDto,
  MatchingStatusDto,
} from './matching.dto';
import { MatchingService } from './matching.service';

@ApiTags('Matching')
@Controller('matching')
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  /** Whether a model reads problems, so a screen only says "AI" when it is true. */
  @Public()
  @Get('status')
  @ApiGetOne(MatchingStatusDto, { name: 'Matching status', public: true })
  status(): MatchingStatusDto {
    return { ai: this.matching.usesModel() };
  }

  /**
   * The services that fit a problem in the person's own words. Public, like the
   * catalogue it reads: someone who does not know what to search for has not
   * necessarily made an account yet. Limited per caller, since it may ask a paid
   * model, and a POST because the problem can be private and does not belong in
   * a URL or a log line.
   */
  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiGetOne(MatchingResponseDto, { name: 'Matching result', public: true })
  match(
    @Body() dto: MatchingRequestDto,
    @Ip() ip: string,
  ): Promise<MatchingResponseDto> {
    return this.matching.match(dto, ip);
  }
}
