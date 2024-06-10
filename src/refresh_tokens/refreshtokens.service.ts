import { BadGatewayException, BadRequestException, Body, Header, Headers, Injectable, Logger, Options } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";
import { refreshCookiesDTO, refreshDTO } from "./refreshToken.dto";
import { userInfo } from "os";



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
                        item
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
                    refreshToken,
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
                    refreshToken,
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

    // deleting refresh tokens 
    async deleteEntireApp(application : string){
        
    }
}