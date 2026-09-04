import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

const dayStart = (value: string) => new Date(`${value}T00:00:00.000Z`);
const toMinutes = (value: string) => {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
};
const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

@Injectable()
export class PublicBookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async availability(publicId: string, date: string, catalogItemId?: string) {
    if (!isDate(date)) throw new BadRequestException('La fecha debe tener formato YYYY-MM-DD.');
    const slugOrId = publicId.trim().toLowerCase();
    const isMongoId = /^[a-f0-9]{24}$/i.test(slugOrId);

    const tenant = await this.prisma.tenant.findFirst({
      where: isMongoId
        ? { OR: [{ slug: slugOrId }, { id: slugOrId }], isActive: true }
        : { slug: slugOrId, isActive: true },
      select: { id: true, isActive: true },
    });

    if (!tenant?.isActive) throw new NotFoundException(`Comercio "${publicId}" no encontrado.`);

    const [bookings, service] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          tenantId: tenant.id,
          date: dayStart(date),
          status: { not: BookingStatus.canceled },
          ...(catalogItemId ? { catalogItemId } : {}),
        },
        select: { startTime: true, durationMin: true },
      }),
      catalogItemId
        ? this.prisma.catalogItem.findFirst({
            where: { id: catalogItemId, tenantId: tenant.id, isService: true, isActive: true },
            select: { durationMin: true },
          })
        : Promise.resolve(null),
    ]);

    const duration = service?.durationMin || 60;
    const slots = Array.from({ length: 19 }, (_, index) => 9 * 60 + index * 30)
      .filter((start) => {
        if (start + duration > 19 * 60) return false;
        return !bookings.some((booking) => {
          const bookedStart = toMinutes(booking.startTime);
          return start < bookedStart + booking.durationMin && start + duration > bookedStart;
        });
      })
      .map((start) => `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`);

    return { date, durationMin: duration, booked: bookings, slots, available: slots.length > 0 };
  }

  async createBooking(publicId: string, dto: CreateBookingDto) {
    const slugOrId = publicId.trim().toLowerCase();
    const isMongoId = /^[a-f0-9]{24}$/i.test(slugOrId);

    const tenant = await this.prisma.tenant.findFirst({
      where: isMongoId
        ? { OR: [{ slug: slugOrId }, { id: slugOrId }], isActive: true }
        : { slug: slugOrId, isActive: true },
      select: { id: true, isActive: true },
    });

    if (!tenant?.isActive) throw new NotFoundException(`Comercio "${publicId}" no encontrado.`);

    const item = await this.prisma.catalogItem.findFirst({
      where: { id: dto.catalogItemId, tenantId: tenant.id, isActive: true, isService: true },
    });
    if (!item) throw new BadRequestException('El servicio no existe o no está disponible.');

    const durationMin = dto.durationMin ?? item.durationMin ?? 60;
    const requestedStart = toMinutes(dto.startTime);
    const requestedEnd = requestedStart + durationMin;

    const existing = await this.prisma.booking.findMany({
      where: { tenantId: tenant.id, date: dayStart(dto.date), status: { not: BookingStatus.canceled } },
      select: { startTime: true, durationMin: true },
    });

    if (
      existing.some((booking) => {
        const start = toMinutes(booking.startTime);
        return requestedStart < start + booking.durationMin && requestedEnd > start;
      })
    ) {
      throw new ConflictException('El horario seleccionado ya no está disponible.');
    }

    const booking = await this.prisma.booking.create({
      data: {
        tenantId: tenant.id,
        catalogItemId: item.id,
        customerName: dto.customerName.trim(),
        customerEmail: dto.customerEmail?.trim().toLowerCase(),
        customerPhone: dto.customerPhone?.trim(),
        date: dayStart(dto.date),
        startTime: dto.startTime,
        durationMin,
        notes: dto.notes?.trim(),
      },
      include: { catalogItem: true },
    });

    return booking;
  }
}
