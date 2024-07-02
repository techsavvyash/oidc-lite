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
  Query,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { randomUUID } from 'crypto';
import { createGroupDTO } from './dtos/groups.dto';
import { addUserDTO, deleteMemberDTO } from './dtos/gpUser.dto';
import { GroupUserService } from './gpUser.service';

@Controller('group')
export class GroupsController {
  constructor(
    private readonly groupService: GroupsService,
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

  @Post('/member')
  async addUserToGP(
    @Body('members') data: addUserDTO,
    @Headers() headers: object,
  ) {
    return this.groupUserService.addUser(data, headers);
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

  @Put('/member')
  async updateUser(
    @Body('members') data: addUserDTO,
    @Headers() headers: object,
  ) {
    return this.groupUserService.addUser(data, headers);
  }

  @Delete('/member/:id')
  async delete(@Param('id') id: string, @Headers() headers: object) {
    return this.groupUserService.deleteByMemberId(id, headers);
  }
  @Delete('/member')
  async deleteUser(
    @Query('groupId') gpId: string,
    @Query('userId') userId: string,
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
}
