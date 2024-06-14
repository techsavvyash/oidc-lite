import { Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { GroupsService } from "./groups.service";
import { randomFill, randomUUID } from "crypto";
import { createGroupDTO } from "./groups.dto";


@Controller('group')
export class GroupsController{
    constructor(
        private readonly groupService : GroupsService
    ){}

    @Post('/')
    async createGroup(data : createGroupDTO){
        const uuid = randomUUID() ;
        return this.groupService.createGroup(data, uuid)
    }
    @Post('/:id')
    async createGroupById(data : createGroupDTO, @Param('id') uuid : string){
        return this.groupService.createGroup(data, uuid);
    }
    @Get('/')
    async retrieveAllGp(){
        return this.groupService.retrieveGP();
    }
    @Get('/:id')
    async retrieveGpById(@Param('id') id : string){
        return this.groupService.retrieveGpById(id)
    }
    @Put('/:id')
    async updateGP(@Param('id') id : string, data : createGroupDTO){
        return this.groupService.updateGp(id, data)
    }
    @Delete('/:id')
    async deleteGP(@Param('id') id : string){
        return this.groupService.deleteGroup(id)
    }
}