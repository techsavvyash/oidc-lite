import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { ApplicationRolesService } from './application-roles/application-roles.service';
import { ApplicationScopesService } from './application-scopes/application-scopes.service';
import { ParamApplicationIdGuard } from '../guards/paramApplicationId.guard';
import { UtilsService } from '../utils/utils.service'; // Adjust this path as per your application structure
import {
  CreateApplicationDto,
  UpdateApplicationDto,
  RoleDto,
  ScopeDto,
} from './application.dto';
import { ResponseDto } from '../dto/response.dto';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service'; // Adjust this path as per your application structure
import { Response } from 'express-serve-static-core';

describe('ApplicationController', () => {
  let controller: ApplicationController;
  let applicationService: ApplicationService;
  let applicationRoleService: ApplicationRolesService;
  let applicationScopeService: ApplicationScopesService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const mockApplicationService = {
      returnAllApplications: jest.fn<Promise<ResponseDto>, [object]>(),
    };

    const mockPrismaService = {
      application: {
        create: jest.fn(),
      },
      publicKeys: {
        create: jest.fn(),
      },
    };

    const mockUtilsService = {};

    // Create a NestJS testing module to mock and inject dependencies
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationController], // Specify the controller to be tested
      providers: [
        // Mock or provide necessary services
        {
          provide: ApplicationService,
          useValue: {
            returnAllApplications: jest.fn(),
            createApplication: jest.fn(),
            returnAnApplication: jest.fn(),
            patchApplication: jest.fn(),
            deleteApplication: jest.fn(),
            returnOauthConfiguration: jest.fn(),
          },
        },
        {
          provide: ApplicationRolesService,
          useValue: {
            createRole: jest.fn(),
            updateRole: jest.fn(),
            deleteRole: jest.fn(),
          },
        },
        {
          provide: ApplicationScopesService,
          useValue: {
            createScope: jest.fn(),
            updateScope: jest.fn(),
            deleteScope: jest.fn(),
          },
        },
        {
          provide: ParamApplicationIdGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UtilsService,
          useValue: mockUtilsService,
        },
      ],
    }).compile();

    // Retrieve instances of the controller and services from the testing module
    controller = module.get<ApplicationController>(ApplicationController);
    applicationService = module.get<ApplicationService>(ApplicationService);
    applicationRoleService = module.get<ApplicationRolesService>(
      ApplicationRolesService,
    );
    applicationScopeService = module.get<ApplicationScopesService>(
      ApplicationScopesService,
    );
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /application', () => {
    it('should call applicationService.returnAllApplications with headers', async () => {
      const headers = { authorization: 'Bearer token' };
      await controller.allApplications(headers);
      expect(applicationService.returnAllApplications).toHaveBeenCalledWith(headers);
    });

    it('should return all applications', async () => {
      const headers = {};
      const mockResponse: ResponseDto = {
        success: true,
        message: 'All applications found',
        data: [],
      };
      jest.spyOn(applicationService, 'returnAllApplications').mockResolvedValue(mockResponse);

      const result = await controller.allApplications(headers);
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors while fetching applications', async () => {
      const headers = {};
      const error = new Error('Internal Server Error');
      jest.spyOn(applicationService, 'returnAllApplications').mockRejectedValue(error);

      await expect(controller.allApplications(headers)).rejects.toThrow(error);
      expect(applicationService.returnAllApplications).toHaveBeenCalledWith(headers);
    });

    it('should handle empty headers', async () => {
      const mockResponse: ResponseDto = {
        success: true,
        message: 'All applications found',
        data: [],
      };
      jest.spyOn(applicationService, 'returnAllApplications').mockResolvedValue(mockResponse);

      const result = await controller.allApplications(null);
      expect(result).toEqual(mockResponse);
      expect(applicationService.returnAllApplications).toHaveBeenCalledWith(null);
    });
  });

  const createApplicationDtoMock: CreateApplicationDto = {
    active: true,
    name: 'Test Application',
    scopes: [
      {
        defaultConsentDetail: 'Default consent detail',
        defaultConsentMessage: 'Default consent message',
        name: 'Scope Name',
        required: true,
      },
    ],
    roles: [
      {
        description: 'Role description',
        isDefault: true,
        isSuperRole: false,
        name: 'Role Name',
      },
    ],
    oauthConfiguration: {
      authorizedOriginURLs: ['https://example.com'],
      authorizedRedirectURLs: ['https://example.com/callback'],
      clientSecret: 'supersecret',
      enabledGrants: ['authorization_code'],
      logoutURL: 'https://example.com/logout',
    },
  };

  // describe('POST /application', () => {
  //   it('should create an application with random UUID', async () => {
  //     const headers = {authorization : 'master'};
  //     const createDto = createApplicationDtoMock;
  //     const res = {"data": {"id": "mock-uuid"}, "message": "Application created successfully!", "success": true} as unknown as Response ;
  //     const mockResponse: ResponseDto = {
  //       success: true,
  //       message: 'Application created successfully!',
  //       data: { id: 'mock-uuid', ...createDto },
  //     };
  //     jest.spyOn(applicationService, 'createApplication').mockResolvedValue()

  //     const result = await controller.createAnApplicationWithRandomUUID(createDto, headers, res );
  //     expect(result).toEqual(mockResponse);
  //     expect(applicationService.createApplication).toHaveBeenCalledWith(expect.any(String), createDto, headers);
  // });
  // });

  describe('GET /application/:applicationId', () => {
    it('should return an application by ID', async () => {
      const headers = {};
      const applicationId = 'mock-application-id';
      const mockResponse: ResponseDto = {
        success: true,
        message: 'Application found successfully',
        data: {},
      };
      jest.spyOn(applicationService, 'returnAnApplication').mockResolvedValue(mockResponse);

      const result = await controller.getAnApplication(applicationId, headers);
      expect(result).toEqual(mockResponse);
      expect(applicationService.returnAnApplication).toHaveBeenCalledWith(applicationId, headers);
    });
  });

  // describe('PATCH /application/:applicationId', () => {
  //   it('should update an application', async () => {
  //     const headers = {};
  //     const applicationId = 'mock-application-id';
  //     const res = {} as unknown as Response ;
  //     const updateDto: UpdateApplicationDto = {};
  //     const mockResponse: ResponseDto = {
  //       success: true,
  //       message: 'Application updated successfully!',
  //       data: {},
  //     };
  //     jest.spyOn(applicationService, 'patchApplication').mockResolvedValue();

  //     const result = await controller.updateApplication(applicationId, updateDto, headers, res);
  //     expect(result).toEqual(mockResponse);
  //     expect(applicationService.patchApplication).toHaveBeenCalledWith(updateDto, headers);
  //   });
  // });

  describe('DELETE /application/:applicationId', () => {
    it('should delete an application', async () => {
      const headers = {};
      const applicationId = 'mock-application-id';
      const hardDelete = false;
      const mockResponse: ResponseDto = {
        success: true,
        message: 'Application deleted Successfully!',
        data: {},
      };
      jest.spyOn(applicationService, 'deleteApplication').mockResolvedValue(mockResponse);

      const result = await controller.deleteApplication(applicationId, hardDelete, headers);
      expect(result).toEqual(mockResponse);
      expect(applicationService.deleteApplication).toHaveBeenCalledWith(applicationId, hardDelete, headers);
    });
  });

  const roleDtoMock: RoleDto = {
    description: 'Admin role with full permissions',
    isDefault: true,
    isSuperRole: false,
    name: 'Admin',
  };

  describe('POST /application/:applicationId/role', () => {
    it('should create a role for an application with random UUID', async () => {
      const headers = {};
      const applicationId = 'mock-application-id';
      const createDto = roleDtoMock;
      const mockResponse: ResponseDto = {
        success: true,
        message: 'Role created successfully',
        data: {},
      };
      jest.spyOn(applicationRoleService, 'createRole').mockResolvedValue(mockResponse);

      const result = await controller.createRoleWithRandomUUID(applicationId, createDto, headers);
      expect(result).toEqual(mockResponse);
      expect(applicationRoleService.createRole).toHaveBeenCalledWith(createDto, applicationId, null, headers);
    });
  });

  describe('POST /application/:applicationId/role/:roleId', () => {
    it('should create a role for an application with given ID', async () => {
      const headers = {};
      const applicationId = 'mock-application-id';
      const roleId = 'mock-role-id';
      const createDto = roleDtoMock;
      const mockResponse: ResponseDto = {
        success: true,
        message: 'Role created successfully',
        data: {},
      };
      jest.spyOn(applicationRoleService, 'createRole').mockResolvedValue(mockResponse);

      const result = await controller.createRole(applicationId, roleId, createDto, headers);
      expect(result).toEqual(mockResponse);
      expect(applicationRoleService.createRole).toHaveBeenCalledWith(createDto, applicationId, roleId, headers );
  });
  });

  describe('PATCH /application/:applicationId/role/:roleId', () => {
    it('should update a role for an application', async () => {
      const headers = {};
      const applicationId = 'mock-application-id';
      const roleId = 'mock-role-id';
      const updateDto = roleDtoMock;
      const mockResponse: ResponseDto = {
        success: true,
        message: 'Role updated successfully',
        data: {},
      };
      jest.spyOn(applicationRoleService, 'updateRole').mockResolvedValue(mockResponse);

      const result = await controller.updateRole(applicationId, roleId, updateDto, headers);
      expect(result).toEqual(mockResponse);
      expect(applicationRoleService.updateRole).toHaveBeenCalledWith(applicationId, roleId,updateDto, headers );
    });
  });

  describe('DELETE /application/:applicationId/role/:roleId', () => {
    it('should delete a role from an application', async () => {
      const headers = {};
      const applicationId = 'mock-application-id';
      const roleId = 'mock-role-id';
      const mockResponse: ResponseDto = {
        success: true,
        message: 'Role deleted successfully',
        data: {},
      };
      jest.spyOn(applicationRoleService, 'deleteRole').mockResolvedValue(mockResponse);

      const result = await controller.deleteRole(applicationId, roleId, headers);
      expect(result).toEqual(mockResponse);
      expect(applicationRoleService.deleteRole).toHaveBeenCalledWith(applicationId, roleId, headers );
    });
  });

  const scopeDtoMock: ScopeDto = {
    defaultConsentDetail: 'Default consent detail example',
    defaultConsentMessage: 'Default consent message example',
    name: 'Scope name example',
    required: true,
  };

  describe('POST /application/:applicationId/scope', () => {
    it('should create a scope for an application with random UUID', async () => {
      const headers = {};
      const applicationId = 'mock-application-id';
      const createDto: ScopeDto = scopeDtoMock;
      const mockResponse: ResponseDto = {
        success: true,
        message: 'Scope created successfully',
        data: {},
      };
      jest.spyOn(applicationScopeService, 'createScope').mockResolvedValue(mockResponse);

      const result = await controller.createScopeWithRandomUUID(applicationId, createDto, headers);
      expect(result).toEqual(mockResponse);
      expect(applicationScopeService.createScope).toHaveBeenCalledWith(createDto, applicationId, null, headers);
    });
  });

  describe('POST /application/:applicationId/scope/:scopeId', () => {
    it('should create a scope for an application with given ID', async () => {
      const headers = {};
      const applicationId = 'mock-application-id';
      const scopeId = 'mock-scope-id';
      const createDto = scopeDtoMock;
      const mockResponse: ResponseDto = {
        success: true,
        message: 'Scope created successfully',
        data: {},
      };
      jest.spyOn(applicationScopeService, 'createScope').mockResolvedValue(mockResponse);

      const result = await controller.createScope(applicationId, scopeId, createDto, headers);
      expect(result).toEqual(mockResponse);
      expect(applicationScopeService.createScope).toHaveBeenCalledWith(createDto, applicationId, scopeId, headers);
    });
  });

  describe('PATCH /application/:applicationId/scope/:scopeId', () => {
    it('should update a scope for an application', async () => {
      const headers = {};
      const applicationId = 'mock-application-id';
      const scopeId = 'mock-scope-id';
      const updateDto = scopeDtoMock;
      const mockResponse: ResponseDto = {
        success: true,
        message: 'Scope updated successfully',
        data: {},
      };
      jest.spyOn(applicationScopeService, 'updateScope').mockResolvedValue(mockResponse);

      const result = await controller.updateScope(applicationId, scopeId, updateDto, headers);
      expect(result).toEqual(mockResponse);
      expect(applicationScopeService.updateScope).toHaveBeenCalledWith(applicationId, scopeId, updateDto, headers);
    });
  });

  describe('DELETE /application/:applicationId/scope/:scopeId', () => {
    it('should delete a scope from an application', async () => {
      const headers = {};
      const applicationId = 'mock-application-id';
      const scopeId = 'mock-scope-id';
      const mockResponse: ResponseDto = {
        success: true,
        message: 'Scope deleted successfully',
        data: {},
      };
      jest.spyOn(applicationScopeService, 'deleteScope').mockResolvedValue(mockResponse);

      const result = await controller.deleteScope(applicationId, scopeId, headers);
      expect(result).toEqual(mockResponse);
      expect(applicationScopeService.deleteScope).toHaveBeenCalledWith(applicationId, scopeId, headers);
    });
  });

  describe('GET /application/:applicationId/oauth-configuration', () => {
    it('should return OAuth configuration for an application by ID', async () => {
      const headers = {};
      const applicationId = 'mock-application-id';
      const mockResponse: ResponseDto = {
        success: true,
        message: "Application's configurations are as follows",
        data: {},
      };
      jest.spyOn(applicationService, 'returnOauthConfiguration').mockResolvedValue(mockResponse);

      const result = await controller.returnOauthConfiguration(applicationId, headers);
      expect(result).toEqual(mockResponse);
      expect(applicationService.returnOauthConfiguration).toHaveBeenCalledWith(applicationId, headers);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
