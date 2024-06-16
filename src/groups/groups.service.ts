import { BadGatewayException, Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "src/prisma/prisma.service";
import { createGroupDTO } from "./groups.dto";




@Injectable()
export class GroupsService{
    private readonly logger : Logger
    constructor(private readonly prismaService : PrismaService){
        this.logger = new Logger();
    }

    async createGroup(item : createGroupDTO, uuid : string, tenantId ?: string){
        if(!uuid){
            throw new BadGatewayException({
                success : false,
                message : 'please provide a valid id'
            })
        }
        console.log(item)
        try{
            const group = await this.prismaService.group.create({ data : {
                id : uuid,
                name : item.group.name,
                tenantId : tenantId,         
            }})
            return {
                success : true,
                message : 'group created successfully!',
                data : group
            }
        }catch(error){
            this.logger.log(error)
            throw new BadGatewayException({
                success : false,
                message : 'error while creating a group'
            })
        }
    }

    async retrieveGP(tenantId ?: string){
        try{
            const gps = await this.prismaService.group.findMany()
            if(gps){
                return {
                    success : true,
                    message : 'all gps returned successfully',
                    data : gps
                }
            }else{
                throw new BadGatewayException({
                    success : false,
                    message : 'unable to find any group'
                })
            }
        }catch(error){
            this.logger.log(error)
            throw new BadGatewayException({
                success : false,
                message : 'error while finding groups'
            })
        }
    }
    async retrieveGpById(id : string){
        if(!id){
            throw new BadGatewayException({
                success : false,
                message : 'please send group id while sending reqeust'
            })
        }
        try{
            const group = await this.prismaService.group.findUnique({ where : {id : id}})
            if(group){
                return {
                    success : true,
                    message : 'group retrieved by given id',
                    data : group
                }
            }else{
                throw new BadGatewayException({
                    success : false,
                    message : 'group not found with given id'
                })
            }
        }catch(error){
            this.logger.log(error)
            throw new BadGatewayException({
                success : false,
                message : 'error occured while finding the group'
            })
        }
    }
    async updateGp(id : string, data : createGroupDTO){
        if(!id){
            throw new BadGatewayException({
                success : false,
                message : 'please send id alogn with request'
            })
        }
        try{
            const response = await this.prismaService.group.update({
                where : {id : id},
                data : {
                    name : data.group.name,
                }
            })
            return {
                sucess : true,
                message : 'group updated successfully',
                data : response
            }
        }catch(error){
            throw new BadGatewayException({
                success : false,
                message : 'error occured while updating group'
            })
        }
    }

    async deleteGroup(id : string){
        if(!id){
            throw new BadGatewayException({
                success : false,
                message : 'please send id alogn with request'
            })
        }
        try{
            await this.prismaService.group.delete({where : {id}})
            return {
                success : true,
                message : 'group with given id deleted successfully'
            }
        }catch(error){
            this.logger.log(error)
            throw new BadGatewayException({
                success : false,
                message : 'error occured while searching for a gp id'
            })
        }
    }
}