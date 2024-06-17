import { BadGatewayException, Body, Controller, Delete, Get, Headers, Param, Post, Put } from "@nestjs/common";
import { randomFill, randomUUID } from "crypto";
import { GroupUserService } from "./gpUser.service";
import { addUserDTO } from "./gpUser.dto";


@Controller('group')
export class GroupUserController {
    constructor(
        private readonly groupUserService: GroupUserService
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
}