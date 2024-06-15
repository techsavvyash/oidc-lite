import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiHeader,
  ApiBody,
  ApiResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseDto } from 'src/dto/response.dto';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from 'src/dto/tenant.dto';
import { randomUUID } from 'crypto';

@ApiTags('Tenant')
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @ApiOperation({ summary: 'Create a tenant with random UUID' })
  @ApiHeader({
    name: 'authorization',
    description: 'Authorization header',
    required: true,
  })
  @ApiBody({ type: CreateTenantDto, description: 'Tenant data to create' })
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post('/')
  async createATenantWithRandomUUID(
    @Body('data') data: CreateTenantDto,
    @Headers() headers: object,
  ) {
    const id = randomUUID();
    return await this.tenantService.createATenant(id, data, headers);
  }

  @ApiOperation({ summary: 'Get all tenants' })
  @ApiHeader({
    name: 'authorization',
    description: 'Authorization header',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Tenants found', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Get('/')
  async returnAllTenants(@Headers() headers: object) {
    return await this.tenantService.returnAllTenants(headers);
  }

  @ApiOperation({ summary: 'Get a tenant by ID' })
  @ApiParam({ name: 'id', description: 'Tenant ID', required: true })
  @ApiHeader({
    name: 'authorization',
    description: 'Authorization header',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Tenant found', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Get('/:id')
  async returnATenant(@Param('id') id: string, @Headers() headers: object) {
    return await this.tenantService.returnATenant(id, headers);
  }

  @ApiOperation({ summary: 'Create a tenant with specified ID' })
  @ApiParam({ name: 'id', description: 'Tenant ID', required: true })
  @ApiHeader({
    name: 'authorization',
    description: 'Authorization header',
    required: true,
  })
  @ApiBody({ type: CreateTenantDto, description: 'Tenant data to create' })
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post('/:id')
  async createATenant(
    @Param('id') id: string,
    @Body('data') data: CreateTenantDto,
    @Headers() headers: object,
  ) {
    return await this.tenantService.createATenant(id, data, headers);
  }

  @ApiOperation({ summary: 'Update a tenant' })
  @ApiParam({ name: 'id', description: 'Tenant ID', required: true })
  @ApiHeader({
    name: 'authorization',
    description: 'Authorization header',
    required: true,
  })
  @ApiBody({ type: CreateTenantDto, description: 'Tenant data to update' })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Patch('/:id')
  async updateATenant(
    @Param('id') id: string,
    @Body('data') data: CreateTenantDto,
    @Headers() headers: object,
  ) {
    return await this.tenantService.updateATenant(id, data, headers);
  }

  @ApiOperation({ summary: 'Delete a tenant' })
  @ApiParam({ name: 'id', description: 'Tenant ID', required: true })
  @ApiHeader({
    name: 'authorization',
    description: 'Authorization header',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant deleted successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Delete('/:id')
  async deleteATenant(@Param('id') id: string, @Headers() headers: object) {
    return await this.tenantService.deleteATenant(id, headers);
  }
}
