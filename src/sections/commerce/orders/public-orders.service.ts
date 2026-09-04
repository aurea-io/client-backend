import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Injectable()
export class PublicOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createPublicOrder(publicId: string, dto: CreateOrderDto) {
    const slugOrId = publicId.trim().toLowerCase();
    const isMongoId = /^[a-f0-9]{24}$/i.test(slugOrId);

    const tenant = await this.prisma.tenant.findFirst({
      where: isMongoId
        ? { OR: [{ slug: slugOrId }, { id: slugOrId }], isActive: true }
        : { slug: slugOrId, isActive: true },
      select: { id: true, isActive: true },
    });

    if (!tenant || !tenant.isActive) throw new NotFoundException(`Comercio "${publicId}" no encontrado.`);

    if (!dto.lines.length) throw new BadRequestException('El pedido debe tener al menos un ítem.');

    const catalog = await this.prisma.catalogItem.findMany({
      where: {
        tenantId: tenant.id,
        id: { in: dto.lines.map((line) => line.catalogItemId) },
        isActive: true,
      },
    });

    if (catalog.length !== new Set(dto.lines.map((line) => line.catalogItemId)).size) {
      throw new BadRequestException('Uno o más ítems no están disponibles.');
    }

    const prices = new Map(catalog.map((item) => [item.id, item.priceCents]));

    const order = await this.prisma.order.create({
      data: {
        tenantId: tenant.id,
        tableId: dto.tableId,
        customerName: dto.customerName?.trim(),
        notes: [dto.customerPhone ? `Tel: ${dto.customerPhone}` : null, dto.notes?.trim()].filter(Boolean).join(' | '),
        channel: dto.channel,
        deliveryAddress: dto.deliveryAddress?.trim(),
        deliveryStatus: dto.channel === 'delivery' ? 'pending' : undefined,
        lines: {
          create: dto.lines.map((line) => ({
            catalogItemId: line.catalogItemId,
            quantity: line.quantity,
            guestName: line.guestName?.trim(),
            unitPriceCents: prices.get(line.catalogItemId)!,
          })),
        },
      },
      include: { lines: { include: { catalogItem: true } } },
    });

    return {
      orderId: order.id,
      status: order.status,
      customerName: order.customerName,
      channel: order.channel,
      createdAt: order.createdAt,
    };
  }
}
