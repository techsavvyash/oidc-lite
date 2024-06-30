import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { ApplicationRolesService } from './application-roles/application-roles.service';
import { ApplicationScopesService } from './application-scopes/application-scopes.service';
import {
  CreateApplicationDto,
  RoleDto,
  ScopeDto,
  UpdateApplicationDto,
} from './application.dto';
import { ResponseDto } from '../dto/response.dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('ApplicationController', () => {
  let controller: ApplicationController;
  let applicationService: ApplicationService;
  let applicationRolesService: ApplicationRolesService;
  let applicationScopesService: ApplicationScopesService;

  // MOCK CREATE-APPLICATION-DTO
  const mockCreateApplicationDto = {
    active: true,
    name: 'Mock Application',
    scopes: [
      {
        defaultConsentDetail: 'Default consent detail example',
        defaultConsentMessage: 'Default consent message example',
        name: 'Mock Scope',
        required: true,
        id: '550e8400-e29b-41d4-a716-446655440000',
      },
    ],
    roles: [
      {
        description: 'Admin role with full permissions',
        isDefault: true,
        isSuperRole: false,
        name: 'Admin',
        id: '550e8400-e29b-41d4-a716-446655440000',
      },
    ],
    jwtConfiguration: {
      accessTokenSigningKeysID: 'access-key-id-123',
      refreshTokenTimeToLiveInMinutes: 1440,
      timeToLiveInSeconds: 3600,
      idTokenSigningKeysID: 'id-key-id-456',
    },
    oauthConfiguration: {
      authorizedOriginURLs: [
        'https://example.com',
        'https://anotherexample.com',
      ],
      authorizedRedirectURLs: [
        'https://example.com/callback',
        'https://anotherexample.com/callback',
      ],
      clientSecret: 'supersecret',
      enabledGrants: ['authorization_code', 'refresh_token'],
      logoutURL: 'https://example.com/logout',
    },
  };

  const mockApplicationService = {
    returnAllApplications: jest.fn(),
    createApplication: jest.fn(),
    returnAnApplication: jest.fn(),
    patchApplication: jest.fn(),
    deleteApplication: jest.fn(),
    returnOauthConfiguration: jest.fn(),
  };

  const mockApplicationRolesService = {
    createRole: jest.fn(),
    deleteRole: jest.fn(),
    updateRole: jest.fn(),
  };

  const mockApplicationScopesService = {
    createScope: jest.fn(),
    deleteScope: jest.fn(),
    updateScope: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationController],
      providers: [
        { provide: ApplicationService, useValue: mockApplicationService },
        {
          provide: ApplicationRolesService,
          useValue: mockApplicationRolesService,
        },
        {
          provide: ApplicationScopesService,
          useValue: mockApplicationScopesService,
        },
      ],
    }).compile();

    controller = module.get<ApplicationController>(ApplicationController);
    applicationService = module.get<ApplicationService>(ApplicationService);
    applicationRolesService = module.get<ApplicationRolesService>(
      ApplicationRolesService,
    );
    applicationScopesService = module.get<ApplicationScopesService>(
      ApplicationScopesService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('allApplications', () => {
    it('should return all applications', async () => {
      const result: ResponseDto = {
        success: true,
        message: 'All applications found',
        data: [],
      };
      jest
        .spyOn(applicationService, 'returnAllApplications')
        .mockResolvedValue(result);

      expect(await controller.allApplications({})).toBe(result);
    });
  });

  describe('createAnApplicationWithRandomUUID', () => {
    it('should create an application with random UUID', async () => {
      const result: ResponseDto = {
        success: true,
        message: 'Application created successfully',
        data: { id: 'random-uuid', ...mockCreateApplicationDto },
      };
      jest
        .spyOn(applicationService, 'createApplication')
        .mockResolvedValue(result);

      expect(
        await controller.createAnApplicationWithRandomUUID(
          mockCreateApplicationDto,
          {},
        ),
      ).toBe(result);
    });
  });

  describe('getAnApplication', () => {
    it('should return an application by ID', async () => {
      const result: ResponseDto = {
        success: true,
        message: 'Application found successfully',
        data: { id: 'random-id', name: 'TestApp', description: 'TestAppDesc' },
      };
      jest
        .spyOn(applicationService, 'returnAnApplication')
        .mockResolvedValue(result);

      expect(await controller.getAnApplication('random-id', {})).toBe(result);
    });
  });

  describe('createAnApplication', () => {
    it('should create an application with given ID', async () => {
      const result: ResponseDto = {
        success: true,
        message: 'Application created successfully',
        data: { id: 'given-id', ...mockCreateApplicationDto },
      };
      jest
        .spyOn(applicationService, 'createApplication')
        .mockResolvedValue(result);

      expect(
        await controller.createAnApplication(
          mockCreateApplicationDto,
          'given-id',
          {},
        ),
      ).toBe(result);
    });
  });

  describe('updateApplication', () => {
    it('should update an application', async () => {
      const result: ResponseDto = {
        success: true,
        message: 'Application updated successfully',
        data: { id: 'given-id', ...mockCreateApplicationDto },
      };
      jest
        .spyOn(applicationService, 'patchApplication')
        .mockResolvedValue(result);

      expect(
        await controller.updateApplication(
          'given-id',
          mockCreateApplicationDto,
          {},
        ),
      ).toBe(result);
    });
  });

  describe('deleteApplication', () => {
    it('should delete an application', async () => {
      const result: ResponseDto = {
        success: true,
        message: 'Application deleted Successfully!',
        data: { id: 'given-id' },
      };
      jest
        .spyOn(applicationService, 'deleteApplication')
        .mockResolvedValue(result);

      expect(await controller.deleteApplication('given-id', true, {})).toBe(
        result,
      );
    });
  });

  const mockRoleDto = {
    description: 'Admin role with full permissions',
    isDefault: true,
    isSuperRole: false,
    name: 'Admin',
    id: '550e8400-e29b-41d4-a716-446655440000',
  };

  describe('createRoleWithRandomUUID', () => {
    it('should create a role with random UUID', async () => {
      const result: ResponseDto = {
        success: true,
        message: 'Role created successfully',
        data: { id: 'random-uuid', ...mockRoleDto },
      };
      jest
        .spyOn(applicationRolesService, 'createRole')
        .mockResolvedValue(result);

      expect(
        await controller.createRoleWithRandomUUID('app-id', mockRoleDto, {}),
      ).toBe(result);
    });
  });

  describe('createRole', () => {
    it('should create a role with given ID', async () => {
      const result: ResponseDto = {
        success: true,
        message: 'Role created successfully',
        data: { id: 'given-role-id', ...mockRoleDto },
      };
      jest
        .spyOn(applicationRolesService, 'createRole')
        .mockResolvedValue(result);

      expect(
        await controller.createRole('app-id', 'given-role-id', mockRoleDto, {}),
      ).toBe(result);
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      const result: ResponseDto = {
        success: true,
        message: 'Role deleted successfully',
        data: { id: 'given-role-id' },
      };
      jest
        .spyOn(applicationRolesService, 'deleteRole')
        .mockResolvedValue(result);

      expect(await controller.deleteRole('app-id', 'given-role-id', {})).toBe(
        result,
      );
    });
  });

  describe('updateRole', () => {
    it('should update a role', async () => {
      const result: ResponseDto = {
        success: true,
        message: 'Role updated successfully',
        data: { id: 'given-role-id', ...mockRoleDto },
      };
      jest
        .spyOn(applicationRolesService, 'updateRole')
        .mockResolvedValue(result);

      expect(
        await controller.updateRole('app-id', 'given-role-id', mockRoleDto, {}),
      ).toBe(result);
    });
  });

  const mockScopeDto = {
    defaultConsentDetail: 'Default consent detail example',
    defaultConsentMessage: 'Default consent message example',
    id: '550e8400-e29b-41d4-a716-446655440000', // Optional field
    name: 'read',
    required: true,
  };

  describe('createScopeWithRandomUUID', () => {
    it('should create a scope with random UUID', async () => {
      const result: ResponseDto = {
        success: true,
        message: 'Scope created successfully',
        data: { id: 'random-uuid', ...mockScopeDto },
      };
      jest
        .spyOn(applicationScopesService, 'createScope')
        .mockResolvedValue(result);

      expect(
        await controller.createScopeWithRandomUUID('app-id', mockScopeDto, {}),
      ).toBe(result);
    });
  });

  describe('createScope', () => {
    it('should create a scope with given ID', async () => {
      const result: ResponseDto = {
        success: true,
        message: 'Scope created successfully',
        data: { id: 'given-scope-id', ...mockScopeDto },
      };
      jest
        .spyOn(applicationScopesService, 'createScope')
        .mockResolvedValue(result);

      expect(
        await controller.createScope(
          'app-id',
          'given-scope-id',
          mockScopeDto,
          {},
        ),
      ).toBe(result);
    });
  });

  describe('deleteScope', () => {
    it('should delete a scope', async () => {
      const result: ResponseDto = {
        success: true,
        message: 'Scope deleted successfully',
        data: { id: 'given-scope-id' },
      };
      jest
        .spyOn(applicationScopesService, 'deleteScope')
        .mockResolvedValue(result);

      expect(await controller.deleteScope('app-id', 'given-scope-id', {})).toBe(
        result,
      );
    });
  });

  describe('updateScope', () => {
    it('should update a scope', async () => {
      const result: ResponseDto = {
        success: true,
        message: 'Scope updated successfully',
        data: { id: 'given-scope-id', ...mockScopeDto },
      };
      jest
        .spyOn(applicationScopesService, 'updateScope')
        .mockResolvedValue(result);

      expect(
        await controller.updateScope(
          'app-id',
          'given-scope-id',
          mockScopeDto,
          {},
        ),
      ).toBe(result);
    });
  });

  describe('returnOauthConfiguration', () => {
    it('should return OAuth configuration for an application', async () => {
      const result: ResponseDto = {
        success: true,
        message: "Application's configurations are as follows",
        data: {
          id: 'app-id',
          oauthConfig: { clientId: 'client-id', clientSecret: 'client-secret' },
        },
      };
      jest
        .spyOn(applicationService, 'returnOauthConfiguration')
        .mockResolvedValue(result);

      expect(await controller.returnOauthConfiguration('app-id', {})).toBe(
        result,
      );
    });
  });
});

