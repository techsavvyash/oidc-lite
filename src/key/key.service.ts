import { BadGatewayException, BadRequestException, Body, Headers, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { STATUS_CODES } from "http";
import { generateKeyDTO, updateDTO } from "src/dto/key.dto";
import { PrismaService } from "src/prisma/prisma.service";
import jose from 'node-jose';


@Injectable()
export class KeyService{

    constructor(private readonly prismaService : PrismaService){}


    async retrieveKey(uuid : string){
        if(!uuid){
            throw new BadGatewayException({
                message : 'uuid  is not given'
            })
        }
        const id = uuid 
        try{
            const item = await this.prismaService.key.findUnique({ where : {id}})
            if(!item){
                throw new HttpException(
                    'key does not exist with provided id',
                    HttpStatus.NOT_FOUND
                );
            }
            return {
                message : 'key id found',
                item
            }
        }catch(error){
            console.log('error happened from retrieve key section ', error)
            HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }

    async updateKey(uuid : string, data : updateDTO){
        if(!uuid ){
            throw new BadGatewayException({
                message : 'pls provide uuid and name with request',
                STATUS_CODES : 400
            })
        }
        const id = uuid ;
        const key = await this.prismaService.key.findUnique({ where : {id}});
        
        if(!key){
            throw new BadGatewayException({
                message : 'pls provide a valid id or ID does not exist ',
                STATUS_CODES : 404
            })
        }
        
        const name = data.name ? data.name : key.name 


        const udpated_key = await this.prismaService.key.update({ 
            where : {id},
            data : {
                name
            }
        })
    }


    async deleteKey(uuid : string){
        if(!uuid){
            throw new BadGatewayException({
                STATUS_CODES : 400,
                message : 'uuid is either not given or is invalid'
            })
        }
        const id = uuid
        const key = await this.prismaService.key.findUnique({ where : {id}})

        try{
            if(!key){
                throw new HttpException(
                    'key does not exist with given id',
                    HttpStatus.NOT_FOUND
                )
            }
            const deleted_key = await this.prismaService.key.delete({ where : {id}})
            return {
                message : 'key deleted successfully'
            }
        }catch(error){
            throw new BadRequestException({
                message : 'error while deleting a key',
                STATUS_CODES : 401
            })
        }
    }
     
}