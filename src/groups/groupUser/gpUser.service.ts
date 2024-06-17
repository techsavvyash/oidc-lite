import { BadGatewayException, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { addUserDTO } from "./gpUser.dto";
import { randomUUID } from "crypto";
import { log } from "console";

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
                        member.userIds.map(async (obj) => {
                            const user = await this.prismaService.user.findUnique({
                                where: { id: obj.userId },
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
                                        id: obj.userId,
                                    },
                                },
                                group: {
                                    connect: {
                                        id: member.groupId,
                                    },
                                },
                                createdAt: new Date().getTime(),
                            };

                            await this.prismaService.groupMember.create({
                                data: newData,
                            });

                            addUsers.push({
                                userId: String(obj.userId),
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

        const groupMembers = await this.prismaService.groupMember.findMany();
        for (const groupMember of groupMembers) {
            console.log(groupMember);
        }
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

    async deleteViaUserAndGpId(userId: string, gpId: string, id?: string) {
        if (!userId || !gpId) {
            throw new BadGatewayException({
                success: false,
                message: 'pls send user id and gp id both'
            })
        }
        try {
            const user = await this.prismaService.groupMember.findFirst({ where: { userId } })
            const gp = await this.prismaService.groupMember.findFirst({ where: { groupId: gpId } })

            if (user && gp) {
                await this.prismaService.groupMember.deleteMany({
                    where: {
                        userId,
                        groupId: gpId,
                    },
                });
            } else {
                throw new BadGatewayException({
                    success: false,
                    message: 'either user id or gp id do not exist in db'
                })
            }
            return {
                success: true,
                message: 'user deleted successfully'
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
            const groupId = await this.prismaService.groupMember.findFirst({ where: {groupId : gpId} })
            if (groupId) {
                await this.prismaService.groupMember.deleteMany({
                    where: {
                        groupId: gpId,
                    },
                });
            } else {
                throw new BadGatewayException({
                    success: false,
                    message: 'gp id do not exist in db'
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
    
}