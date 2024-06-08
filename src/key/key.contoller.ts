import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Put } from "@nestjs/common";
import { KeyService } from "./key.service";
import { generateKeyDTO, updateDTO } from "src/dto/key.dto";
import { randomUUID } from "crypto";

@Controller('key')
export class KeyController{
    constructor(
        private readonly keyservice : KeyService,
        private readonly udpateData : updateDTO,
        private readonly generateData : generateKeyDTO
    ){}

    @Get('/')
    async retrieveAllKey(){
        return this.keyservice.retrieveAllKey()
    }
    @Get('/:id')
    async retrieveUniqueKey(@Param('id') uuid : string){
        return this.keyservice.retrieveUniqueKey(uuid)
    }

    @Put('/:id')
    async udpatingKey(@Param('id') uuid : string, data : updateDTO){
        return this.keyservice.updateKey(uuid , data);
    }

    @Delete('/:id')
    async deletingKey(@Param('id') uuid : string){
        return this.keyservice.deleteKey(uuid)
    }
    @Post('/generate')
    async randomgenerateKey(data : generateKeyDTO){
        const uuid = randomUUID();
        return this.keyservice.generateKey(uuid, data);
    }
    @Post('/generate/:id')
    async generateKey(@Param('id') uuid : string, data : generateKeyDTO){
        return this.keyservice.generateKey(uuid, data);
    }
}