import { BadGatewayException, BadRequestException, Body, Headers, Injectable } from "@nestjs/common";
import { STATUS_CODES } from "http";
import { retrieveDTO } from "src/dto/key.dto";
import { PrismaService } from "src/prisma/prisma.service";



@Injectable()
export class KeyService{

    constructor(private readonly prismaService : PrismaService){}
    async retrieveKey(uuid : string, data : retrieveDTO ){
        if(!uuid){
            throw new BadRequestException({
                STATUS_CODES : 400,
                message : 'uuid is not provided with request'
            })
        }
        const date = new Date();
        const createdTime = new Date().getTime();
        const updatedtime = new Date().getTime();

        const { algorithm ,createdAt, kid, name, type } = data;
        try{
            const key = await this.prismaService.key.create({
                data : {
                    algorithm : algorithm,
                    id : uuid,
                    kid : kid,
                    name : name,
                    type : type,
                    createdAt : createdTime,
                    updatedAt : updatedtime,
                },
            });
            return {
                message : 'key ID retrieved',
                data,
            }
        }catch(error){
            throw new BadRequestException({
                message : 'error while retrieving a key',
                STATUS_CODES : 400
            })
        }
    }

    async retrieveKeyByID(uuid : string, ){

    }

    async updateKey(uuid : string, new_name : string, data : retrieveDTO){
        if(!uuid){
            throw new BadRequestException({
                STATUS_CODES : 400,
                message : 'uuid is not provided with request'
            })
        }
        const date = new Date();
        const createdTime = new Date().getTime();
        const updatedtime = new Date().getTime();

        const {algorithm, kid, type, createdAt } = data ;
        const id = uuid;
        const name = new_name;

        try{
            const key = await this.prismaService.key.update({
                where : {id},
                data : {
                    algorithm,
                    kid,
                    type,
                    name,
                }
            })
            return {
                message : 'name updated',
                data,
            }
        }catch(error){
            throw new BadRequestException({
                message : 'error while updating name of a key',
                STATUS_CODES : 400
            })
        }

    }

    async deleteKey(uuid : string, data : retrieveDTO){
        if(!uuid){
            throw new BadGatewayException({
                STATUS_CODES : 400,
                message : 'uuid is either not given or is invalid'
            })
        }
        const id = uuid
        const algo = data.algorithm
        const kid = data.kid
        const name = data.name
        const type = data.type
        try{
            const key = await this.prismaService.key.delete({ where : {id}})
        }catch(error){
            throw new BadRequestException({
                message : 'error while deleting a key',
                STATUS_CODES : 401
            })
        }
    }
















}