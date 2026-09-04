import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service.js';

@Injectable()
export class PublicCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic(publicId: string) {
    const slugOrId = publicId.trim().toLowerCase();
    const isMongoId = /^[a-f0-9]{24}$/i.test(slugOrId);

    const tenant = await this.prisma.tenant.findFirst({
      where: isMongoId
        ? { OR: [{ slug: slugOrId }, { id: slugOrId }], isActive: true }
        : { slug: slugOrId, isActive: true },
      select: { id: true, slug: true, name: true, vertical: true, isActive: true },
    });

    if (!tenant) throw new NotFoundException(`Comercio "${publicId}" no encontrado.`);

    const [items, categories, modifierGroups] = await Promise.all([
      this.prisma.catalogItem.findMany({
        where: { tenantId: tenant.id, isActive: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.catalogCategory.findMany({
        where: { tenantId: tenant.id, isActive: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.catalogModifierGroup.findMany({
        where: { tenantId: tenant.id, isActive: true },
        include: { options: { where: { isActive: true }, orderBy: { name: 'asc' } } },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      tenant: { publicId: tenant.slug, name: tenant.name, vertical: tenant.vertical },
      items,
      categories,
      modifierGroups,
    };
  }
}
