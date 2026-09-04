import { Controller, Get, Param } from '@nestjs/common';
import { BootstrapService } from './bootstrap.service.js';

@Controller()
export class BootstrapController {
  constructor(private readonly bootstrapService: BootstrapService) {}

  @Get(['bootstrap/:publicId', 'public/:publicId/bootstrap'])
  async getBootstrap(@Param('publicId') publicId: string) {
    return this.bootstrapService.getPublicBootstrap(publicId);
  }
}
