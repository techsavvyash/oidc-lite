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
import {
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ApplicationService } from './application.service';
import {
  CreateApplicationDto,
  RoleDto,
  ScopeDto,
  UpdateApplicationDto,
  UpdateRoleDto,
  UpdateScopeDto,
} from 'src/dto/application.dto';
import { ResponseDto } from 'src/dto/response.dto';
import { randomUUID } from 'crypto';
import { ApplicationRolesService } from './application-roles/application-roles.service';
import { ApplicationScopesService } from './application-scopes/application-scopes.service';

@ApiTags('Applications')
@Controller('application')
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly applicationRoleService: ApplicationRolesService,
    private readonly applicationScopeService: ApplicationScopesService,
  ) {}

  @Get('/')
  @ApiOperation({ summary: 'Get all applications' })
  @ApiResponse({
    status: 200,
    description: 'All applications found',
    type: ResponseDto,
  })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async allApplications(): Promise<ResponseDto> {
    return await this.applicationService.returnAllApplications();
  }

  @ApiOperation({ summary: 'Create an Application with a random UUID' })
  @ApiBody({ type: CreateApplicationDto })
  @ApiResponse({
    status: 201,
    description: 'Application created successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post('/')
  async createAnApplicationWithRandomUUID(
    @Body('data') data: CreateApplicationDto,
  ): Promise<ResponseDto> {
    const uuid = randomUUID();
    return await this.applicationService.createApplication(uuid, data);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get an application by ID' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({
    status: 200,
    description: 'Application found successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getAnApplication(@Param('id') id: string): Promise<ResponseDto> {
    return await this.applicationService.returnAnApplication(id);
  }

  @ApiOperation({ summary: 'Create an Application with given id' })
  @ApiBody({ type: CreateApplicationDto })
  @ApiResponse({
    status: 201,
    description: 'Application created successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post('/:id')
  async createAnApplication(
    @Body('data') data: CreateApplicationDto,
    @Param('id') id: string,
  ): Promise<ResponseDto> {
    return await this.applicationService.createApplication(id, data);
  }

  @ApiOperation({ summary: 'Update an existing application' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiBody({ type: UpdateApplicationDto })
  @ApiResponse({
    status: 200,
    description: 'Application updated successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Patch('/:id')
  async updateApplication(
    @Param('id') id: string,
    @Body('data') data: UpdateApplicationDto,
  ): Promise<ResponseDto> {
    return await this.applicationService.patchApplication(id, data);
  }

  @ApiOperation({ summary: 'Delete an application by ID' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiQuery({
    name: 'hardDelete',
    required: false,
    type: Boolean,
    description: 'Hard delete flag',
  })
  @ApiResponse({
    status: 200,
    description: 'Application deleted Successfully!',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Delete('/:id')
  async deleteApplication(
    @Param('id') id: string,
    @Query('hardDelete') hardDelete: boolean,
  ): Promise<ResponseDto> {
    return await this.applicationService.deleteApplication(id, hardDelete);
  }

  @ApiOperation({
    summary: 'Create a new role for an application with a random uuid',
  })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiBody({ type: RoleDto })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post('/:id/role')
  async createRoleWithRandomUUID(
    @Param('id') id: string,
    @Body('data') data: RoleDto,
  ): Promise<ResponseDto> {
    return await this.applicationRoleService.createRole(data, id);
  }

  @ApiOperation({
    summary: 'Create a new role for an application with given id',
  })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiBody({ type: RoleDto })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post('/:id/role/:roleId')
  async createRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Body('data') data: RoleDto,
  ): Promise<ResponseDto> {
    return await this.applicationRoleService.createRole(data, id, roleId);
  }

  @ApiOperation({ summary: 'Delete a role from an application' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'Role deleted successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Delete('/:id/role/:roleId')
  async deleteRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
  ): Promise<ResponseDto> {
    return await this.applicationRoleService.deleteRole(id, roleId);
  }

  @ApiOperation({ summary: 'Update a role for an application' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiBody({ type: UpdateRoleDto, description: 'Role data to update' })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Patch('/:id/role/:roleId')
  async updateRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Body('data') data: RoleDto,
  ): Promise<ResponseDto> {
    return await this.applicationRoleService.updateRole(id, roleId, data);
  }

  @ApiOperation({ summary: 'Create a new Scope for an application with random uuid' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiBody({ type: ScopeDto })
  @ApiResponse({ status: 201, description: 'Scope created successfully', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post('/:id/scope')
  async createScopeWithRandomUUID(
    @Param('id') id: string,
    @Body('data') data: ScopeDto,
  ) {
    return await this.applicationScopeService.createScope(data, id);
  }

  @ApiOperation({ summary: 'Create a new Scope for an application with given id' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiBody({ type: ScopeDto })
  @ApiResponse({ status: 201, description: 'Scope created successfully', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post('/:id/scope/:scopeId')
  async createScope(
    @Param('id') id: string,
    @Param('scopeId') scopeId: string,
    @Body('data') data: ScopeDto,
  ) {
    return await this.applicationScopeService.createScope(data, id, scopeId);
  }

  @ApiOperation({ summary: 'Delete a scope from an application' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiParam({ name: 'scopeId', description: 'scope ID' })
  @ApiResponse({ status: 200, description: 'scope deleted successfully', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Delete('/:id/scope/:scopeId')
  async deleteScope(
    @Param('id') id: string,
    @Param('scopeId') scopeId: string,
  ) {
    return await this.applicationScopeService.deleteScope(id, scopeId);
  }

  @ApiOperation({ summary: 'Update a Scope for an application' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiParam({ name: 'scopeID', description: 'Scope ID' })
  @ApiBody({ type: UpdateScopeDto, description: 'Scope data to update' })
  @ApiResponse({
    status: 200,
    description: 'Scope updated successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Patch('/:id/scope/:scopeId')
  async updateScope(
    @Param('id') id: string,
    @Param('scopeId') scopeId: string,
    @Body('data') data: ScopeDto,
  ): Promise<ResponseDto> {
    return await this.applicationScopeService.updateScope(id, scopeId, data);
  }

  @ApiOperation({ summary: 'Get OAuth configuration for an application by ID' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({
    status: 200,
    description: "Application's configurations are as follows",
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Get('/:id/oauth-configuration')
  async returnOauthConfiguration(
    @Param('id') id: string,
  ): Promise<ResponseDto> {
    return await this.applicationService.returnOauthConfiguration(id);
  }
}
