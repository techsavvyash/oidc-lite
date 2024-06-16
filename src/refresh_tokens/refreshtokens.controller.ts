import { BadGatewayException, Body, Controller, Delete, Get, Header, Headers, Param, Post } from "@nestjs/common";
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

    @Delete('/refresh/:tokenId')
    async deleteViaTokenID(@Param('tokenId') id : string){
        return this.refreshService.deleteViaTokenID(id);
    }
    
    @Delete('refresh')
    async deletereftoken(
        @Body('applicationId') appid ?: string,
        @Body('usersId') userid ?: string,
        @Body('token') refreshToken ?: string
    ){
        if(appid && userid){
            return this.refreshService.deleteViaUserAndAppID(userid, appid)
        }
        else if(appid){
            return this.refreshService.deleteViaAppID(appid);
        }
        else if(userid){
            return this.refreshService.deleteViaUserID(userid);
        }
        else if(refreshToken){
            return this.refreshService.deleteViaToken(refreshToken)
        }
        else {
            throw new BadGatewayException({ 
                success : false,
                message : 'invalid parameters'
            })
        }
    }
}