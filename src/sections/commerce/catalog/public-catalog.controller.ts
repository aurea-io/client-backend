import { Controller, Get, Param } from '@nestjs/common';
import { FeatureDomain } from '../../../core/decorators/feature-domain.decorator.js';
import { PublicCatalogService } from './public-catalog.service.js';

@FeatureDomain('commerce.catalog')
@Controller(['public/:publicId/commerce/catalog', 'public/:publicId/catalog'])
export class PublicCatalogController {
  constructor(private readonly catalogService: PublicCatalogService) {}

  @Get()
  getPublicCatalog(@Param('publicId') publicId: string) {
    return this.catalogService.findPublic(publicId);
  }
}
