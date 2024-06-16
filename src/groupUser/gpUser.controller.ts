import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { randomFill, randomUUID } from "crypto";
import { GroupUserService } from "./gpUser.service";
import { MembersDTO } from "./gpUser.dto";


@Controller('groups')
export class GroupUserController{
    constructor(
        private readonly groupUserService : GroupUserService
    ){}

    // group user routes 
    @Post('/member')
    async addUserToGP(@Body('members') data : MembersDTO, uuid ?: string){
        if(!uuid){
            uuid = randomUUID()
        }
        return this.groupUserService.addUser(data, uuid)
    }
}