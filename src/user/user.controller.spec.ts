import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRegistrationService } from './user-registration/user-registration.service';
import { CreateUserAndUserRegistration, CreateUserDto, CreateUserRegistrationDto, UpdateUserDto, UpdateUserRegistrationDto } from './user.dto';
import { ResponseDto } from '../dto/response.dto';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UtilsService } from '../utils/utils.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;
  let userRegistrationService: UserRegistrationService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            createAUser: jest.fn(),
            returnAUser: jest.fn(),
            updateAUser: jest.fn(),
            deleteAUser: jest.fn(),
          },
        },
        {
          provide: UserRegistrationService,
          useValue: {
            createAUserAndUserRegistration: jest.fn(),
            createAUserRegistration: jest.fn(),
            returnAUserRegistration: jest.fn(),
            updateAUserRegistration: jest.fn(),
            deleteAUserRegistration: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            userRegistration: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: UtilsService,
          useValue: {
            generateRandomUUID: jest.fn(),
          },
        }
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    userRegistrationService = module.get<UserRegistrationService>(UserRegistrationService)
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  const mockUserDataDto = {
    username: 'JohnDoe',
    firstname: 'John',
    lastname: 'Doe',
    password: 'Password123!',
  };

  const mockCreateUserDto: CreateUserDto = {
    active: true,
    additionalData: { key: 'value' }, // or simply a string "additional info"
    membership: ['premium', 'newsletter'],
    userData: mockUserDataDto,
    email: 'jane.doe@example.com',
  };

  describe('createAUserWithRandomUUID', () => {
    it('should create a user with a random UUID', async () => {
      const mockHeaders = {}; // mock headers
      const mockResponseDto: ResponseDto = {
        success: true,
        message: 'User created successfully',
        data: { id: '123', username: 'JohnDoe' },
      };
      const mockUUID = randomUUID();

      jest.spyOn(userService, 'createAUser').mockResolvedValue(mockResponseDto);

      const result = await controller.createAUserWithRandomUUID(
        mockCreateUserDto,
        mockHeaders,
      );

      expect(userService.createAUser).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining(mockCreateUserDto),
        expect.objectContaining(mockHeaders),
      );
      expect(result).toBe(mockResponseDto);
    });
  });

  describe('createAUser', () => {
    it('should create a user with a specific ID', async () => {
      const mockId = '123';
      const mockHeaders = {}; // mock headers
      const mockResponseDto: ResponseDto = {
        success: true,
        message: 'User created successfully',
        data: { id: '123', username: 'JohnDoe' },
      };

      jest.spyOn(userService, 'createAUser').mockResolvedValue(mockResponseDto);

      const result = await controller.createAUser(
        mockId,
        mockCreateUserDto,
        mockHeaders,
      );

      expect(userService.createAUser).toHaveBeenCalledWith(
        mockId,
        expect.objectContaining(mockCreateUserDto),
        expect.objectContaining(mockHeaders),
      );
      expect(result).toBe(mockResponseDto);
    });
  });
  describe('returnAUser', () => {
    it('should return a user by ID', async () => {
      const mockId = '123';
      const mockHeaders = {}; // mock headers
      const mockResponseDto: ResponseDto = {
        success: true,
        message: 'User retrieved successfully',
        data: { id: '123', username: 'JohnDoe' },
      };

      jest.spyOn(userService, 'returnAUser').mockResolvedValue(mockResponseDto);

      const result = await controller.returnAUser(mockId, mockHeaders);

      expect(userService.returnAUser).toHaveBeenCalledWith(
        mockId,
        expect.objectContaining(mockHeaders),
      );
      expect(result).toBe(mockResponseDto);
    });
  });
  describe('updateAUser', () => {
    it('should update a user by ID', async () => {
      const mockId = '123';
      const mockHeaders = {}; // mock headers
      const mockUpdateUserDto: UpdateUserDto = {
        active: false,
        additionalData: { key: 'value' }, // or simply a string "additional info"
        membership: ['newsletter'],
        userData: mockUserDataDto,
      };
      const mockResponseDto: ResponseDto = {
        success: true,
        message: 'User updated successfully',
        data: { id: '123', username: 'JohnDoe' },
      };

      jest.spyOn(userService, 'updateAUser').mockResolvedValue(mockResponseDto);

      const result = await controller.updateAUser(
        mockId,
        mockHeaders,
        mockUpdateUserDto,
      );

      expect(userService.updateAUser).toHaveBeenCalledWith(
        mockId,
        expect.objectContaining(mockUpdateUserDto),
        expect.objectContaining(mockHeaders),
      );
      expect(result).toBe(mockResponseDto);
    });
  });
  describe('deleteAUser', () => {
    it('should delete a user by ID', async () => {
      const mockId = '123';
      const mockHeaders = {}; // mock headers
      const mockHardDelete = 'true';
      const mockResponseDto: ResponseDto = {
        success: true,
        message: 'User deleted successfully',
        data: null,
      };

      jest.spyOn(userService, 'deleteAUser').mockResolvedValue(mockResponseDto);

      const result = await controller.deleteAUser(
        mockId,
        mockHeaders,
        mockHardDelete,
      );

      expect(userService.deleteAUser).toHaveBeenCalledWith(
        mockId,
        expect.objectContaining(mockHeaders),
        mockHardDelete,
      );
      expect(result).toBe(mockResponseDto);
    });
  });
  describe('createAUserAndUserRegistration', () => {
    it('should create a user and user registration', async () => {
      const mockData: CreateUserAndUserRegistration = {
        userInfo: mockCreateUserDto,
        registrationInfo: {
          generateAuthenticationToken: true,
          applicationId: '123',
          data: { key: 'value' }, // or simply a string "additional info"
          registrationId: '456',
        }
      };
      const mockHeaders = {}; // mock headers
      const mockResponseDto: ResponseDto = {
        success: true,
        message: 'User and user registration created successfully',
        data: { id: '123', username: 'JohnDoe' },
      };
      const mockUUID = randomUUID();

      jest.spyOn(userRegistrationService, 'createAUserAndUserRegistration').mockResolvedValue(mockResponseDto);

      const result = await controller.createAUserAndUserRegistration(
        mockData,
        mockHeaders,
      );

      expect(userRegistrationService.createAUserAndUserRegistration).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining(mockData),
        expect.objectContaining(mockHeaders),
      );
      expect(result).toBe(mockResponseDto);
    });
  });
  describe('createAUserRegistration', () => {
    it('should create a user registration', async () => {
      const mockUserId = '123';
      const mockData: CreateUserRegistrationDto = {
        generateAuthenticationToken: true,
        applicationId: '123',
        data: { key: 'value' }, // or simply a string "additional info"
        registrationId: '456',
      };
      const mockHeaders = {}; // mock headers
      const mockResponseDto: ResponseDto = {
        success: true,
        message: 'User registration created successfully',
        data: null,
      };

      jest.spyOn(userRegistrationService, 'createAUserRegistration').mockResolvedValue(mockResponseDto);

      const result = await controller.createAUserRegistration(
        mockUserId,
        mockData,
        mockHeaders,
      );

      expect(userRegistrationService.createAUserRegistration).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining(mockData),
        expect.objectContaining(mockHeaders),
      );
      expect(result).toBe(mockResponseDto);
    });
  });
  describe('returnAUserRegistration', () => {
    it('should return a user registration', async () => {
      const mockUserId = '123';
      const mockApplicationId = '456';
      const mockHeaders = {}; // mock headers
      const mockResponseDto: ResponseDto = {
        success: true,
        message: 'User registration retrieved successfully',
        data: null,
      };

      jest.spyOn(userRegistrationService, 'returnAUserRegistration').mockResolvedValue(mockResponseDto);

      const result = await controller.returnAUserRegistration(
        mockUserId,
        mockApplicationId,
        mockHeaders,
      );

      expect(userRegistrationService.returnAUserRegistration).toHaveBeenCalledWith(
        mockUserId,
        mockApplicationId,
        expect.objectContaining(mockHeaders),
      );
      expect(result).toBe(mockResponseDto);
    });
  });
  describe('updateAUserRegistration', () => {
    it('should update a user registration', async () => {
      const mockUserId = '123';
      const mockApplicationId = '456';
      const mockData: UpdateUserRegistrationDto = {
        data: {
          code_challenge: '123',
          code_challenge_method: '456',
          scope: '789',
        },
        roles: ['admin', 'user'],
      };
      const mockHeaders = {}; // mock headers
      const mockResponseDto: ResponseDto = {
        success: true,
        message: 'User registration updated successfully',
        data: null,
      };

      jest.spyOn(userRegistrationService, 'updateAUserRegistration').mockResolvedValue(mockResponseDto);

      const result = await controller.updateAUserRegistration(
        mockUserId,
        mockApplicationId,
        mockData,
        mockHeaders,
      );

      expect(userRegistrationService.updateAUserRegistration).toHaveBeenCalledWith(
        mockUserId,
        mockApplicationId,
        expect.objectContaining(mockData),
        expect.objectContaining(mockHeaders),
      );
      expect(result).toBe(mockResponseDto);
    });
  });
  describe('deleteAUserRegistration', () => {
    it('should delete a user registration', async () => {
      const mockUserId = '123';
      const mockApplicationId = '456';
      const mockHeaders = {}; // mock headers
      const mockResponseDto: ResponseDto = {
        success: true,
        message: 'User registration deleted successfully',
        data: null,
      };

      jest.spyOn(userRegistrationService, 'deleteAUserRegistration').mockResolvedValue(mockResponseDto);

      const result = await controller.deleteAUserRegistration(
        mockUserId,
        mockApplicationId,
        mockHeaders,
      );

      expect(userRegistrationService.deleteAUserRegistration).toHaveBeenCalledWith(
        mockUserId,
        mockApplicationId,
        expect.objectContaining(mockHeaders),
      );
      expect(result).toBe(mockResponseDto);
    });
  });
});
