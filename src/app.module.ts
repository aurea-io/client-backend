import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './core/prisma/prisma.module.js';
import { BootstrapModule } from './core/bootstrap/bootstrap.module.js';
import { PublicCatalogModule } from './sections/commerce/catalog/public-catalog.module.js';
import { PublicBookingsModule } from './sections/services/bookings/public-bookings.module.js';
import { PublicTablesModule } from './sections/gastronomy/tables/public-tables.module.js';
import { PublicOrdersModule } from './sections/commerce/orders/public-orders.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    BootstrapModule,
    PublicCatalogModule,
    PublicBookingsModule,
    PublicTablesModule,
    PublicOrdersModule,
  ],
})
export class AppModule {}
