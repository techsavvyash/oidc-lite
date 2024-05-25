import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService){}

    async allUsers(){
        return this.prisma.user.findMany();
    }

    async createUser(data: Prisma.UserCreateInput): Promise<User | null>{
        return this.prisma.user.create({data});
    }
    
    async getUserByEmail(userWhereUniqueInput: Prisma.UserWhereUniqueInput): Promise<User | null>{
        return this.prisma.user.findUnique({
            where: userWhereUniqueInput
        })
    }

    async getUserByName(userWhereUniqueInput: Prisma.UserWhereUniqueInput): Promise<User | null>{
        return this.prisma.user.findUnique({
            where: userWhereUniqueInput
        })
    }

    async insertToken(id: number,token: string): Promise<User | null>{
        const user = await this.prisma.user.findUnique({
            where: {id: id}
        });

        if(!user){
            throw new Error("User not found");
        }

        const updatedToken = user.tokens ? `${user.tokens} ${token}`: token;

        return await this.prisma.user.update({
            where: {id},
            data: {tokens: updatedToken}
        })
    }
}