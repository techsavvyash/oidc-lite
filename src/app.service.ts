import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from './prisma/prisma.service';
import { UtilsService } from './utils/utils.service';

@Injectable()
export class AppService {
  private readonly logger: Logger;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utilsService: UtilsService,
  ) {
    this.logger = new Logger(AppService.name);
  }

  async adminPanel(res: Response) {
    return res.render('admin', {
      hostname: `${process.env.FULL_URL}`,
    });
  }

  async createAdmin(data: { username: string; password: string }) {
    const count = await this.prismaService.admin.count();
    if (count > 0) {
      return {
        success: false,
        message: 'Admin exists',
      };
    }
    const admin = await this.prismaService.admin.create({
      data: {
        username: data.username,
        password: await this.utilsService.hashPassword(data.password),
      },
    });
    return {
      success: true,
      message: 'Admin created successfully',
      data: admin,
    };
  }

  async toggleKeyManager(data: {
    username: string;
    password: string;
    key: string;
  }) {
    const { username, password, key } = data;
    const admin = await this.prismaService.admin.findUnique({
      where: { username },
    });
    if (!admin) {
      return {
        success: false,
        message: 'You are not admin',
      };
    }
    if (
      (await this.utilsService.comparePasswords(password, admin.password)) ===
      false
    ) {
      return {
        success: false,
        message: 'You are not admin',
      };
    }
    const authKey = await this.prismaService.authenticationKey.findUnique({
      where: { keyValue: key },
    });
    if (!authKey) {
      return {
        success: false,
        message: 'No such key',
      };
    }
    const toggle = !authKey.keyManager;
    const updateKey = await this.prismaService.authenticationKey.update({
      where: { id: authKey.id },
      data: { keyManager: toggle },
    });
    return {
      success: true,
      message: 'Key manager value toggled',
      data: updateKey,
    };
  }
}
