import { BadGatewayException, BadRequestException, Body, Header, Headers, Injectable, Logger, Options, Param } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";
import { refreshCookiesDTO, refreshDTO } from "./refreshToken.dto";

@Injectable()
export class RefreshTokensService {
    private readonly logger: Logger
    constructor(
        private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService
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

    // deleting all refresh token associated with one application
    async deleteViaAppID(applicationId : string, token ?: string){
        if(!applicationId){
            throw new BadRequestException({
                success : false,
                message : 'please send a valid application ID'
            })
        }
        try{
            const appId = await this.prismaService.refreshToken.findUnique({ where : {
                applicationsId : applicationId ,
                token : token
            }})
            if(appId){
                await this.prismaService.refreshToken.deleteMany({ where : {
                    applicationsId : applicationId 
                }})
                return {
                    success : true,
                    message : 'all refresh tokens deleted successfully with the given application id'
                }
            }else{
                throw new BadGatewayException({
                    success : false,
                    message : 'application id not found'
                })
            }
            
        }catch(error){
            this.logger.log(error)
            throw new BadGatewayException({
                success : false, 
                message : 'error occured while deleting all refresh token from given application id'
            })
        }
    }
    // deleting all refresh token associated with a userID
    async deleteViaUserID(usersId : string, token ?: string){
        if(!usersId){
            throw new BadRequestException({
                success : false,
                message : 'please send a valid user id'
            })
        }
        try{
            const userId = await this.prismaService.refreshToken.findUnique({ where : {
                usersId : usersId,
                token : token
            }})
            if(userId){
                await this.prismaService.refreshToken.deleteMany({ where : {
                    usersId: usersId
                }})
                return {
                    success : true,
                    message : 'all refresh token is deleted successfully with the help of given user id'
                }
            }else{
                throw new BadGatewayException({
                    success : false,
                    message : 'unable to find refresh token with provided credentials'
                })
            }
        }catch(error){
            this.logger.log(error)
            throw new BadGatewayException({
                success : false,
                message : 'error occured while deleting refresh token from given user id'
            })
        }
    }
    // deleting refersh token via given userid and applicationID
    async deleteViaUserAndAppID( userId : string, applicationsId : string, token ?: string){
        if(!userId || !applicationsId){
            throw new BadGatewayException({
                success : false,
                message : 'please send userId and applicationId both'
            })
        }
        try{
            const userID = await this.prismaService.refreshToken.findUnique({ where : {usersId : userId, token : token}})
            const appId = await this.prismaService.refreshToken.findUnique({ where : {applicationsId : applicationsId, token : token}})
            if(userID && appId){
                await this.prismaService.refreshToken.delete({ where : {
                    usersId : userId,
                    applicationsId : applicationsId,
                    token : token
                }})
            return {
                success : true,
                message : 'refresh token deleted with provided application ID and user ID'
            }
            }else{
                throw new BadGatewayException({
                    success : false,
                    message : 'anyone among userId or applicationsId is not found'
                })
            }
        }catch(error){
            this.logger.log(error)
            throw new BadGatewayException({
                success : false,
                message : 'error occured deleting refresh tokens while userId and applicationId both are given'
            })
        }
    }
    // deleting refersh token via given tokenID
    async deleteViaTokenID( id : string){
        if(!id){
            throw new BadRequestException({
                success : false,
                message : 'please send a valid token id'
            })
        }
        try{
            const ref_token = await this.prismaService.refreshToken.findUnique({ where : {
                id : id
            }})
            if(ref_token){
                await this.prismaService.refreshToken.delete({ where : {id}})
                return {
                    success : true,
                    message : 'refresh token is deleted successfully with the help of given token id'
                }
            }else{
                throw new BadGatewayException({
                    success : false,
                    message : 'unable to find refresh token with provided credentials'
                })
            }
        }catch(error){
            this.logger.log(error)
            throw new BadGatewayException({
                success : false,
                message : 'error occured while deleting refresh token from given token id'
            })
        }
    }
    // deleting refresh token via given refresh token
    async deleteViaToken(token : string){
        if(!token){
            throw new BadRequestException({
                success : false,
                message : 'please send a valid token'
            })
        }
        try{
            const ref_token = await this.prismaService.refreshToken.findUnique({ where : {
                token : token
            }})
            if(ref_token){
                await this.prismaService.refreshToken.delete({ where : {token}})
                return {
                    success : true,
                    message : 'refresh token is deleted successfully with the help of given token'
                }
            }else{
                throw new BadGatewayException({
                    success : false,
                    message : 'unable to find refresh token with provided credentials'
                })
            }
        }catch(error){
            this.logger.log(error)
            throw new BadGatewayException({
                success : false,
                message : 'error occured while deleting refresh token from given token string'
            })
        }
    }
}