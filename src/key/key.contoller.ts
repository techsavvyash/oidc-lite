import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Put } from "@nestjs/common";
import { KeyService } from "./key.service";
import { generateKeyDTO, updateDTO } from "src/key/key.dto";

@Controller('key')
export class KeyController{
    constructor(
        private readonly keyservice : KeyService,
        private readonly udpateData : updateDTO,
        private readonly generateData : generateKeyDTO
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
    @Post('/generate')
    async generateKey(uuid : string, data : generateKeyDTO){
        return this.keyservice.generateKey(uuid, data);
    }
}
import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Put } from "@nestjs/common";
import { KeyService } from "./key.service";
import { generateKeyDTO, updateDTO } from "src/key/key.dto";
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
    async randomgenerateKey(@Body('key') key : generateKeyDTO){
        const uuid = randomUUID();
        return this.keyservice.generateKey(uuid, key);
    }
    @Post('/generate/:id')
    async generateKey(@Param('id') uuid : string, data : generateKeyDTO){
        return this.keyservice.generateKey(uuid, data);
    }
}