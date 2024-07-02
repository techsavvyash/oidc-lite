import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupUserService } from './gpUser.service';
import { PrismaService } from '../prisma/prisma.service';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import { UpdateGroupDto, createGroupDTO } from './dtos/groups.dto';
import * as crypto from 'crypto';
import { addUserDTO, deleteMemberDTO } from './dtos/gpUser.dto';
import { BadRequestException } from '@nestjs/common';

describe('GroupsController', () => {
  let controller: GroupsController;
  let service: GroupsService;
  let userService: GroupUserService;
  const headers = {
    authorization: 'master',
    'x-stencil-tenantid': 'minio-tenant',
  } as object;
  const id = 'agroup';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        {
          provide: GroupsService,
          useValue: {
            createGroup: jest.fn().mockResolvedValue({
              success: true,
              message: 'Group created successfully',
            }),
            retrieveAllGroups: jest.fn().mockResolvedValue({
              success: true,
            }),
            retrieveGpById: jest.fn().mockResolvedValue({
              success: true,
              message: 'group retrieved by given id',
            }),
            deleteGroup: jest.fn().mockResolvedValue({
              success: true,
              message: 'group with given id deleted successfully',
            }),
            updateGp: jest.fn().mockResolvedValue({
              success: true,
              message: 'Group updated',
            }),
          },
        },
        {
          provide: GroupUserService,
          useValue: {
            addUser: jest.fn().mockResolvedValue({
              success: true,
              message: 'All given users added to their valid groups',
            }),
            deleteViaUserAndGpId: jest.fn().mockResolvedValue({
              success: true,
            }),
            deleteAllUser: jest.fn().mockResolvedValue({
              success: true,
            }),
            deleteMembers: jest.fn().mockResolvedValue({
              success: true,
            }),
            deleteByMemberId: jest.fn().mockResolvedValue({
              success: true,
            }),
          },
        },
        PrismaService,
        HeaderAuthService,
      ],
    }).compile();

    controller = module.get<GroupsController>(GroupsController);
    service = module.get<GroupsService>(GroupsService);
    userService = module.get<GroupUserService>(GroupUserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
    expect(userService).toBeDefined();
  });

  describe('createAGroupWithRandomUUID', () => {
    it('should call createGroup with randomUUID', async () => {
      const createGroup = {
        roleIDs: ['admin role', 'admin role2'],
        name: 'A name for group',
      } as createGroupDTO;

      const id = 'a0f7c111-3b15-45bd-bd37-e86bfcb9a5fb';
      jest.spyOn(crypto, 'randomUUID').mockReturnValue(id);
      expect(crypto.randomUUID()).toBe(id);
      const response = await controller.createGroup(createGroup, headers);
      expect(service.createGroup).toHaveBeenCalledWith(
        createGroup,
        id,
        headers,
      );
      expect(response).toEqual({
        success: true,
        message: 'Group created successfully',
      });
    });

    it('should call createGroup with given id', async () => {
      const createGroup = {
        roleIDs: ['admin role', 'admin role2'],
        name: 'A name for group',
      } as createGroupDTO;

      const id = 'a0f7c111-3b15-45bd-bd37-e86bfcb9a5fb';
      const response = await controller.createGroupByID(
        createGroup,
        id,
        headers,
      );
      expect(service.createGroup).toHaveBeenCalledWith(
        createGroup,
        id,
        headers,
      );
      expect(response).toEqual({
        success: true,
        message: 'Group created successfully',
      });
    });
  });
  it('should add members to a group', async () => {
    const addUser = {} as addUserDTO;
    const response = await controller.addUserToGP(addUser, headers);
    expect(userService.addUser).toHaveBeenCalledWith(addUser, headers);
    expect(response).toEqual({
      success: true,
      message: 'All given users added to their valid groups',
    });
  });

  it('should return all found groups', async () => {
    const response = await controller.retrieveAllGroup(headers);
    expect(response).toEqual({
      success: true,
    });
  });

  it('should return found group', async () => {
    const id = 'agroup';
    const response = await controller.retrieveGpById(id, headers);
    expect(response).toEqual({
      success: true,
      message: 'group retrieved by given id',
    });
  });

  it('should delete the group provided by given id', async () => {
    const id = 'agroup';
    const result = await controller.deleteGP(id, headers);
    expect(result).toEqual({
      success: true,
      message: 'group with given id deleted successfully',
    });
  });

  it('should update the given group', async () => {
    const data = {} as createGroupDTO;
    const response = await controller.updateGP(id, data, headers);
    expect(response).toEqual({
      success: true,
      message: 'Group updated',
    });
  });

  it('should add users to groups', async () => {
    const data = {} as addUserDTO;
    const response = await controller.updateUser(data, headers);
    expect(response).toEqual({
      success: true,
      message: 'All given users added to their valid groups',
    });
  });

  describe('this should delete members from a group', () => {
    it('should delete via user and gp id', async () => {
      const gpId = 'agroup';
      const userId = 'auser';
      const members = {
        members: ['first member', 'second member'],
      } as deleteMemberDTO;
      const response = await controller.deleteUser(
        gpId,
        userId,
        members,
        headers,
      );
      expect(userService.deleteViaUserAndGpId).toHaveBeenCalledWith(
        userId,
        gpId,
        headers,
      );
      await controller.deleteUser(gpId, null, members, headers);
      expect(userService.deleteAllUser).toHaveBeenCalledWith(gpId, headers);
      await controller.deleteUser(null, null, members, headers);
      expect(userService.deleteMembers).toHaveBeenCalledWith(members, headers);
      await expect(
        controller.deleteUser(null, null, null, headers),
      ).rejects.toThrow(
        new BadRequestException({
          success: false,
          message: 'invalid parameters',
        }),
      );
      expect(response).toEqual({
        success: true,
      });
    });
  });

  it('should remove a user from group', async () => {
    const id = 'amember';
    const response = await controller.delete(id, headers);
    expect(response).toEqual({
      success: true,
    });
  });
});
