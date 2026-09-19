import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetOne,
  ApiGetPaginated,
} from '@/common/decorators/api-docs.decorator';
import { Public } from '@/common/decorators/public.decorator';
import type { PaginatedResult } from '@/common/pagination/offset-pagination.dto';
import { AdvisorsService } from './advisors.service';
import { PublicAdvisorQueryDto } from './dtos/public-advisor-query.dto';
import { PublicAdvisorResponseDto } from './dtos/public-advisor-response.dto';

/**
 * Advisor discovery — the half of `advisors` a visitor may read.
 *
 * Until this existed, `advisors` had only `me` routes, so nothing could list
 * Advisors or fetch one by id. Every consumer surface that names a person needed
 * it: the home page's Advisor rail, the name beside a service in search results,
 * and the public profile a service links to.
 *
 * **Registration order matters.** `GET /advisors/:advisorId` would swallow
 * `GET /advisors/me`, so this controller is listed after `AdvisorsController` in
 * the module — the same ordering rule `app.module.ts` already applies to
 * `ReviewsModule` and its `advisors/:advisorId/reviews`.
 */
@ApiTags('Advisors')
@Controller('advisors')
export class PublicAdvisorsController {
  constructor(private readonly advisors: AdvisorsService) {}

  @Public()
  @Get()
  @ApiGetPaginated(PublicAdvisorResponseDto, {
    name: 'Discoverable advisor',
    public: true,
  })
  findMany(
    @Query() query: PublicAdvisorQueryDto,
  ): Promise<PaginatedResult<PublicAdvisorResponseDto>> {
    return this.advisors.findDiscoverable(query);
  }

  @Public()
  @Get(':advisorId')
  @ApiGetOne(PublicAdvisorResponseDto, {
    name: 'Advisor',
    public: true,
  })
  findOne(
    @Param('advisorId', ParseUUIDPipe) advisorId: string,
  ): Promise<PublicAdvisorResponseDto> {
    return this.advisors.findDiscoverableById(advisorId);
  }
}
