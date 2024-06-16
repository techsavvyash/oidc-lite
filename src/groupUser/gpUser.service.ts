import { BadGatewayException, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { MembersDTO } from "./gpUser.dto";


@Injectable()export class GroupUserService {
    private readonly logger : Logger
    constructor(private readonly prismaService : PrismaService){
        this.logger = new Logger();
    }
    async addUser(membersDto : MembersDTO, uuid : string){
        if(!uuid){
            throw new BadGatewayException({
                success : false,
                message : 'please give uuid along with request'
            })
        }
        try{
            // await this.prismaService.groupMember.aggregate({ where : {id : uuid}})

        }catch(error){
            this.logger.log(error)
            throw new BadGatewayException({
                success : false,
                message : ''
            })
        }
    }
}