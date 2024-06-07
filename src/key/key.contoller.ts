import { Body, Controller, Delete, Get, Headers, Param, Patch, Put } from "@nestjs/common";
import { KeyService } from "./key.service";
import { updateDTO } from "src/dto/key.dto";

@Controller('key')
export class KeyController{
    constructor(
        private readonly keyservice : KeyService,
        private readonly udpateData : updateDTO
    ){}

    @Get('/:id')
    async retrieveAllKey( uuid : string){
        return this.keyservice.retrieveKey(uuid )
    }

    @Put('/:id')
    async udpatingKey(@Param('id') uuid : string, data : updateDTO){
        return this.keyservice.updateKey(uuid , data);
    }

    @Delete('/:id')
    async deletingKey(@Param('id') uuid : string){
        return this.keyservice.deleteKey(uuid)
    }
}