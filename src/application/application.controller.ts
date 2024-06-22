import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Delete,
  Headers,
  UseGuards,
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
} from 'src/application/application.dto';
import { ResponseDto } from 'src/dto/response.dto';
import { randomUUID } from 'crypto';
import { ApplicationRolesService } from './application-roles/application-roles.service';
import { ApplicationScopesService } from './application-scopes/application-scopes.service';
import { AuthorizedOriginUrls } from './guards/application.guard';

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
  async allApplications(@Headers() headers: object): Promise<ResponseDto> {
    return await this.applicationService.returnAllApplications(headers);
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
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    const uuid = randomUUID();
    return await this.applicationService.createApplication(uuid, data, headers);
  }

  @Get('/:applicationId')
  @ApiOperation({ summary: 'Get an application by ID' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({
    status: 200,
    description: 'Application found successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @UseGuards(AuthorizedOriginUrls)
  async getAnApplication(
    @Param('applicationId') id: string,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.applicationService.returnAnApplication(id, headers);
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
  @Post('/:applicationId')
  async createAnApplication(
    @Body('data') data: CreateApplicationDto,
    @Param('applicationId') id: string,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.applicationService.createApplication(id, data, headers);
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
  @Patch('/:applicationId')
  @UseGuards(AuthorizedOriginUrls)
  async updateApplication(
    @Param('applicationId') id: string,
    @Body('data') data: UpdateApplicationDto,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.applicationService.patchApplication(id, data, headers);
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
  @Delete('/:applicationId')
  @UseGuards(AuthorizedOriginUrls)
  async deleteApplication(
    @Param('applicationId') id: string,
    @Query('hardDelete') hardDelete: boolean,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.applicationService.deleteApplication(
      id,
      hardDelete,
      headers,
    );
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
  @Post('/:applicationId/role')
  @UseGuards(AuthorizedOriginUrls)
  async createRoleWithRandomUUID(
    @Param('applicationId') id: string,
    @Body('data') data: RoleDto,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.applicationRoleService.createRole(
      data,
      id,
      null,
      headers,
    );
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
  @Post('/:applicationId/role/:roleId')
  @UseGuards(AuthorizedOriginUrls)
  async createRole(
    @Param('applicationId') id: string,
    @Param('roleId') roleId: string,
    @Body('data') data: RoleDto,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.applicationRoleService.createRole(
      data,
      id,
      roleId,
      headers,
    );
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
  @Delete('/:applicationId/role/:roleId')
  @UseGuards(AuthorizedOriginUrls)
  async deleteRole(
    @Param('applicationId') id: string,
    @Param('roleId') roleId: string,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.applicationRoleService.deleteRole(id, roleId, headers);
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
  @Patch('/:applicationId/role/:roleId')
  @UseGuards(AuthorizedOriginUrls)
  async updateRole(
    @Param('applicationId') id: string,
    @Param('roleId') roleId: string,
    @Body('data') data: RoleDto,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.applicationRoleService.updateRole(
      id,
      roleId,
      data,
      headers,
    );
  }

  @ApiOperation({
    summary: 'Create a new Scope for an application with random uuid',
  })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiBody({ type: ScopeDto })
  @ApiResponse({
    status: 201,
    description: 'Scope created successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post('/:applicationId/scope')
  @UseGuards(AuthorizedOriginUrls)
  async createScopeWithRandomUUID(
    @Param('applicationId') id: string,
    @Body('data') data: ScopeDto,
    @Headers() headers: object,
  ) {
    return await this.applicationScopeService.createScope(
      data,
      id,
      null,
      headers,
    );
  }

  @ApiOperation({
    summary: 'Create a new Scope for an application with given id',
  })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiBody({ type: ScopeDto })
  @ApiResponse({
    status: 201,
    description: 'Scope created successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Post('/:applicationId/scope/:scopeId')
  @UseGuards(AuthorizedOriginUrls)
  async createScope(
    @Param('applicationId') id: string,
    @Param('scopeId') scopeId: string,
    @Body('data') data: ScopeDto,
    @Headers() headers: object,
  ) {
    return await this.applicationScopeService.createScope(
      data,
      id,
      scopeId,
      headers,
    );
  }

  @ApiOperation({ summary: 'Delete a scope from an application' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiParam({ name: 'scopeId', description: 'scope ID' })
  @ApiResponse({
    status: 200,
    description: 'scope deleted successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @Delete('/:applicationId/scope/:scopeId')
  @UseGuards(AuthorizedOriginUrls)
  async deleteScope(
    @Param('applicationId') id: string,
    @Param('scopeId') scopeId: string,
    @Headers() headers: object,
  ) {
    return await this.applicationScopeService.deleteScope(id, scopeId, headers);
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
  @Patch('/:applicationId/scope/:scopeId')
  @UseGuards(AuthorizedOriginUrls)
  async updateScope(
    @Param('applicationId') id: string,
    @Param('scopeId') scopeId: string,
    @Body('data') data: ScopeDto,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.applicationScopeService.updateScope(
      id,
      scopeId,
      data,
      headers,
    );
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
  @Get('/:applicationId/oauth-configuration')
  @UseGuards(AuthorizedOriginUrls)
  async returnOauthConfiguration(
    @Param('applicationId') id: string,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.applicationService.returnOauthConfiguration(id, headers);
  }
}
