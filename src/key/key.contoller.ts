import { Body, Controller, Delete, Get, Headers, Param, Patch, Put } from "@nestjs/common";
import { KeyService } from "./key.service";
import { retrieveDTO } from "src/dto/key.dto";

@Controller('key')
export class KeyController{
    constructor(
        private readonly keyservice : KeyService,
        private readonly retrieveData : retrieveDTO
    ){}

    @Get('/')
    async retrieveAllKey( uuid : string, data : retrieveDTO){
        return this.keyservice.retrieveKey(uuid, data)
    }

    @Put('/:id')
    async udpatingKey(@Param('id') uuid : string, name : string, data : retrieveDTO){
        return this.keyservice.updateKey(uuid, name , data);
    }

    @Delete('/:id')
    async deletingKey(@Param('id') uuid : string, data : retrieveDTO){
        return this.keyservice.deleteKey(uuid, data)
    }
}