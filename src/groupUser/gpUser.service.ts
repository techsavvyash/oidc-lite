import { BadGatewayException, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { addUserDTO, deleteMemberDTO } from "./gpUser.dto";
import { randomUUID } from "crypto";

@Injectable() export class GroupUserService {
    private readonly logger: Logger
    constructor(private readonly prismaService: PrismaService) {
        this.logger = new Logger();
    }
    async addUser(data: addUserDTO) {
        try {
            const response = [];

            await Promise.all(
                data.members.map(async (member) => {
                    if (!member.groupId) {
                        throw new BadGatewayException({
                            success: false,
                            message: 'Please send group id',
                        });
                    }

                    const group = await this.prismaService.group.findUnique({
                        where: { id: member.groupId },
                    });

                    if (!group) {
                        throw new BadGatewayException({
                            success: false,
                            message: 'Group id does not exist in db',
                        });
                    }

                    const addUsers = [];

                    await Promise.all(
                        member.userIds.map(async (userId) => {
                            const user = await this.prismaService.user.findUnique({
                                where: { id: String(userId) },
                            });

                            if (!user) {
                                throw new BadGatewayException({
                                    success: false,
                                    message: 'User id is not found in db',
                                });
                            }

                            const newData = {
                                user: {
                                    connect: {
                                        id: String(userId),
                                    },
                                },
                                group: {
                                    connect: {
                                        id: String(member.groupId),
                                    },
                                },
                                createdAt: new Date().getTime(),
                            };

                            await this.prismaService.groupMember.create({
                                data: newData,
                            });

                            addUsers.push({
                                userId: String(userId),
                                id: randomUUID()
                            });
                        })
                    );

                    response.push({
                        groupId: member.groupId,
                        groupName: group.name,
                        users: addUsers,
                    });
                })
            );

            return {
                success: true,
                message: 'All given users added to their groups',
                data: response,
            };
        } catch (error) {
            this.logger.log(error);
            throw new BadGatewayException({
                success: false,
                message: "error occured while adding user",
            });
        }
    }

    async updateUser(data: addUserDTO) {
        await Promise.all(
            data.members.map(async (member) => {
                if (!member.groupId) {
                    throw new BadGatewayException({
                        success: false,
                        message: 'Please send group id',
                    });
                }

                const group = await this.prismaService.group.findUnique({
                    where: { id: member.groupId },
                });

                if (!group) {
                    throw new BadGatewayException({
                        success: false,
                        message: 'Group id does not exist in db',
                    });
                }
                this.deleteAllUser(member.groupId);
                this.addUser(data);
            })
        )
    }

    async deleteByMemberId(uuid: string) {
        if (!uuid) {
            throw new BadGatewayException({
                success: false,
                message: 'pls send uuid'
            })
        }
        try {
            const mem_id = await this.prismaService.groupMember.findUnique({ where: { id: uuid } })
            if (mem_id) {
                await this.prismaService.groupMember.delete({ where: { id: uuid } })
            } else {
                throw new BadGatewayException({
                    success: false,
                    message: 'member id not found in db'
                })
            }
            return {
                success: true,
                message: 'user removed via given member id'
            }
        } catch (error) {
            this.logger.log(error)
            throw new BadGatewayException({
                success: false,
                message: 'error occured while deleting user from member id'
            })
        }
    }

    async deleteViaUserAndGpId(userId: string, gpId: string) {
        if (!userId || !gpId) {
            throw new BadGatewayException({
                success: false,
                message: 'pls send user id and gp id both'
            })
        }
        try {
            const user = await this.prismaService.groupMember.findUnique({ where: { id: userId } })
            const gp = await this.prismaService.groupMember.findUnique({ where: { id: gpId } })
            if (user && gp) {
                await this.prismaService.groupMember.delete({ where: { id: userId } })
            }else{
                throw new BadGatewayException({
                    success : false,
                    message : 'either user id or gp id do not exist in db'
                })
            }
            return {
                success : true,
                message : 'user deleted successfully'
            }
        } catch (error) {
            this.logger.log(error)
            throw new BadGatewayException({
                success: false,
                message: 'error occured while deleting via userid and gp id'
            })
        }
    }
    async deleteAllUser(gpId: string) {
        if (!gpId) {
            throw new BadGatewayException({
                success: false,
                message: 'pls send and gp id both'
            })
        }
        try {
            if (await this.prismaService.groupMember.findUnique({ where: { id: String(gpId) } })){
                await this.prismaService.groupMember.deleteMany({
                    where: {
                        groupId: gpId,
                    },
                });
            }else{
                throw new BadGatewayException({
                    success : false,
                    message : 'gp id do not exist in db'
                })
            }
            return {
                success: true,
                message: `All users removed from group`,
            };
        } catch (error) {
            this.logger.log(error);
            throw new BadGatewayException({
                success: false,
                message: error.message || 'An error occurred',
            });
        }
    }

    async deleteMembers(data: deleteMemberDTO) {
        try {
            await Promise.all(
                data.members.map(async (member) => {
                    if (await this.prismaService.groupMember.findUnique({ where: { id: member } })) {
                        await this.prismaService.groupMember.delete({ where: { id: member } })
                    } else {
                        throw new BadGatewayException({
                            success: false,
                            message: `member id ${member} does not exist in db`
                        })
                    }
                })
            )
            return {
                success: true,
                message: 'members deleted successfully'
            }
        } catch (error) {
            this.logger.log(error)
            throw new BadGatewayException({
                success: false,
                message: 'error occured from deleting members via member array'
            })
        }
    }
}