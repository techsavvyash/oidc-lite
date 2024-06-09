import { Body, Controller, Delete, Get, Headers, Param, Post } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { RefreshTokensService } from "./refreshtokens.service";
import { refreshCookiesDTO, refreshDTO } from "./refreshToken.dto";


@Controller('jwt')
export class RefreshTokensController{
    constructor(
        private readonly prismaService : PrismaService,
        private readonly refreshService : RefreshTokensService
    ){}

    @Post('/refresh')
    async refreshToken(@Headers() cookie : refreshCookiesDTO, @Body() data : refreshDTO){
        return this.refreshService.refreshToken(cookie, data);
    }
    @Get('/refresh/:id')
    async retrieve(@Param('id') uuid : string){
        return this.refreshService.retrieveByID(uuid); 
    }
    @Get('/refresh')
    async retrieveByUserID(@Headers('userId') userId : string){
        return this.refreshService.retrieveByUserID(userId); 
    }

    @Delete('/refresh')
    async deleteEntireApp(@Headers('applicationId') appId : string){
        return this.deleteEntireApp(appId)
    }
}