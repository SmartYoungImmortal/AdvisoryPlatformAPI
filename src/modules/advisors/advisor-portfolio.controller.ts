import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import {
  ApiCreate,
  ApiGetMany,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import {
  AdvisorPortfolioService,
  MAX_PORTFOLIO_IMAGE_BYTES,
} from './advisor-portfolio.service';
import {
  CreatePortfolioItemDto,
  PortfolioItemResponseDto,
  ReorderPortfolioDto,
  UpdatePortfolioItemDto,
} from './dtos/advisor-portfolio.dto';

/**
 * The caller's own portfolio, kept from their profile editor. Like the background it belongs to
 * the Advisor profile, which exists from the application on, so the same self permissions hold it.
 *
 * Listed before `PublicAdvisorsController` in the module, so `me` is never read as an id.
 */
@ApiTags('Advisors')
@Controller('advisors/me/portfolio')
export class AdvisorPortfolioController {
  constructor(private readonly portfolio: AdvisorPortfolioService) {}

  @UserHasPermission({ permission: { advisorApplication: ['readSelf'] } })
  @Get()
  @ApiGetMany(PortfolioItemResponseDto, { name: 'Portfolio item' })
  findMine(
    @CurrentUser() user: SessionUser,
  ): Promise<PortfolioItemResponseDto[]> {
    return this.portfolio.findMine(user);
  }

  @UserHasPermission({ permission: { advisorApplication: ['updateSelf'] } })
  @Post()
  @ApiCreate(PortfolioItemResponseDto, { name: 'Portfolio item' })
  create(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreatePortfolioItemDto,
  ): Promise<PortfolioItemResponseDto> {
    return this.portfolio.create(user, dto);
  }

  /** Every piece's id in the order the profile should show them. */
  @UserHasPermission({ permission: { advisorApplication: ['updateSelf'] } })
  @Put('order')
  @ApiGetMany(PortfolioItemResponseDto, { name: 'Portfolio item' })
  reorder(
    @CurrentUser() user: SessionUser,
    @Body() dto: ReorderPortfolioDto,
  ): Promise<PortfolioItemResponseDto[]> {
    return this.portfolio.reorder(user, dto);
  }

  @UserHasPermission({ permission: { advisorApplication: ['updateSelf'] } })
  @Patch(':itemId')
  @ApiUpdate(PortfolioItemResponseDto, { name: 'Portfolio item' })
  update(
    @CurrentUser() user: SessionUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdatePortfolioItemDto,
  ): Promise<PortfolioItemResponseDto> {
    return this.portfolio.update(user, itemId, dto);
  }

  /** Takes the piece and its pictures away; answers the pieces left. */
  @UserHasPermission({ permission: { advisorApplication: ['updateSelf'] } })
  @Delete(':itemId')
  @ApiGetMany(PortfolioItemResponseDto, { name: 'Remaining portfolio item' })
  remove(
    @CurrentUser() user: SessionUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<PortfolioItemResponseDto[]> {
    return this.portfolio.remove(user, itemId);
  }

  @UserHasPermission({ permission: { advisorApplication: ['updateSelf'] } })
  @Post(':itemId/images')
  @ApiCreate(PortfolioItemResponseDto, { name: 'Portfolio item' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PORTFOLIO_IMAGE_BYTES + 1, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  uploadImage(
    @CurrentUser() user: SessionUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<PortfolioItemResponseDto> {
    return this.portfolio.uploadImage(user, itemId, file);
  }

  /** Takes one picture out by its place; the rest close up. */
  @UserHasPermission({ permission: { advisorApplication: ['updateSelf'] } })
  @Delete(':itemId/images/:index')
  @ApiUpdate(PortfolioItemResponseDto, { name: 'Portfolio item' })
  removeImage(
    @CurrentUser() user: SessionUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Param('index', ParseIntPipe) index: number,
  ): Promise<PortfolioItemResponseDto> {
    return this.portfolio.removeImage(user, itemId, index);
  }
}
