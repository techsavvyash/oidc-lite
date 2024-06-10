import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Delete,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import {
  CreateApplicationDto,
  RoleDto,
  ScopeDto,
  UpdateApplicationDto,
} from 'src/application/application.dto';
import { randomUUID } from 'crypto';
import { ApplicationRolesService } from './application-roles/application-roles.service';
import { ApplicationScopesService } from './application-scopes/application-scopes.service';

@Controller('application')
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly applicationRoleService: ApplicationRolesService,
    private readonly applicationScopeService: ApplicationScopesService,
  ) {}

  @Get('/')
  async allApplications() {
    return await this.applicationService.returnAllApplications();
  }
  @Post('/')
  async createAnApplicationWithRandomUUID(
    @Body('data') data: CreateApplicationDto,
  ) {
    const uuid = randomUUID();
    return await this.applicationService.createApplication(uuid, data);
  }

  @Get('/:id')
  async getAnApplication(@Param('id') id: string) {
    return await this.applicationService.returnAnApplication(id);
  }
  @Post('/:id')
  async createAnApplication(
    @Body('data') data: CreateApplicationDto,
    @Param('id') id: string,
  ) {
    return await this.applicationService.createApplication(id, data);
  }
  @Patch('/:id')
  async updateApplication(
    @Param('id') id: string,
    @Body('data') data: UpdateApplicationDto,
  ) {
    return await this.applicationService.patchApplication(id, data);
  }
  @Delete('/:id')
  async deleteApplication(
    @Param('id') id: string,
    @Query('hardDelete') hardDelete: boolean,
  ) {
    return await this.applicationService.deleteApplication(id, hardDelete);
  }

  @Post('/:id/role')
  async createRoleWithRandomUUID(
    @Param('id') id: string,
    @Body('data') data: RoleDto,
  ) {
    return await this.applicationRoleService.createRole(data, id);
  }
  @Post('/:id/role/:roleId')
  async createRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Body('data') data: RoleDto,
  ) {
    return await this.applicationRoleService.createRole(data, id, roleId);
  }
  @Delete('/:id/role/:roleId')
  async deleteRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return await this.applicationRoleService.deleteRole(id, roleId);
  }
  @Patch('/:id/role/:roleId')
  async updateRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Body('data') data: RoleDto,
  ) {
    return await this.applicationRoleService.updateRole(id, roleId, data);
  }

  @Post('/:id/scope')
  async createScopeWithRandomUUID(
    @Param('id') id: string,
    @Body('data') data: ScopeDto,
  ) {
    return await this.applicationScopeService.createScope(data, id);
  }
  @Post('/:id/scope/:scopeId')
  async createScope(
    @Param('id') id: string,
    @Param('scopeId') scopeId: string,
    @Body('data') data: ScopeDto,
  ) {
    return await this.applicationScopeService.createScope(data, id, scopeId);
  }
  @Delete('/:id/scope/:scopeId')
  async deleteScope(
    @Param('id') id: string,
    @Param('scopeId') scopeId: string,
  ) {
    return await this.applicationScopeService.deleteScope(id, scopeId);
  }
  @Patch('/:id/scope/:scopeId')
  async updateScope(
    @Param('id') id: string,
    @Param('scopeId') scopeId: string,
    @Body('data') data: ScopeDto,
  ) {
    return await this.applicationScopeService.updateScope(id, scopeId, data);
  }

  @Get('/:id/oauth-configuration')
  async returnOauthConfiguration(@Param('id') id: string) {
    return await this.applicationService.returnOauthConfiguration(id);
  }
}
