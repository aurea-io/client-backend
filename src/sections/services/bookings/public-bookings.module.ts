import { Module } from '@nestjs/common';
import { PublicBookingsController } from './public-bookings.controller.js';
import { PublicBookingsService } from './public-bookings.service.js';

@Module({
  controllers: [PublicBookingsController],
  providers: [PublicBookingsService],
  exports: [PublicBookingsService],
})
export class PublicBookingsModule {}
