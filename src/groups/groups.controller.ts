import { BadGatewayException, Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { GroupsService } from "./groups.service";
import { randomFill, randomUUID } from "crypto";
import { addUserDTO, createGroupDTO } from "./groups.dto";
import { GroupUserService } from "./groupUser/gpUser.service";


@Controller('group')
export class GroupsController {
    constructor(
        private readonly groupService: GroupsService, 
        private readonly groupUserService : GroupUserService
    ) { }
    // group user routes 
    @Post('/member')
    async addUserToGP(@Body() data: addUserDTO, uuid?: string) {
        if (!uuid) {
            uuid = randomUUID()
        }
        return this.groupUserService.addUser(data)
    }
    @Put('/member')
    async updateUser(@Body() data: addUserDTO) {
        return this.groupUserService.updateUser(data)
    }

    @Delete('member/:id')
    async delete(@Param('id') id: string) {
        return this.groupUserService.deleteByMemberId(id)
    }
    @Delete('/member')
    async deleteUser(
        @Body('groupId') gpId?: string,
        @Body('userId') userId?: string,
        @Body('memberId') memberId?: string,
    ) {

        if (gpId && userId) {
            return this.groupUserService.deleteViaUserAndGpId(userId, gpId)
        } else if (gpId) {
            return this.groupUserService.deleteAllUser(gpId)
        } else {
            throw new BadGatewayException({
                success: false,
                message: 'invalid parameters'
            })
        }
    }
    @Post('/')
    async createGroup(@Body('group') data: createGroupDTO) {
        const uuid = randomUUID();
        return this.groupService.createGroup(data, uuid)
    }
    @Post('/:id')
    async createGroupByID(@Body('group') data: createGroupDTO, @Param('id') uuid?: string) {
        return this.groupService.createGroup(data, uuid)
    }
    @Get('/')
    async retrieveAllGroup() {
        return this.groupService.retrieveGroup();
    }
    @Get('/:id')
    async retrieveGpById(@Param('id') id: string) {
        return this.groupService.retrieveGpById(id)
    }
    @Put('/:id')
    async updateGP(@Param('id') id: string, @Body('group') data: createGroupDTO) {
        return this.groupService.updateGp(id, data)
    }
    @Delete('/:id')
    async deleteGP(@Param('id') id: string) {
        return this.groupService.deleteGroup(id)
    }

}