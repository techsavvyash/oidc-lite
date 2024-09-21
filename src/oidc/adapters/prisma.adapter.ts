import { Adapter, AdapterPayload } from 'oidc-provider';
import { PrismaService } from '../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaAdapter implements Adapter {
  constructor(
    private readonly prisma: PrismaService,
    private readonly modelName: string,
  ) {}

  async upsert(
    id: string,
    payload: AdapterPayload,
    expiresIn: number,
  ): Promise<void> {
    await this.prisma[this.modelName].upsert({
      where: { id },
      update: {
        ...payload,
        expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
      },
      create: {
        id,
        ...payload,
        expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
      },
    });
  }

  async find(id: string): Promise<void | AdapterPayload> {
    const result = await this.prisma[this.modelName].findUnique({
      where: { id },
    });
    return result || undefined;
  }

  async findByUserCode(userCode: string): Promise<void | AdapterPayload> {
    const result = await this.prisma[this.modelName].findFirst({
      where: { userCode },
    });
    return result || undefined;
  }

  async findByUid(uid: string): Promise<void | AdapterPayload> {
    const result = await this.prisma[this.modelName].findFirst({
      where: { uid },
    });
    return result || undefined;
  }

  async consume(id: string): Promise<void> {
    await this.prisma[this.modelName].update({
      where: { id },
      data: { consumed: true },
    });
  }

  async destroy(id: string): Promise<void> {
    await this.prisma[this.modelName].delete({
      where: { id },
    });
  }

  async revokeByGrantId(grantId: string): Promise<void> {
    await this.prisma[this.modelName].deleteMany({
      where: { grantId },
    });
  }
}
