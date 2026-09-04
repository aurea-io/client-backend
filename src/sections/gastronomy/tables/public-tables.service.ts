import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service.js';
import { CreateTableBookingDto } from './dto/create-table-booking.dto.js';

const tableDay = (value: string) => new Date(`${value}T00:00:00.000Z`);
const tableMinutes = (value: string) => {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
};

@Injectable()
export class PublicTablesService {
  constructor(private readonly prisma: PrismaService) {}

  async tableBookingAvailability(publicId: string, date: string, partySize: number) {
    const slugOrId = publicId.trim().toLowerCase();
    const isMongoId = /^[a-f0-9]{24}$/i.test(slugOrId);

    const tenant = await this.prisma.tenant.findFirst({
      where: isMongoId
        ? { OR: [{ slug: slugOrId }, { id: slugOrId }], isActive: true }
        : { slug: slugOrId, isActive: true },
      select: { id: true, isActive: true },
    });

    if (!tenant?.isActive) throw new NotFoundException(`Comercio "${publicId}" no encontrado.`);

    const tables = await this.prisma.restaurantTable.findMany({
      where: { tenantId: tenant.id, seats: { gte: partySize }, status: { not: 'billing' as any } },
      select: { id: true, number: true, seats: true },
    });

    const bookings = await this.prisma.tableBooking.findMany({
      where: { tenantId: tenant.id, date: tableDay(date), status: { not: 'canceled' as any } },
      select: { tableId: true, startTime: true, durationMin: true },
    });

    const slots = Array.from({ length: 19 }, (_, index) => 12 * 60 + index * 30)
      .filter((start) => {
        if (start + 120 > 23 * 60) return false;
        return tables.some((table) =>
          !bookings.some(
            (b) =>
              b.tableId === table.id &&
              start < tableMinutes(b.startTime) + b.durationMin &&
              start + 120 > tableMinutes(b.startTime)
          )
        );
      })
      .map((start) => `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`);

    return { date, partySize, tables, slots };
  }

  async createTableBooking(publicId: string, dto: CreateTableBookingDto) {
    const slugOrId = publicId.trim().toLowerCase();
    const isMongoId = /^[a-f0-9]{24}$/i.test(slugOrId);

    const tenant = await this.prisma.tenant.findFirst({
      where: isMongoId
        ? { OR: [{ slug: slugOrId }, { id: slugOrId }], isActive: true }
        : { slug: slugOrId, isActive: true },
      select: { id: true, isActive: true },
    });

    if (!tenant?.isActive) throw new NotFoundException(`Comercio "${publicId}" no encontrado.`);

    const requestedStart = tableMinutes(dto.startTime);
    const duration = dto.durationMin ?? 120;
    const requestedEnd = requestedStart + duration;

    const candidates = dto.tableId
      ? await this.prisma.restaurantTable.findMany({
          where: { id: dto.tableId, tenantId: tenant.id, seats: { gte: dto.partySize } },
        })
      : await this.prisma.restaurantTable.findMany({
          where: { tenantId: tenant.id, seats: { gte: dto.partySize }, status: { not: 'billing' as any } },
          orderBy: { number: 'asc' },
        });

    if (!candidates.length) throw new BadRequestException('No hay una mesa adecuada para esa cantidad de personas.');

    const existing = await this.prisma.tableBooking.findMany({
      where: {
        tenantId: tenant.id,
        date: tableDay(dto.date),
        status: { not: 'canceled' as any },
        tableId: { in: candidates.map((table) => table.id) },
      },
      select: { tableId: true, startTime: true, durationMin: true },
    });

    const table = candidates.find(
      (candidate) =>
        !existing.some(
          (b) =>
            b.tableId === candidate.id &&
            requestedStart < tableMinutes(b.startTime) + b.durationMin &&
            requestedEnd > tableMinutes(b.startTime)
        )
    );

    if (!table) throw new ConflictException('No hay disponibilidad para ese horario.');

    return this.prisma.tableBooking.create({
      data: {
        tenantId: tenant.id,
        tableId: table.id,
        customerName: dto.customerName.trim(),
        customerEmail: dto.customerEmail?.trim().toLowerCase(),
        customerPhone: dto.customerPhone?.trim(),
        date: tableDay(dto.date),
        startTime: dto.startTime,
        durationMin: duration,
        partySize: dto.partySize,
        notes: dto.notes?.trim(),
      },
      include: { table: true },
    });
  }
}
