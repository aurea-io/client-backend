import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { FeatureDomain } from '../../../core/decorators/feature-domain.decorator.js';
import { PublicTablesService } from './public-tables.service.js';
import { CreateTableBookingDto } from './dto/create-table-booking.dto.js';

@FeatureDomain('gastronomy.tables')
@Controller(['public/:publicId/gastronomy/tables', 'public/:publicId/tables/bookings'])
export class PublicTablesController {
  constructor(private readonly tablesService: PublicTablesService) {}

  @Get('availability')
  availability(
    @Param('publicId') publicId: string,
    @Query('date') date: string,
    @Query('partySize') partySize = '2',
  ) {
    return this.tablesService.tableBookingAvailability(publicId, date, Number(partySize) || 2);
  }

  @Post()
  create(
    @Param('publicId') publicId: string,
    @Body() dto: CreateTableBookingDto,
  ) {
    return this.tablesService.createTableBooking(publicId, dto);
  }
}
