import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('application')
export class ApplicationController {
  constructor(private readonly prismaService: PrismaService) {}
  @Get('/all')
  async allApplications() {
    return await this.prismaService.application.findMany();
  }

  @Get('/:id')
  async getAnApplication(@Param('id') id: string) {
    return await this.prismaService.application.findUnique({
      where: {
        id,
      },
    });
  }

  @Post('/new')
  async insertAnApplication(
    @Body('data') data: string,
    @Body('tenant_id') tenant_name: string,
    @Body('name') name: string,
  ) {
    const active = true;
    data = data ? data : 'configurations';
    const tenant = tenant_name
      ? await this.prismaService.tenant.findUnique({
          where: { name: tenant_name },
        })
      : null;
    if (!tenant) {
      throw new BadRequestException({
        error: 'tenant_name not given or tenant dont exist',
      });
    }
    const date = new Date().getSeconds();
    return await this.prismaService.application.create({
      data: {
        active,
        data,
        createdAt: date,
        updatedAt: date,
        name,
        accessTokenSigningKeysId: tenant.accessTokenSigningKeysId,
        idTokenSigningKeysId: tenant.idTokenSigningKeysId,
        tenantId: tenant.id,
      },
    });
  }

  @Patch('/:id')
  async updateApplication(
    @Body('data') data: string,
    @Body('tenant_id') tenant_name: string,
    @Body('name') name: string,
    @Body('active') active: boolean,
    @Param('id') id: string,
  ) {
    const tenant = tenant_name
      ? await this.prismaService.tenant.findUnique({
          where: {
            name: tenant_name,
          },
        })
      : null;
    const application = id
      ? await this.prismaService.application.findUnique({ where: { id } })
      : null;
    if (!application) {
      throw new BadRequestException({
        error: 'application_id not given or application dont exist',
      });
    }
    const tenantId = tenant ? tenant.id : application.tenantId;
    const accessTokenSigningKeysId = tenant ? tenant.accessTokenSigningKeysId: application.accessTokenSigningKeysId;
    const idTokenSigningKeysId = tenant ? tenant.idTokenSigningKeysId: application.idTokenSigningKeysId;
    data = data ? data : application.data;
    active = active ? active : application.active;
    name = name ? name: application.name;
    const date = (new Date()).getSeconds();

    return await this.prismaService.application.update({
      where: {
        id,
      },
      data: {
        data,
        tenantId,
        accessTokenSigningKeysId,
        idTokenSigningKeysId,
        name,
        active,
        updatedAt: date
      },
    });
  }
}