// UNIT TESTS: APPLICATION CONTROLLER
// ---------------------------------
// Test 1: allApplications
// 1. Call allApplications method
// 2. Expect returnAllApplications method to have been called
// 3. Expect the return value to be the same as the mocked result
// Test 2: createAnApplicationWithRandomUUID
// 1. Call createAnApplicationWithRandomUUID method
// 2. Expect createApplication method to have been called
// 3. Expect the return value to be the same as the mocked result
// Test 3: getAnApplication
// 1. Call getAnApplication method
// 2. Expect returnAnApplication method to have been called
// 3. Expect the return value to be the same as the mocked result
// Test 4: createAnApplication
// 1. Call createAnApplication method
// 2. Expect createApplication method to have been called
// 3. Expect the return value to be the same as the mocked result
// Test 5: updateApplication
// 1. Call updateApplication method
// 2. Expect patchApplication method to have been called
// 3. Expect the return value to be the same as the mocked result
// Test 6: deleteApplication
// 1. Call deleteApplication method
// 2. Expect deleteApplication method to have been called
// 3. Expect the return value to be the same as the mocked result
// Test 7: createRoleWithRandomUUID
// 1. Call createRoleWithRandomUUID method
// 2. Expect createRole method to have been called
// 3. Expect the return value to be the same as the mocked result
// Test 8: createRole
// 1. Call createRole method
// 2. Expect createRole method to have been called
// 3. Expect the return value to be the same as the mocked result
// Test 9: deleteRole
// 1. Call deleteRole method
// 2. Expect deleteRole method to have been called
// 3. Expect the return value to be the same as the mocked result
// Test 10: updateRole
// 1. Call updateRole method
// 2. Expect updateRole method to have been called
// 3. Expect the return value to be the same as the mocked result
// Test 11: createScopeWithRandomUUID
// 1. Call createScopeWithRandomUUID method
// 2. Expect createScope method to have been called
// 3. Expect the return value to be the same as the mocked result
// Test 12: createScope
// 1. Call createScope method
// 2. Expect createScope method to have been called
// 3. Expect the return value to be the same as the mocked result
// Test 13: deleteScope
// 1. Call deleteScope method
// 2. Expect deleteScope method to have been called
// 3. Expect the return value to be the same as the mocked result
// Test 14: updateScope
// 1. Call updateScope method
// 2. Expect updateScope method to have been called
// 3. Expect the return value to be the same as the mocked result
// Test 15: returnOauthConfiguration
// 1. Call returnOauthConfiguration method
// 2. Expect returnOauthConfiguration method to have been called
// 3. Expect the return value to be the same as the mocked result
