import { Controller, Post, Param, Body } from '@nestjs/common';
import { FeatureDomain } from '../../../core/decorators/feature-domain.decorator.js';
import { PublicOrdersService } from './public-orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@FeatureDomain('commerce.orders')
@Controller(['public/:publicId/commerce/orders', 'public/:publicId/orders', 'public/:publicId/restaurant/orders'])
export class PublicOrdersController {
  constructor(private readonly ordersService: PublicOrdersService) {}

  @Post()
  create(@Param('publicId') publicId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.createPublicOrder(publicId, dto);
  }
}
