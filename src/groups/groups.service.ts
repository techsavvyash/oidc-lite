import { BadGatewayException, Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "src/prisma/prisma.service";
import { createGroupDTO } from "./groups.dto";
import { Prisma } from '@prisma/client';

@Injectable()
export class GroupsService {
    private readonly logger: Logger
    constructor(private readonly prismaService: PrismaService) {
        this.logger = new Logger();
    }
    async createGroup(data: createGroupDTO, uuid: string, key?: string) {
        if (!uuid) {
            throw new BadGatewayException({
                success: false,
                message: 'please provide a valid id'
            })
        }
        let tenant;
        const existingTenant = await this.prismaService.tenant.findUnique({ where: { id: data.tenantId } });
        if (existingTenant) {
            tenant = existingTenant;
        } else {
            throw new BadGatewayException({
                success: false,
                message: 'tenant id does not exist in db pls provide such tenant id which exist in db'
            })
        }
        const item = await Promise.all(
            data.roleIDs.map(async (roleId: string) => {
                const applicationIDs = await this.prismaService.applicationRole.findUnique({ where: { id: roleId } })
                return {
                    applicationRoleId: roleId,
                    applicationIds: applicationIDs
                }
            })
        )
        try {
            const group = await this.prismaService.group.create({
                data: {
                    name: data.name,
                    tenantId: tenant.id,
                },
            })
            if (group) {
                return {
                    success: true,
                    message: 'group created successfully!',
                    data: group
                }
            } else {
                throw new BadGatewayException({
                    success: false,
                    message: 'error occured while regsitering group'
                })
            }
        } catch (error) {
            this.logger.log(error)
            throw new BadGatewayException({
                success: false,
                message: 'error while creating data format of sending group data'
            })
        }
    }

    async retrieveGroup() {
        try {
            const gps = await this.prismaService.group.findMany()
            if (gps) {
                return {
                    success: true,
                    message: 'all gps returned successfully',
                    data: gps
                }
            } else {
                throw new BadGatewayException({
                    success: false,
                    message: 'unable to find any group'
                })
            }
        } catch (error) {
            this.logger.log(error)
            throw new BadGatewayException({
                success: false,
                message: 'error while finding groups'
            })
        }
    }
    async retrieveGpById(id: string) {
        if (!id) {
            throw new BadGatewayException({
                success: false,
                message: 'please send group id while sending reqeust'
            })
        }
        try {
            const group = await this.prismaService.group.findUnique({ where: { id: id } })
            if (group) {
                return {
                    success: true,
                    message: 'group retrieved by given id',
                    data: group
                }
            } else {
                throw new BadGatewayException({
                    success: false,
                    message: 'group not found with given id'
                })
            }
        } catch (error) {
            this.logger.log(error)
            throw new BadGatewayException({
                success: false,
                message: 'error occured while finding the group'
            })
        }
    }
    async updateGp(uuid: string, data: createGroupDTO) {
        if (!uuid) {
            throw new BadGatewayException({
                success: false,
                message: 'please send id alogn with request'
            })
        }
        const item = await Promise.all(
            data.roleIDs.map(async (roleId: string) => {
                const applicationIDs = await this.prismaService.applicationRole.findUnique({ where: { id: roleId } })
                return {
                    applicationRoleId: roleId,
                    applicationIds: applicationIDs
                }
            })
        )
        let tenant;
        const existingTenant = await this.prismaService.tenant.findUnique({ where: { id: data.tenantId } });
        if (existingTenant) {
            tenant = existingTenant;
        } else {
            throw new BadGatewayException({
                success: false,
                message: 'tenant id does not exist in db pls provide such tenant id which exist in db'
            })
        }
        try {
            const group = await this.prismaService.group.findUnique({ where: { id: uuid } })
            if (!group) {
                throw new BadGatewayException({
                    success: false,
                    message: 'unable to find group with given id'
                })
            }
            const updated_gp = await this.prismaService.group.update({
                where: { id: uuid },
                data: {
                    name: data.name,
                    tenantId: tenant.id
                }
            })
            if (updated_gp) {
                return {
                    sucess: true,
                    message: 'group updated successfully',
                    data: updated_gp
                }
            } else {
                throw new BadGatewayException({
                    success: false,
                    message: 'error while updating group'
                })
            }
        } catch (error) {
            this.logger.log(error)
            throw new BadGatewayException({
                success: false,
                message: 'error while finding a gp'
            })
        }
    }

    async deleteGroup(uuid: string) {
        if (!uuid) {
            throw new BadGatewayException({
                success: false,
                message: 'please send id alogn with request'
            })
        }
        try {
            const group = await this.prismaService.group.findUnique({ where: { id: uuid } })
            if (!group) {
                throw new BadGatewayException({
                    success: false,
                    message: 'unable to find group with given id'
                })
            }
            await this.prismaService.group.delete({ where: { id: uuid } })
            return {
                success: true,
                message: 'group with given id deleted successfully'
            }
        } catch (error) {
            this.logger.log(error)
            throw new BadGatewayException({
                success: false,
                message: 'error occured while searching for a gp id'
            })
        }
    }
}