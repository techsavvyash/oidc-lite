import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { ResponseDto } from './dto/response.dto';

@Injectable()
export class AppService {
  constructor(private readonly prismaService: PrismaService) {}
  async createAdmin(data: {
    username: string;
    password: string;
  }): Promise<ResponseDto> {
    const admin = await this.prismaService.admin.findMany();
    if (admin.length > 0) {
      return {
        success: false,
        message: 'Rejected',
      };
    }
    if (!data.password || !data.username) {
      return {
        success: false,
        message: 'Rejected',
      };
    }
    const newAdmin = await this.prismaService.admin.create({
      data: {
        username: data.username,
        password: data.password,
      },
    });
    return {
      success: true,
      message:
        'Done! Remember username and password, you are not going to see them again',
      data: newAdmin,
    };
  }
}
