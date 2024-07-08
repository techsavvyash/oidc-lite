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
import { ApiBody, ApiResponse, ApiTags, ApiParam, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { randomUUID } from 'crypto';
import { createGroupDTO } from './dtos/groups.dto';
import { addUserDTO, deleteMemberDTO } from './dtos/gpUser.dto';
import { GroupUserService } from './gpUser.service';

@ApiTags('FGroup')
@Controller('group')
export class GroupsController {
  constructor(
    private readonly groupService: GroupsService,
    private readonly groupUserService: GroupUserService,
  ) {}

  @Post('/')
  @ApiBody({ type: createGroupDTO })
  @ApiResponse({ status: 201, description: 'Group created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async createGroup(
    @Body('group') data: createGroupDTO,
    @Headers() headers: object,
  ) {
    const uuid = randomUUID();
    return await this.groupService.createGroup(data, uuid, headers);
  }

  @Post('/member')
  @ApiBody({ type: addUserDTO })
  @ApiResponse({ status: 201, description: 'User added to group successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async addUserToGP(
    @Body('members') data: addUserDTO,
    @Headers() headers: object,
  ) {
    return this.groupUserService.addUser(data, headers);
  }

  @Post('/:id')
  @ApiBody({ type: createGroupDTO })
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiResponse({ status: 201, description: 'Group created successfully by ID.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async createGroupByID(
    @Body('group') data: createGroupDTO,
    @Param('id') uuid: string,
    @Headers() headers: object,
  ) {
    return await this.groupService.createGroup(data, uuid, headers);
  }

  @Get('/')
  @ApiResponse({ status: 200, description: 'Retrieved all groups successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async retrieveAllGroup(@Headers() headers: object) {
    return await this.groupService.retrieveAllGroups(headers);
  }

  @Get('/:id')
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Retrieved group by ID successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async retrieveGpById(@Param('id') id: string, @Headers() headers: object) {
    return await this.groupService.retrieveGpById(id, headers);
  }

  @Put('/:id')
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiBody({ type: createGroupDTO })
  @ApiResponse({ status: 200, description: 'Group updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async updateGP(
    @Param('id') id: string,
    @Body('group') data: createGroupDTO,
    @Headers() headers: object,
  ) {
    return await this.groupService.updateGp(id, data, headers);
  }

  @Delete('/:id')
  @ApiParam({ name: 'id', description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Group deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async deleteGP(@Param('id') id: string, @Headers() headers: object) {
    return await this.groupService.deleteGroup(id, headers);
  }

  @Put('/member')
  @ApiBody({ type: addUserDTO })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async updateUser(
    @Body('members') data: addUserDTO,
    @Headers() headers: object,
  ) {
    return this.groupUserService.addUser(data, headers);
  }

  @Delete('/member/:id')
  @ApiParam({ name: 'id', description: 'Member ID' })
  @ApiResponse({ status: 200, description: 'Member deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async delete(@Param('id') id: string, @Headers() headers: object) {
    return this.groupUserService.deleteByMemberId(id, headers);
  }

  @Delete('/member')
  @ApiQuery({ name: 'groupId', required: false, description: 'Group ID' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID' })
  @ApiBody({ type: deleteMemberDTO, required: false })
  @ApiResponse({ status: 200, description: 'User(s) deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid parameters.' })
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
