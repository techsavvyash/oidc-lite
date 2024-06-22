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

@Controller('group')
export class GroupsController {
  constructor(
    private readonly groupService: GroupsService,
    private readonly groupAppRoleService: GroupAppRoleService,
    private readonly groupUserService: GroupUserService,
  ) {}

  @Post('/')
  async createGroup(
    @Body('group') data: createGroupDTO,
    @Headers() headers: object,
  ) {
    const uuid = randomUUID();
    return await this.groupService.createGroup(data, uuid, headers);
  }

  @Post('/:id')
  async createGroupByID(
    @Body('group') data: createGroupDTO,
    @Param('id') uuid: string,
    @Headers() headers: object,
  ) {
    return await this.groupService.createGroup(data, uuid, headers);
  }

  @Get('/')
  async retrieveAllGroup(@Headers() headers: object) {
    return await this.groupService.retrieveAllGroups(headers);
  }

  @Get('/:id')
  async retrieveGpById(@Param('id') id: string, @Headers() headers: object) {
    return await this.groupService.retrieveGpById(id, headers);
  }

  @Put('/:id')
  async updateGP(
    @Param('id') id: string,
    @Body('group') data: createGroupDTO,
    @Headers() headers: object,
  ) {
    return await this.groupService.updateGp(id, data, headers);
  }

  @Delete('/:id')
  async deleteGP(@Param('id') id: string, @Headers() headers: object) {
    return await this.groupService.deleteGroup(id, headers);
  }

  @Post('member/:uuid')
  async addUserToGP(
    @Body() data: addUserDTO,
    @Param('uuid') uuid: string,
    @Headers() headers: object,
  ) {
    if (!uuid) {
      uuid = randomUUID();
    }
    return this.groupUserService.addUser(data, headers);
  }
  @Put('member')
  async updateUser(@Body() data: addUserDTO, @Headers() headers: object) {
    return this.groupUserService.addUser(data, headers);
  }

  @Delete('member/:id')
  async delete(@Param('id') id: string, @Headers() headers: object) {
    return this.groupUserService.deleteByMemberId(id, headers);
  }
  @Delete('member')
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
  async createRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Body('data') data: RoleDto,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.groupAppRoleService.createRole(data, id, roleId, headers);
  }
  @Delete('/:id/role/:roleId')
  async deleteRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Headers() headers: object,
  ): Promise<ResponseDto> {
    return await this.groupAppRoleService.deleteRole(id, roleId, headers);
  }
}
