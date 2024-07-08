import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationService } from './application.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationRolesService } from './application-roles/application-roles.service';
import { ApplicationScopesService } from './application-scopes/application-scopes.service';
import { HeaderAuthService } from '../header-auth/header-auth.service';
import { UtilsService } from '../utils/utils.service';
import {
    UnauthorizedException,
    BadRequestException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { CreateApplicationDto, UpdateApplicationDto } from './application.dto';
import { Response } from 'express';

describe('ApplicationService', () => {
    let service: ApplicationService;
    let prismaService: PrismaService;
    let applicationRolesService: ApplicationRolesService;
    let applicationScopesService: ApplicationScopesService;
    let headerAuthService: HeaderAuthService;
    let utilsService: UtilsService;
    let logger: Logger;

    const mockResponse = () => {
        const res: Partial<Response> = {};
        res.send = jest.fn().mockReturnValue(res);
        return res as Response;
    };

    const PrismaServiceMock = {
        application: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
        },
        tenant: {
            findUnique: jest.fn(),
        },
        applicationRole: {
            findMany: jest.fn(),
        },
        applicationOauthScope: {
            findMany: jest.fn(),
        },
        publicKeys: {
            deleteMany: jest.fn(),
            create: jest.fn(),
        },
    };

    const ApplicationRolesServiceMock = {
        createRole: jest.fn(),
    };

    const ApplicationScopesServiceMock = {
        createScope: jest.fn(),
    };

    const HeaderAuthServiceMock = {
        validateRoute: jest.fn(),
        authorizationHeaderVerifier: jest.fn(),
    };

    const UtilsServiceMock = {
        getPublicKey: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ApplicationService,
                { provide: PrismaService, useValue: PrismaServiceMock },
                { provide: ApplicationRolesService, useValue: ApplicationRolesServiceMock },
                { provide: ApplicationScopesService, useValue: ApplicationScopesServiceMock },
                { provide: HeaderAuthService, useValue: HeaderAuthServiceMock },
                { provide: UtilsService, useValue: UtilsServiceMock },
            ],
        }).compile();

        service = module.get<ApplicationService>(ApplicationService);
        prismaService = module.get<PrismaService>(PrismaService);
        applicationRolesService = module.get<ApplicationRolesService>(ApplicationRolesService);
        applicationScopesService = module.get<ApplicationScopesService>(ApplicationScopesService);
        headerAuthService = module.get<HeaderAuthService>(HeaderAuthService);
        utilsService = module.get<UtilsService>(UtilsService);
    });

    describe('createApplication', () => {
        const applicatioId = 'myminioadmin'
        it('should throw UnauthorizedException if route validation fails', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: false, message: 'Unauthorized' });
            const res = mockResponse();
            await expect(service.createApplication('uuid', {} as CreateApplicationDto, {}, res)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw BadRequestException if no tenant id is provided', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: null } });
            const res = mockResponse();
            await expect(service.createApplication('uuid', {} as CreateApplicationDto, {}, res)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if no uuid is provided', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'tenantId' } });
            const res = mockResponse();
            await expect(service.createApplication('', {} as CreateApplicationDto, {}, res)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if tenant id not found', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'null' } });
            PrismaServiceMock.application.findUnique.mockResolvedValue(null);
            const res = mockResponse();
            await expect(service.createApplication('uuid', {} as CreateApplicationDto, {}, res)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if application already exists', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'tenantId' } });
            PrismaServiceMock.application.findUnique.mockResolvedValue({});
            const res = mockResponse();
            await expect(service.createApplication('uuid', { name: 'appName' } as CreateApplicationDto, {}, res)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if refresh token time and time to live is not given', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'tenantId' } });
            PrismaServiceMock.tenant.findUnique.mockResolvedValue({ data: JSON.stringify({ accessTokenSigningKeysID: null, idTokenSigningKeysID: null }) });
            const res = mockResponse();
            await expect(service.createApplication('uuid', { name: 'appName' } as CreateApplicationDto, {}, res)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if no data is provided', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'tenantId' } });
            const res = mockResponse();
            await expect(service.createApplication('uuid', null, {}, res)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if tenant does not exist', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'tenantId' } });
            PrismaServiceMock.tenant.findUnique.mockResolvedValue(null);
            const res = mockResponse();
            await expect(service.createApplication('uuid', { name: 'appName' } as CreateApplicationDto, {}, res)).rejects.toThrow(BadRequestException);
        });

        it('should create throw BadRequestException if refresh token time and time to live not given', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'minio-tenant' } });
            PrismaServiceMock.tenant.findUnique.mockResolvedValue({ accessTokenSigningKeysId: 'null-key', idTokenSigningKeysId: 'key2', data: JSON.stringify({ accessTokenSigningKeysID: 'key1', idTokenSigningKeysID: 'key2', refreshTokenTimeToLiveInMinutes: null, timeToLiveInSeconds: null }) });
            PrismaServiceMock.application.findUnique.mockResolvedValue(null);
            const res = mockResponse();
            await expect(service.createApplication('uuid', { name: 'appName', roles: [], scopes: [], oauthConfiguration: { authorizedOriginURLs: [] } } as CreateApplicationDto, { authorization: 'master' }, res)).rejects.toThrow(BadRequestException);

        });
        it('should create throw BadRequestException if tenant access token keys does not match with access token or if tenant id token does not match with id token signing keys successfully', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'minio-tenant' } });
            PrismaServiceMock.tenant.findUnique.mockResolvedValue({ accessTokenSigningKeysId: 'null-key', idTokenSigningKeysId: 'null-key', data: JSON.stringify({ accessTokenSigningKeysID: 'key1', idTokenSigningKeysID: 'key2', refreshTokenTimeToLiveInMinutes: 10, timeToLiveInSeconds: 10 }) });
            PrismaServiceMock.application.findUnique.mockResolvedValue(null);
            const res = mockResponse();
            await expect(service.createApplication('uuid', { name: 'appName', roles: [], scopes: [], oauthConfiguration: { authorizedOriginURLs: [] } } as CreateApplicationDto, { authorization: 'master' }, res)).rejects.toThrow(BadRequestException);

        });

        it('should handle internal server error during application creation', async () => {
            
            const res = {
              send: jest.fn(),
            } as unknown as Response;
        
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'minio-tenant' } });
            
            PrismaServiceMock.tenant.findUnique.mockResolvedValue({ accessTokenSigningKeysId: 'key1', idTokenSigningKeysId: 'key2', data: JSON.stringify({ accessTokenSigningKeysID: 'key1', idTokenSigningKeysID: 'key2', refreshTokenTimeToLiveInMinutes: 10, timeToLiveInSeconds: 10 }) });
            PrismaServiceMock.application.findUnique.mockResolvedValue(null);
            const error = new Error('Error creating application');
            PrismaServiceMock.application.create.mockRejectedValue(error)
            
            await expect(service.createApplication('uuid', { name: 'appName', roles: [], scopes: [], oauthConfiguration: { authorizedOriginURLs: [] } } as CreateApplicationDto, { authorization: 'master' }, res)).rejects.toThrow(
              InternalServerErrorException,
            );
        
            expect(prismaService.application.create).toHaveBeenCalledWith({
              data: expect.any(Object),
            });
          });

        it('should create application successfully', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'minio-tenant' } });
            PrismaServiceMock.tenant.findUnique.mockResolvedValue({ accessTokenSigningKeysId: 'key1', idTokenSigningKeysId: 'key2', data: JSON.stringify({ accessTokenSigningKeysID: 'key1', idTokenSigningKeysID: 'key2', refreshTokenTimeToLiveInMinutes: 10, timeToLiveInSeconds: 10 }) });
            PrismaServiceMock.application.findUnique.mockResolvedValue(null);
            PrismaServiceMock.application.create.mockResolvedValue({ id: 'uuid' });
            const res = mockResponse();
            await service.createApplication('uuid', { name: 'appName', roles: [], scopes: [], oauthConfiguration: { authorizedOriginURLs: [] } } as CreateApplicationDto, { authorization: 'master' }, res);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: 'Application created successfully!',
                data: { id: 'uuid' },
            });
        });


    });

    describe('patchApplication', () => {
        it('should throw UnauthorizedException if route validation fails', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: false, message: 'Unauthorized' });
            const res = mockResponse();
            await expect(service.patchApplication('id', {} as UpdateApplicationDto, {}, res)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw BadRequestException if no id is provided', async () => {
            const res = mockResponse();
            await expect(service.patchApplication(null, {} as UpdateApplicationDto, {}, res)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if no data is provided', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'tenantId' } });
            const res = mockResponse();
            await expect(service.patchApplication('id', null, {}, res)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if application does not exist', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'tenantId' } });
            PrismaServiceMock.application.findUnique.mockResolvedValue(null);
            const res = mockResponse();
            await expect(service.patchApplication('id', {} as UpdateApplicationDto, {}, res)).rejects.toThrow(BadRequestException);
        });

        it('should throw UnauthorizedException if tenantId does not match and tenantsId is not null', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'differentTenantId' } });
            PrismaServiceMock.application.findUnique.mockResolvedValue({ id: 'id', tenantId: 'tenantId', data: JSON.stringify({}) });
            const res = mockResponse();
            await expect(service.patchApplication('id', { name: 'newName', oauthConfiguration: { authorizedOriginURLs: [] } } as UpdateApplicationDto, {}, res)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw InternalServerError while updating the application', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'tenantId' } });
            PrismaServiceMock.application.findUnique.mockResolvedValue({ id: 'id', tenantId: 'tenantId', data: JSON.stringify({}) });

            const error = new Error('Unique constraint failed on the fields: (`name`,`tenantId`)');
            jest.spyOn(prismaService.application, 'update').mockRejectedValue(error);
            const res = {
                send: jest.fn(),
            } as unknown as Response;
            await expect(service.patchApplication('id', {} as UpdateApplicationDto, {}, res)).rejects.toThrow(
                InternalServerErrorException,
            );
        });

        it('should update application successfully', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'tenantId' } });
            PrismaServiceMock.application.findUnique.mockResolvedValue({ id: 'id', tenantId: 'tenantId', data: JSON.stringify({}) });
            PrismaServiceMock.application.update.mockResolvedValue({ id: 'id' });
            const res = mockResponse();
            await service.patchApplication('id', { name: 'newName', oauthConfiguration: { authorizedOriginURLs: [] } } as UpdateApplicationDto, {}, res);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: 'Application updated successfully!',
                data: { id: 'id' },
            });
        });
    });

    describe('returnAllApplications', () => {
        it('should throw UnauthorizedException if authorization header verification fails', async () => {
            HeaderAuthServiceMock.authorizationHeaderVerifier.mockResolvedValue({ success: false, message: 'Unauthorized' });
            await expect(service.returnAllApplications({})).rejects.toThrow(UnauthorizedException);
        });

        it('should return all applications successfully', async () => {
            HeaderAuthServiceMock.authorizationHeaderVerifier.mockResolvedValue({ success: true });
            PrismaServiceMock.application.findMany.mockResolvedValue([{ id: '1' }, { id: '2' }]);
            PrismaServiceMock.applicationRole.findMany.mockResolvedValue([]);
            PrismaServiceMock.applicationOauthScope.findMany.mockResolvedValue([]);
            const result = await service.returnAllApplications({});
            expect(result.success).toBe(true);
            expect(result.data.length).toBe(2);
        });
    });

    describe('returnAnApplication', () => {
        it('should throw UnauthorizedException if route validation fails', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: false, message: 'Unauthorized' });
            await expect(service.returnAnApplication('id', {})).rejects.toThrow(UnauthorizedException);
        });

        it('should throw BadRequestException if no id is provided', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'minio-tenant' } });
            await expect(service.returnAnApplication(null, { authorization: 'master' })).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if application does not exist', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'tenantId' } });
            PrismaServiceMock.application.findUnique.mockResolvedValue(null);
            await expect(service.returnAnApplication('app-id', {})).rejects.toThrow(BadRequestException);
        });

        it('should throw UnauthorizedException if tenantId does not match and tenantsId is not null', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'differentTenantId' } });
            PrismaServiceMock.application.findUnique.mockResolvedValue({ id: 'id', tenantId: 'tenantId', data: JSON.stringify({}) });
            const res = mockResponse();
            await expect(service.returnAnApplication('id', {})).rejects.toThrow(UnauthorizedException);
        });

        it('should return an application successfully', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'tenant_id' } });
            PrismaServiceMock.application.findUnique.mockResolvedValue({ id: 'id', tenantId: 'tenant_id' });
            const result = await service.returnAnApplication('id', { authorization: 'master' });
            expect(result.success).toBe(true);
            expect(result.data.application.id).toBe('id');
        });
    });

    describe('deleteApplication', () => {
        it('should throw UnauthorizedException if route validation fails', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: false, message: 'Unauthorized' });
            await expect(service.deleteApplication('id', true, {})).rejects.toThrow(UnauthorizedException);
        });

        it('should throw BadRequestException if application does not exist', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'tenantId' } });
            PrismaServiceMock.application.findUnique.mockResolvedValue(null);
            await expect(service.deleteApplication('app-id', true, {})).rejects.toThrow(BadRequestException);
        });

        it('should throw UnauthorizedException if tenantId does not match and tenantsId is not null', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'differentTenantId' } });
            PrismaServiceMock.application.findUnique.mockResolvedValue({ id: 'id', tenantId: 'tenantId', data: JSON.stringify({}) });
            const res = mockResponse();
            await expect(service.deleteApplication('id', true, {})).rejects.toThrow(UnauthorizedException);
        });

        it('should throw InternalServerError while updating the application', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'tenantId' } });
            PrismaServiceMock.application.findUnique.mockResolvedValue({ id: 'id', tenantId: 'tenantId', data: JSON.stringify({}) });

            const error = new Error('Unique constraint failed on the fields: (`name`,`tenantId`)');
            jest.spyOn(prismaService.application, 'delete').mockRejectedValue(error);
            const res = {
                send: jest.fn(),
            } as unknown as Response;
            await expect(service.deleteApplication('id',true, {})).rejects.toThrow(InternalServerErrorException);
        });

        it('should delete application softly', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'tenantId' } });
            PrismaServiceMock.application.findUnique.mockResolvedValue({ id: 'id', tenantId: 'tenantId' });
            PrismaServiceMock.application.delete.mockResolvedValue({ id: 'id' });
            PrismaServiceMock.publicKeys.deleteMany.mockResolvedValue({});
            const result = await service.deleteApplication('id', false, {});
            expect(result.success).toBe(true);
            expect(result.message).toBe('Application soft deleted/inactive');
        });

        it('should delete application successfully', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'tenantId' } });
            PrismaServiceMock.application.findUnique.mockResolvedValue({ id: 'id', tenantId: 'tenantId' });
            PrismaServiceMock.application.delete.mockResolvedValue({ id: 'id' });
            PrismaServiceMock.publicKeys.deleteMany.mockResolvedValue({});
            const result = await service.deleteApplication('id', true, {});
            expect(result.success).toBe(true);
            expect(result.message).toBe('Application deleted Successfully!');
        });
    });

    describe('returnOauthConfiguration', () => {
        it('should throw UnauthorizedException if route validation fails', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: false, message: 'Unauthorized' });
            await expect(service.returnOauthConfiguration('id', {})).rejects.toThrow(UnauthorizedException);
        });

        it('should throw BadRequestException if no id is provided', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'tenantId' } });
            PrismaServiceMock.application.findUnique.mockResolvedValue(null);

            await expect(service.returnOauthConfiguration(null, {})).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if application does not exist', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'tenantId' } });
            PrismaServiceMock.application.findUnique.mockResolvedValue(null);
            const res = mockResponse();
            await expect(service.returnOauthConfiguration('id', {})).rejects.toThrow(BadRequestException);
        });

        it('should throw UnauthorizedException if tenantId does not match and tenantsId is not null', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'differentTenantId' } });
            PrismaServiceMock.application.findUnique.mockResolvedValue({ id: 'id', tenantId: 'tenantId', data: JSON.stringify({}) });
            const res = mockResponse();
            await expect(service.returnOauthConfiguration('id', {})).rejects.toThrow(UnauthorizedException);
        });

        it('should return OAuth configuration successfully', async () => {
            HeaderAuthServiceMock.validateRoute.mockResolvedValue({ success: true, data: { tenantsId: 'tenantId' } });
            PrismaServiceMock.application.findUnique.mockResolvedValue({ id: 'id', tenantId: 'tenantId' });
            PrismaServiceMock.tenant.findUnique.mockResolvedValue({ data: JSON.stringify({ oauthConfiguration: {} }) });
            const result = await service.returnOauthConfiguration('id', {});
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });
    });
    // describe('ApplicationService - storePublicKeys', () => {

    //     it('should return null if authorizedOriginURLS is empty', async () => {
    //       const result = await service['storePublicKeys']([], 'applicationId');
    //       expect(result).toBeNull();
    //     });

    //     it('should store public keys for valid URLs', async () => {
    //       const urls = ['https://example.com'];
    //       const publicKeyData = { success: true, data: 'publicKey' };
    //       UtilsServiceMock.getPublicKey.mockResolvedValue(publicKeyData);
    //       PrismaServiceMock.publicKeys.create.mockResolvedValue({});

    //       const result = await service['storePublicKeys'](urls, 'applicationId');

    //       expect(UtilsServiceMock.getPublicKey).toHaveBeenCalledWith('example.com');
    //       expect(PrismaServiceMock.publicKeys.create).toHaveBeenCalledWith({
    //         data: {
    //           hostname: 'example.com',
    //           publicKey: 'publicKey',
    //           applicationId: 'applicationId',
    //         },
    //       });
    //       expect(result).toHaveLength(1);
    //     });

    //     it('should handle errors when fetching public keys', async () => {
    //       const urls = ['https://example.com'];
    //       UtilsServiceMock.getPublicKey.mockRejectedValue(new Error('Network error'));

    //       const result = await service['storePublicKeys'](urls, 'applicationId');

    //       expect(logger.error).toHaveBeenCalledWith('Error on https://example.com while getting public key');
    //       expect(result).toHaveLength(0);
    //     });

    //     it('should filter out invalid public key responses', async () => {
    //       const urls = ['https://example.com', 'https://another.com'];
    //       UtilsServiceMock.getPublicKey
    //         .mockResolvedValueOnce({ success: true, data: 'publicKey' })
    //         .mockResolvedValueOnce({ success: false });

    //       PrismaServiceMock.publicKeys.create.mockResolvedValue({});

    //       const result = await service['storePublicKeys'](urls, 'applicationId');

    //       expect(UtilsServiceMock.getPublicKey).toHaveBeenCalledWith('example.com');
    //       expect(UtilsServiceMock.getPublicKey).toHaveBeenCalledWith('another.com');
    //       expect(PrismaServiceMock.publicKeys.create).toHaveBeenCalledTimes(1);
    //       expect(result).toHaveLength(1);
    //     });
    //   });
});
