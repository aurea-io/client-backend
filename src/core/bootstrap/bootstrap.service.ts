import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class BootstrapService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicBootstrap(publicId: string) {
    const slugOrId = publicId.trim().toLowerCase();
    const isMongoId = /^[a-f0-9]{24}$/i.test(slugOrId);

    const tenant = await this.prisma.tenant.findFirst({
      where: isMongoId
        ? { OR: [{ slug: slugOrId }, { id: slugOrId }], isActive: true }
        : { slug: slugOrId, isActive: true },
      include: {
        features: { where: { isEnabled: true }, select: { featureKey: true } },
        entitlements: {
          where: { isActive: true },
          select: { capabilityKey: true, effect: true },
        },
      },
    });

    if (!tenant) throw new NotFoundException(`Comercio "${publicId}" no encontrado.`);

    const capabilities = tenant.entitlements
      .filter((entry) => entry.effect === 'allow')
      .map((entry) => entry.capabilityKey);

    return {
      publicId: tenant.slug,
      tenant: {
        name: tenant.name,
        vertical: tenant.vertical,
        settings: tenant.settings ?? {},
      },
      capabilities: [...new Set([...tenant.features.map((f) => f.featureKey), ...capabilities])],
    };
  }
}
