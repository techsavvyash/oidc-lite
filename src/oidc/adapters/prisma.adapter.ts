import { Adapter, AdapterPayload } from 'oidc-provider';
import { PrismaService } from '../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { expiresAt, types } from '../oidc.adapter';

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
    // console.log(this.modelName);
    const data = {
      type: types[this.modelName],
      payload: JSON.stringify(payload),
      grantId: payload.grantId,
      userCode: payload.userCode,
      uid: payload.uid,
      expiresAt: expiresAt(expiresIn),
    };
    await this.prisma.oidcModel.upsert({
      where: { id_type: { id, type: types[this.modelName] } },
      update: {
        ...data,
      },
      create: {
        id,
        ...data,
      },
    });
  }

  async find(id: string): Promise<void | AdapterPayload> {
    let result = await this.prisma.oidcModel.findUnique({
      where: { id },
    });
    result = { ...result, ...JSON.parse(result.payload) };
    console.log(result);
    return result || undefined;
  }

  async findByUserCode(userCode: string): Promise<void | AdapterPayload> {
    let result = await this.prisma.oidcModel.findFirst({
      where: { userCode },
    });
    result = { ...result, ...JSON.parse(result.payload) };
    return result || undefined;
  }

  async findByUid(uid: string): Promise<void | AdapterPayload> {
    let result = await this.prisma.oidcModel.findFirst({
      where: { uid },
    });
    result = { ...result, ...JSON.parse(result.payload) };
    return result || undefined;
  }

  async consume(id: string): Promise<void> {
    await this.prisma.oidcModel.update({
      where: { id },
      data: { consumed: true },
    });
  }

  async destroy(id: string): Promise<void> {
    await this.prisma.oidcModel.delete({
      where: { id },
    });
  }

  async revokeByGrantId(grantId: string): Promise<void> {
    await this.prisma.oidcModel.deleteMany({
      where: { grantId },
    });
  }
}
