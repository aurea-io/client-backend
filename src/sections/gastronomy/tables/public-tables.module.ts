import { Module } from '@nestjs/common';
import { PublicTablesController } from './public-tables.controller.js';
import { PublicTablesService } from './public-tables.service.js';

@Module({
  controllers: [PublicTablesController],
  providers: [PublicTablesService],
  exports: [PublicTablesService],
})
export class PublicTablesModule {}
