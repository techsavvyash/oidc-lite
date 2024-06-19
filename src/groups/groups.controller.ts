import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { randomUUID } from 'crypto';
import { RoleDto, createGroupDTO } from './dtos/groups.dto';
import { addUserDTO, deleteMemberDTO } from './dtos/gpUser.dto';
import { GroupUserService } from 'src/groups/gpUser.service';
import { ResponseDto } from 'src/dto/response.dto';
import { GroupAppRoleService } from './group-Application-role/gpApplicationRole.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiHeader, ApiHeaders } from '@nestjs/swagger';

@ApiTags('group')
@Controller('group')
export class GroupsController {
  constructor(
    private readonly groupService: GroupsService,
    private readonly groupAppRoleService: GroupAppRoleService,
    private readonly groupUserService: GroupUserService,
  ) {}

  @Post('/')
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({ status: 201, description: 'Group created successfully', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiHeader({ name: 'Authorization', description: 'Authorization token' })
  @ApiBody({ type: createGroupDTO })
  async createGroup(
    @Body('group') data: createGroupDTO,
    @Headers() headers: object,
  ) {
    const uuid = randomUUID();
    return await this.groupService.createGroup(data, uuid, headers);
  }

  @Post('/:id')
  @ApiOperation({ summary: 'Create a group with a specific ID' })
  @ApiResponse({ status: 201, description: 'Group created successfully', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiParam({ name: 'id', required: true, description: 'Group ID' })
  @ApiHeader({ name: 'Authorization', description: 'Authorization token' })
  @ApiBody({ type: createGroupDTO })
  async createGroupByID(
    @Body('group') data: createGroupDTO,
    @Param('id') uuid: string,
    @Headers() headers: object,
  ) {
    return await this.groupService.createGroup(data, uuid, headers);
  }

  @Get('/')
  @ApiOperation({ summary: 'Retrieve all groups' })
  @ApiResponse({ status: 200, description: 'All groups retrieved successfully', type: [ResponseDto] })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiHeader({ name: 'Authorization', description: 'Authorization token' })
  async retrieveAllGroup(@Headers() headers: object) {
    return await this.groupService.retrieveAllGroups(headers);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Retrieve a group by ID' })
  @ApiResponse({ status: 200, description: 'Group retrieved successfully', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiParam({ name: 'id', required: true, description: 'Group ID' })
  @ApiHeader({ name: 'Authorization', description: 'Authorization token' })
  async retrieveGpById(@Param('id') id: string, @Headers() headers: object) {
    return await this.groupService.retrieveGpById(id, headers);
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update a group by ID' })
  @ApiResponse({ status: 200, description: 'Group updated successfully', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiParam({ name: 'id', required: true, description: 'Group ID' })
  @ApiHeader({ name: 'Authorization', description: 'Authorization token' })
  @ApiBody({ type: createGroupDTO })
  async updateGP(
    @Param('id') id: string,
    @Body('group') data: createGroupDTO,
    @Headers() headers: object,
  ) {
    return await this.groupService.updateGp(id, data, headers);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete a group by ID' })
  @ApiResponse({ status: 200, description: 'Group deleted successfully', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiParam({ name: 'id', required: true, description: 'Group ID' })
  @ApiHeader({ name: 'Authorization', description: 'Authorization token' })
  async deleteGP(@Param('id') id: string, @Headers() headers: object) {
    return await this.groupService.deleteGroup(id, headers);
  }

  @Post('member/:id')
  @ApiOperation({ summary: 'Add a user to a group' })
  @ApiParam({ name: 'uuid', required: false, description: 'Group member UUID' })
  @ApiBody({ type: addUserDTO })
  @ApiHeaders([{ name: 'x-stencil-tenantid', required: true, description: 'Tenant ID' }])
  @ApiResponse({ status: 201, description: 'User added to group successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async addUserToGP(
    @Body() data: addUserDTO,
    @Param('id') uuid: string,
    @Headers() headers: object,
  ) {
    if (!uuid) {
      uuid = randomUUID();
    }
    return this.groupUserService.addUser(data, headers);
  }

  @Put('member')
  @ApiOperation({ summary: 'Update a group user' })
  @ApiBody({ type: addUserDTO })
  @ApiHeaders([{ name: 'x-stencil-tenantid', required: true, description: 'Tenant ID' }])
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async updateUser(@Body() data: addUserDTO, @Headers() headers: object) {
    return this.groupUserService.addUser(data, headers);
  }

  @Delete('member/:id')
  @ApiOperation({ summary: 'Delete a group member by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Group member ID' })
  @ApiHeaders([{ name: 'x-stencil-tenantid', required: true, description: 'Tenant ID' }])
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async delete(@Param('id') id: string, @Headers() headers: object) {
    return this.groupUserService.deleteByMemberId(id, headers);
  }

  @Delete('member')
  @ApiOperation({ summary: 'Delete a user from group' })
  @ApiBody({ type: deleteMemberDTO })
  @ApiHeaders([{ name: 'x-stencil-tenantid', required: true, description: 'Tenant ID' }])
  @ApiResponse({ status: 200, description: 'User(s) deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async deleteUser(
    @Body('groupId') gpId: string,
    @Body('userId') userId: string,
    @Body('memberIds') members: deleteMemberDTO,
    @Headers() headers: object,
  ) {
    if (gpId && userId) {
      return this.groupUserService.deleteViaUserAndGpId(userId, gpId, headers);
    } else if (gpId) {
      return this.groupUserService.deleteAllUser(gpId, headers);
    } else if (members) {
      return this.groupUserService.deleteMembers(members, headers);
    } else {
      throw new BadRequestException({
        success: false,
        message: 'invalid parameters',
      });
    }
  }

  @Post('/:id/role/:roleId')
  @ApiOperation({ summary: 'Create a role for a group application' })
  @ApiParam({ name: 'id', required: true, description: 'Application ID' })
  @ApiParam({ name: 'roleId', required: true, description: 'Role ID' })
  @ApiBody({ type: RoleDto })
  @ApiHeaders([{ name: 'x-stencil-tenantid', required: true, description: 'Tenant ID' }])
  @ApiResponse({ status: 201, description: 'Role created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async createRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Body('data') data: RoleDto,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.groupAppRoleService.createRole(data, id, roleId, headers);
  }

  @Delete('/:id/role/:roleId')
  @ApiOperation({ summary: 'Delete a role from a group application' })
  @ApiParam({ name: 'id', required: true, description: 'Application ID' })
  @ApiParam({ name: 'roleId', required: true, description: 'Role ID' })
  @ApiHeaders([{ name: 'x-stencil-tenantid', required: true, description: 'Tenant ID' }])
  @ApiResponse({ status: 200, description: 'Role deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async deleteRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.groupAppRoleService.deleteRole(id, roleId, headers);
  }
}
