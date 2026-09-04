import { Module } from '@nestjs/common';
import { PublicOrdersController } from './public-orders.controller.js';
import { PublicOrdersService } from './public-orders.service.js';

@Module({
  controllers: [PublicOrdersController],
  providers: [PublicOrdersService],
  exports: [PublicOrdersService],
})
export class PublicOrdersModule {}
