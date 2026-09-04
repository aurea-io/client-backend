import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { FeatureDomain } from '../../../core/decorators/feature-domain.decorator.js';
import { PublicBookingsService } from './public-bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

@FeatureDomain('services.bookings')
@Controller(['public/:publicId/services/bookings', 'public/:publicId/bookings'])
export class PublicBookingsController {
  constructor(private readonly bookingsService: PublicBookingsService) {}

  @Get('availability')
  getAvailability(
    @Param('publicId') publicId: string,
    @Query('date') date: string,
    @Query('catalogItemId') catalogItemId?: string,
  ) {
    return this.bookingsService.availability(publicId, date, catalogItemId);
  }

  @Post()
  createBooking(
    @Param('publicId') publicId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(publicId, dto);
  }
}
