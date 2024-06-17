import { BadRequestException, Body, Headers, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";
import { refreshCookiesDTO, refreshDTO } from "./refreshToken.dto";
import { HeaderAuthService } from "src/header-auth/header-auth.service";

@Injectable()
export class RefreshTokensService {
    private readonly logger: Logger
    constructor(
        private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService,
        private readonly headerAuthService: HeaderAuthService,
    ) {
        this.logger = new Logger();
    }

    async refreshToken(@Headers() cookie: refreshCookiesDTO, @Body() data: refreshDTO) {
        if (!cookie || !data) {
            return {
                success: false,
                message: 'please provide refresh and access token via cookie or body'
            }
        }
        try {

            const token = cookie.refreshToken ? cookie.refreshToken : data.refreshToken
            const refreshToken = await this.prismaService.refreshToken.findUnique({ where: { token } })
            if (refreshToken) {
                if (refreshToken.expiry < (new Date()).getSeconds()) {
                    const uuid = refreshToken.id
                    const expiresIn = '1h'
                    const access_token = this.jwtService.sign({ uuid }, { expiresIn }); 
                    this.logger.log('access token generated')
                    const item = {
                        refreshToken: token,
                        refreshTokenID: uuid,
                        token: access_token
                    }
                    return {
                        success: true,
                        message: 'access token generated successfully!',
                        data : item
                    }
                } else {
                    throw new BadRequestException({
                        success: false,
                        message: 'refresh token had expired'
                    })
                }
            } else {
                throw new BadRequestException({
                    success: false,
                    message: 'invalid refresh token'
                })
            }
        } catch (error) {
            this.logger.log(error)
            throw new BadRequestException({
                success: false,
                message: 'error occured verifying refresh token'
            })
        }
    }

    async retrieveByID(id: string, tenantID?: string) {
        if (!id) {
            throw new BadRequestException({
                success: false,
                message: 'please send uuid along with request'
            })
        }
        const refreshToken = await this.prismaService.refreshToken.findUnique({ where: { id } })
        try {
            if (!refreshToken) {
                throw new BadRequestException({
                    success: false,
                    message: 'refresh token is not generated'
                })
            } else {
                return {
                    success : true,
                    message : 'refresh token generated successfully',
                    data : refreshToken,
                }
            }
        } catch (error) {
            this.logger.log(error);
            throw new BadRequestException({
                success: false,
                message: 'error occures while retrieving refresh token from uuid'
            })
        }
    }

    async retrieveByUserID(usersId: string) {
        if (!usersId) {
            throw new BadRequestException({
                success: false,
                message: 'please send userId along with request'
            })
        }
        const refreshToken = await this.prismaService.refreshToken.findUnique({
            where: {
                id: usersId,
            }
        });
        try {
            if (!refreshToken) {
                throw new BadRequestException({
                    success: false,
                    message: 'refresh token is not generated'
                })
            } else {
                return {
                    success : true,
                    message : 'refresh token generated successfully',
                    data : refreshToken,
                }
            }
        } catch (error) {
            this.logger.log(error);
            throw new BadRequestException({
                success: false,
                message: 'error occures while retrieving refresh token from userID'
            })
        }
    }

    async deleteViaAppID(applicationId : string,headers: object){
        if(!applicationId){
            throw new BadRequestException({
                success : false,
                message : 'please send a valid application ID'
            })
        }
        const appId = await this.prismaService.application.findUnique({where: {id: applicationId}});
        if(!appId){
            throw new BadRequestException({
                success : false,
                message : 'application id not found'
            })
        }
        const valid = await this.headerAuthService.authorizationHeaderVerifier(headers,appId.tenantId,"/jwt/refresh",'DELETE');
        if(!valid.success){
            throw new UnauthorizedException({
                success: valid.success,
                message: valid.message
            })
        }
        try{
                await this.prismaService.refreshToken.deleteMany({ where : {
                    applicationsId : applicationId 
                }})
                return {
                    success : true,
                    message : 'all refresh tokens deleted successfully with the given application id'
                }
            
        }catch(error){
            this.logger.log(error)
            throw new InternalServerErrorException({
                success : false, 
                message : 'error occured while deleting all refresh token from given application id'
            })
        }
    }
    
    async deleteViaUserID(usersId : string,headers: object){
        if(!usersId){
            throw new BadRequestException({
                success : false,
                message : 'please send a valid user id'
            })
        }
        const userId = await this.prismaService.user.findUnique({ where : {
            id: usersId,
        }})
        if(!userId){
            throw new BadRequestException({
                success : false,
                message : 'unable to find refresh token with provided credentials'
            })
        }
        const valid = await this.headerAuthService.authorizationHeaderVerifier(headers,null,'/jwt/refresh','DELETE');
        if(!valid.success){
            throw new UnauthorizedException({
                success: valid.success,
                message: valid.message
            })
        }
        try{
                await this.prismaService.refreshToken.deleteMany({ where : {
                    usersId: usersId
                }})
                return {
                    success : true,
                    message : 'all refresh token is deleted successfully with the help of given user id'
                }
        }catch(error){
            this.logger.log(error)
            throw new InternalServerErrorException({
                success : false,
                message : 'error occured while deleting refresh token from given user id'
            })
        }
    }

    async deleteViaUserAndAppID( userId : string, applicationsId : string,headers: object){
        if(!userId || !applicationsId){
            throw new BadRequestException({
                success : false,
                message : 'please send userId and applicationId both'
            })
        }
        const userID = await this.prismaService.user.findUnique({ where : {id : userId}})
        const appId = await this.prismaService.application.findUnique({ where : {id : applicationsId}})
        if(!userID || !appId){
            throw new BadRequestException({
                success: false,
                message: 'No such userid or appid exists'
            })
        }
        const valid = await this.headerAuthService.authorizationHeaderVerifier(headers,appId.tenantId,'/jwt/refersh','DELETE');
        if(!valid.success){
            throw new UnauthorizedException({
                success: valid.success,
                message: valid.message
            })
        }
        try{
                await this.prismaService.refreshToken.deleteMany({ where : {
                    usersId : userId,
                    applicationsId : applicationsId
                }})
            return {
                success : true,
                message : 'refresh token deleted with provided application ID and user ID'
            }
        }catch(error){
            this.logger.log(error)
            throw new InternalServerErrorException({
                success : false,
                message : 'error occured deleting refresh tokens while userId and applicationId both are given'
            })
        }
    }
    // deleting refersh token via given tokenID
    async deleteViaTokenID( id : string, headers: object){

        if(!id){
            throw new BadRequestException({
                success : false,
                message : 'please send a valid token id'
            })
        }
        const ref_token = await this.prismaService.refreshToken.findUnique({ where : {
            id : id
        }})
        if(!ref_token){
            throw new BadRequestException({
                success : false,
                message : 'unable to find refresh token with provided credentials'
            })
        }
        const appid = ref_token.applicationsId;
        const application = await this.prismaService.application.findUnique({where: {id: appid}});
        const valid = await this.headerAuthService.authorizationHeaderVerifier(headers,application.tenantId,"/jwt/refresh",'DELETE');
        if(!valid.success){
            throw new UnauthorizedException({
                success: valid.success,
                message: valid.message
            })
        }
        try{
                const token = await this.prismaService.refreshToken.delete({ where : {id}})
                return {
                    success : true,
                    message : 'refresh token is deleted successfully with the help of given token id',
                    data: token
                }
        }catch(error){
            this.logger.log(error)
            throw new BadRequestException({
                success : false,
                message : 'error occured while deleting refresh token from given token id'
            })
        }
    }
    // deleting refresh token via given refresh token
    async deleteViaToken(token : string,headers: object){
        if(!token){
            throw new BadRequestException({
                success : false,
                message : 'please send a valid token'
            })
        }
        const ref_token = await this.prismaService.refreshToken.findUnique({ where : {
            token : token
        }})
        if(!ref_token){
            throw new BadRequestException({
                success : false,
                message : 'unable to find refresh token with provided credentials'
            })
        }
        const appid = ref_token.applicationsId;
        const application = await this.prismaService.application.findUnique({where: {id: appid}});
        const valid = await this.headerAuthService.authorizationHeaderVerifier(headers,application.tenantId,'/jwt/refresh','DELETE');
        if(!valid.success){
            throw new UnauthorizedException({
                success: false,message: valid.message
            })
        }
        try{
            
                await this.prismaService.refreshToken.delete({ where : {token}})
                return {
                    success : true,
                    message : 'refresh token is deleted successfully with the help of given token'
                }
        }catch(error){
            this.logger.log(error)
            throw new BadRequestException({
                success : false,
                message : 'error occured while deleting refresh token from given token string'
            })
        }
    }
}