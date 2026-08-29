import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiCreate,
  ApiDelete,
  ApiGetOne,
  ApiGetPaginated,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { PaginatedResult } from '@/common/pagination/offset-pagination.dto';
import { CreateSkillDto } from './dtos/create-skill.dto';
import { SkillQueryDto } from './dtos/skill-query.dto';
import { SkillResponseDto } from './dtos/skill-response.dto';
import { UpdateSkillDto } from './dtos/update-skill.dto';
import { SKILL_MESSAGES } from './skills.constants';
import { SkillsService } from './skills.service';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';

@ApiTags('Skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Public()
  @Get()
  @ApiGetPaginated(SkillResponseDto, { public: true })
  findMany(
    @Query() query: SkillQueryDto,
  ): Promise<PaginatedResult<SkillResponseDto>> {
    return this.skillsService.findMany(query);
  }

  @Public()
  @Get(':id')
  @ApiGetOne(SkillResponseDto, { public: true })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SkillResponseDto> {
    return this.skillsService.findOne(id);
  }

  @UserHasPermission({
    permission: {
      skills: ['create'],
    },
  })
  @Post()
  @ResponseMessage(SKILL_MESSAGES.created)
  @ApiCreate(SkillResponseDto)
  create(@Body() dto: CreateSkillDto): Promise<SkillResponseDto> {
    return this.skillsService.create(dto);
  }

  @UserHasPermission({
    permission: {
      skills: ['update'],
    },
  })
  @Patch(':id')
  @ResponseMessage(SKILL_MESSAGES.updated)
  @ApiUpdate(SkillResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSkillDto,
  ): Promise<SkillResponseDto> {
    return this.skillsService.update(id, dto);
  }

  @UserHasPermission({
    permission: {
      skills: ['delete'],
    },
  })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(SKILL_MESSAGES.deleted)
  @ApiDelete(SkillResponseDto)
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<SkillResponseDto> {
    return this.skillsService.delete(id);
  }
}
