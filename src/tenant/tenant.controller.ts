import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from 'src/tenant/tenant.dto';
import { randomUUID } from 'crypto';

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post('/')
  async createATenantWithRandomUUID(@Body('data') data: CreateTenantDto) {
    const id = randomUUID();
    return await this.tenantService.createATenant(id, data);
  }
  @Get('/')
  async returnAllTenants() {
    return await this.tenantService.returnAllTenants();
  }

  @Get('/:id')
  async returnATenant(@Param('id') id: string) {
    return await this.tenantService.returnATenant(id);
  }
  @Post('/:id')
  async createATenant(
    @Param('id') id: string,
    @Body('data') data: CreateTenantDto,
  ) {
    return await this.tenantService.createATenant(id, data);
  }
  @Patch('/:id')
  async updateATenant(
    @Param('id') id: string,
    @Body('data') data: CreateTenantDto,
  ) {
    return await this.tenantService.updateATenant(id, data);
  }
  @Delete('/:id')
  async deleteATenant(@Param('id') id: string) {
    return await this.tenantService.deleteATenant(id);
  }
}
