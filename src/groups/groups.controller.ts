import { Body, Controller, Delete, Get, Headers, Param, Post, Put } from "@nestjs/common";
import { GroupsService } from "./groups.service";
import { randomFill, randomUUID } from "crypto";
import { RoleDto, createGroupDTO } from "./groups.dto";
import { ResponseDto } from "src/dto/response.dto";
import { GroupAppRoleService } from "./group-Application-role/gpApplicationRole.service";


@Controller('group')
export class GroupsController{
    constructor(
        private readonly groupService : GroupsService,
        private readonly groupAppRoleService : GroupAppRoleService
    ){}

    @Post('/')
    async createGroup(@Body('group') data : createGroupDTO,){
        const uuid = randomUUID() ;
        return this.groupService.createGroup(data, uuid)
    }
    @Post('/:id')
    async createGroupById(@Body('group') data : createGroupDTO, @Param('id') uuid : string){
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
    async updateGP(@Param('id') id : string,@Body('group') data : createGroupDTO){
        return this.groupService.updateGp(id, data)
    }
    @Delete('/:id')
    async deleteGP(@Param('id') id : string){
        return this.groupService.deleteGroup(id)
    }
    @Post('/:id/role/:roleId')
    async createRole(
        @Param('id') id: string,
        @Param('roleId') roleId: string,
        @Body('data') data: RoleDto,
        @Headers() headers: object,
    ): Promise<ResponseDto> {
        return await this.groupAppRoleService.createRole(
            data,
            id,
            roleId,
            headers,
        );
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