import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiGetOne } from '@/common/decorators/api-docs.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { AvailabilityService } from './availability.service';
import {
  AvailabilitySlotResponseDto,
  SlotQueryDto,
} from './dtos/availability.dto';

@ApiTags('Availability')
@Controller('services')
export class ServiceSlotsController {
  constructor(private readonly availability: AvailabilityService) {}

  @Public()
  @Get(':serviceId/slots')
  @ApiGetOne(AvailabilitySlotResponseDto, {
    name: 'Available slots',
    public: true,
  })
  findSlots(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Query() query: SlotQueryDto,
  ): Promise<AvailabilitySlotResponseDto[]> {
    return this.availability.findSlots(serviceId, query);
  }
}
