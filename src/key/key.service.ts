import { BadGatewayException, BadRequestException, Body, Headers, HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { STATUS_CODES } from "http";
import { generateKeyDTO, updateDTO } from "src/key/key.dto";
import { PrismaService } from "src/prisma/prisma.service";
import * as jose from 'node-jose';

@Injectable()
export class KeyService {
    private readonly logger: Logger;
    constructor(private readonly prismaService: PrismaService) {
        this.logger = new Logger();
    }

    async retrieveAllKey() {
        try {
            const item = await this.prismaService.key.findMany();
            if (!item) {
                return {
                    success: false,
                    message: 'any key is not present',
                }
            } else {
                return {
                    success: true,
                    message: 'all keys retrieved',
                    data: item
                }
            }
        } catch (error) {
            this.logger.log('error happened from retrieving all key', error)
            HttpStatus.NOT_FOUND;
        }
    }
    async retrieveUniqueKey(uuid: string) {
        if (!uuid) {
            throw new BadGatewayException({
                success: false,
                message: 'uuid  is not given',
            })
        }
        const id = uuid
        try {
            const item = await this.prismaService.key.findUnique({ where: { id } })
            if (!item) {
                throw new HttpException(
                    'key does not exist with provided id',
                    HttpStatus.NOT_FOUND
                );
            }
            return {
                success : true,
                message: 'key id found',
                data : item
            }
        } catch (error) {
            this.logger.log('error happened from retrieve key section ', error)
            HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }

    async updateKey(uuid: string, data: updateDTO) {
        if (!uuid) {
            throw new BadRequestException({
                success: false,
                message: 'pls provide uuid and name with request',
            })
        }
        const id = uuid;
        const key = await this.prismaService.key.findUnique({ where: { id } });

        if (!key) {
            throw new BadRequestException({
                success: false,
                message: 'pls provide a valid id or ID does not exist ',
            })
        }

        const name = data.name ? data.name : key.name


        const udpated_key = await this.prismaService.key.update({
            where: { id },
            data: {
                name
            }
        })
    }


    async deleteKey(uuid: string) {
        if (!uuid) {
            throw new BadRequestException({
                success: false,
                message: 'uuid is either not given or is invalid'
            })
        }
        const id = uuid
        const key = await this.prismaService.key.findUnique({ where: { id } })

        try {
            if (!key) {
                throw new HttpException(
                    'key does not exist with given id',
                    HttpStatus.NOT_FOUND
                )
            }
            const deleted_key = await this.prismaService.key.delete({ where: { id } })
            return {
                success: true,
                message: 'key deleted successfully'
            }
        } catch (error) {
            throw new BadRequestException({
                success: false,
                message: 'error while deleting a key',
            })
        }
    }
    async generateKey(uuid: string, key: generateKeyDTO) {
        if (!uuid) {
            throw new BadRequestException({
                success: false,
                message: 'uuid is either not given or is invalid'
            })
        }
        const { algorithm, name, length, issuer} = key ;
        const keyStore = jose.JWK.createKeyStore();
        const keyStore2 = jose.JWK.createKeyStore();
        const keyStore3 = jose.JWK.createKeyStore();

        try {
            if (algorithm === 'RS256') {
                await keyStore.generate("RSA", 2048, { alg: "HS256", use: "sig" }).then((result) => {
                    const rskey = JSON.stringify(keyStore.toJSON(true), null, 2);
                    this.logger.log("RS key generated successfully")
                });
                const jwks = keyStore.toJSON(true);
                jwks.keys.forEach(key => {
                    key.id = uuid;
                    key.issuer = issuer;
                    key.length = length;
                    key.userName = name;
                    key.type = 'RSA'
                });
                return {
                    success: true,
                    message: 'key generated successfully',
                    data : jwks
                }
            } else if (algorithm === "ES256") {
                await keyStore2.generate('EC', 'P-256', { alg: 'ES256', use: 'sig' }).then((result) => {
                    const eckey = JSON.stringify(keyStore2.toJSON(true), null, 2);
                    this.logger.log("EC key generated successfully")
                });
                console.log("eckey generate @@@@@@@@@@@@")
                const jwks = keyStore2.toJSON(true);
                jwks.keys.forEach(key => {
                    key.id = uuid;
                    key.issuer = issuer;
                    key.length = length;
                    key.userName = name;
                    key.type = 'EC'
                });
                return {
                    success: true,
                    message: 'key generated successfully',
                    data : jwks
                }
            } else {
                await keyStore3.generate('oct', 256, { alg: 'HS256', use: 'sig' }).then((result) => {
                    const hskey = JSON.stringify(keyStore3.toJSON(true), null, 2);
                    this.logger.log("HS key generated successfully")
                });
                const jwks = keyStore3.toJSON(true);
                jwks.keys.forEach(key => {
                    key.id = uuid;
                    key.userName = name;
                    key.type = 'HMAC'
                });
                return {
                    success: true,
                    message: 'key generated successfully',
                    data : jwks
                }
            }
        } catch (error) {
            throw new BadRequestException({
                success: false,
                message: 'error while generating key',
            })
        }
    }

}