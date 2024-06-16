import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { GroupsService } from "./groups.service";
import { randomFill, randomUUID } from "crypto";
import { createGroupDTO } from "./groups.dto";


@Controller('group')
export class GroupsController{
    constructor(
        private readonly groupService : GroupsService
    ){}

    @Post('/:id')
    async createGroup(@Body('group') data : createGroupDTO, @Param('id') uuid ?: string){
        if(!uuid){
            const uuid = randomUUID() ;
        }
        return this.groupService.createGroup(data, uuid)
    }
    @Get('/')
    async retrieveAllGroup(){
        return this.groupService.retrieveGroup();
    }
    @Get('/:id')
    async retrieveGpById(@Param('id') id : string){
        return this.groupService.retrieveGpById(id)
    }
    @Put('/:id')
    async updateGP(@Param('id') id : string,@Body('group') data : createGroupDTO){
        return this.groupService.updateGp(id, data)
    }
    @Delete('/:id')
    async deleteGP(@Param('id') id : string){
        return this.groupService.deleteGroup(id)
    }
}