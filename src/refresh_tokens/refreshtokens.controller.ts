import { Body, Controller, Delete, Get, Header, Headers, Param, Post } from "@nestjs/common";
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
    async deleteViaApp(@Param('applicationId') applicationId : string){
        return this.refreshService.deleteViaAppID(applicationId);
    }
    @Delete('/refresh')
    async deleteViaUserID(@Param('usersId') usersId : string, @Param('token') token ?: string){
        return this.refreshService.deleteViaUserID(usersId, token);
    }
    @Delete('/refresh')
    async deleteViaUserAndAppID(@Param('userId') userId : string, @Param('applicationId') applicationsId : string, token ?: string){
        return this.refreshService.deleteViaUserAndAppID(userId, applicationsId)
    }
    @Delete('/refresh/:tokenId')
    async deleteViaTokenID(@Param('tokenId') id : string){
        return this.refreshService.deleteViaTokenID(id);
    }
    @Delete('/refresh')
    async deleteViaToken(@Param('token') token : string){
        return this.refreshService.deleteViaToken(token)
    }
}