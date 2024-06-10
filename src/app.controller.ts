import {
  Controller,
  Get,
  Logger,
  Body,
  Post,
  Headers,
} from '@nestjs/common';
import { AppService } from './app.service';

import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto, LoginDTO } from './user/user.dto';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('User-OIDC')
@Controller()
export class AppController {
  private readonly logger: Logger;
  constructor(
    private readonly appService: AppService,
    private readonly userService: UserService,
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.logger = new Logger();
  }

  @Get('/health')
  @ApiOperation({ summary: 'to prove the live status of website' })
  @ApiResponse({ status: 200, description: 'live status confirmed' })
  async getRoutesInfo() {
    return {
      status: 'live',
    };
  }

  @Post('/login')
  @ApiOperation({
    summary:
      'creates an opaque token for a user logined if no resource parameter is given',
  })
  @ApiResponse({
    status: 200,
    description: 'opaque token generated',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          message: {
            type: 'String',
            description: 'this shows the generated message for given input ',
            example: 'jwt token generated ',
          },
          data: {
            type: 'object',
            properties: {
              access_tokens: {
                type: 'String',
                description: 'this is the generated opaque token ',
                example:
                  'eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCIsImtpZCI6IlRMcnZaeEp6U1JzbUc2aXNwYTU0RWFDbzFzZ1hUZmx2cmUwMEtPeUdDZncifQ.eyJqdGkiOiJYSktyZmNMaThyYnJKZWtldWJCMVIiLCJzdWIiOiJhcHAiLCJpYXQiOjE3MTY5MTMxMDYsImV4cCI6MTcxNjkxNjcwNiwic2NvcGUiOiJvcGVuaWQgZW1haWwgcHJvZmlsZSIsImNsaWVudF9pZCI6ImFwcCIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMCIsImF1ZCI6InN0ZW5jaWw6YXBpIn0.fTjzWUnPKrIjHJabhcey_s5JTHSCMwkxF2kk4uo6VOyWNDr5_vnJN5gBTVzxlwE7YjLWioafWLgmcBiod3fCXdCxLoQokajDc7k4Ib1ueAucMItKV1YbHL1OaQ4Mq66ls5fuD1LSi1XunoRJkLHeSX9i7kJsd-0eBfaWi32XTtDZjyNAlys8sW3bWDW_e4XimsWeqt10Tdf7ARLRkjHhnLfrHUB33t8DASjSWdjpmi8YVnwpmB1au8Wj2MSWI1BrDxladt0blkmVVE3okoX6QXSn_WLiFNC4mY30ExTM1QMow-4pH0FrBMgkjSRgnARGSKVa-RyqIq2ocg2XY1nTbQ',
              },
              expires_in: {
                type: 'integer',
                description: 'this is the expiry time of the token',
                example: '600',
              },
              token_type: {
                type: 'String',
                description: 'this shows the type of token ',
                example: 'Bearer',
              },
              scope: {
                type: 'String',
                description: 'this is the scope of token',
                example: 'openid email profile',
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid credentials, username and password missing in body',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          message: {
            type: 'String',
            description: 'this shows the generated message for given input ',
            example:
              'Invalid credentials, username and password missing in body',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid resource type, send the resource in xyz:abc format',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          message: {
            type: 'String',
            description: 'this shows the generated message for given input ',
            example:
              'Invalid resource type, send the resource in xyz:abc format',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          message: {
            type: 'String',
            description: 'this shows the generated message for given input ',
            example: 'Internal server error',
          },
        },
      },
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          example: 'ashu',
          description: 'this is name of user',
        },
        password: {
          type: 'string',
          example: 'ashu',
          description: 'this is password of user',
        },
        scopes: {
          type: 'string',
          example: 'openid email profile',
          description: 'this displays scopes',
        },
      },
    },
  })
  async loginRoute(@Headers() headers: any, @Body() body: LoginDTO) {
    return this.appService.loginService(headers, body);
  }

  // for verifying opaque tokens
  @Post('/opaque-verify')
  @ApiOperation({ summary: 'verifies the generated opaque token' })
  @ApiResponse({
    status: 200,
    description: 'opaque token verified',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          active: {
            type: 'Boolean',
            description: 'this shows the generated message for given input ',
            example: 'true',
          },
          client_id: {
            type: 'String',
            description: 'this is the generated opaque token ',
            example: 'app',
          },
          exp: {
            type: 'integer',
            description: 'this is the expiry time of the token',
            example: '1716913835',
          },
          iat: {
            type: 'integer',
            description: 'this shows the type of token ',
            example: '1716913235',
          },
          iss: {
            type: 'String',
            description: 'this is the scope of token',
            example: 'http://localhost:3000',
          },
          scope: {
            type: 'String',
            description: 'this is the scope of token',
            example: 'openid',
          },
          token_type: {
            type: 'String',
            description: 'this is the scope of token',
            example: 'Bearer',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No token is given',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          message: {
            type: 'String',
            description: 'this shows the generated message for given input ',
            example:
              'Invalid credentials, username and password missing in body',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          message: {
            type: 'String',
            description: 'this shows the generated message for given input ',
            example:
              'Invalid credentials, username and password missing in body',
          },
        },
      },
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          example: 'ybc38pCHaizks0bMFBbKhqy9ZKqawdHH6LV5ZcrshNn',
          description: 'this is auto generated opaque token',
        },
      },
    },
  })
  async opaque_verify(@Body('token') token: string) {
    return this.appService.opaqueTokenVerifyService(token);
  }

  // to verify jwt created tokens, whose public keys are available
  @Post('/jwt-verify')
  @ApiOperation({ summary: 'verifies the generated jwt token' })
  @ApiResponse({
    status: 200,
    description: 'jwt token verified',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          header: {
            type: 'object',
            properties: {
              alg: {
                type: 'String',
                description: 'this is the scope of token',
                example: 'RS256',
              },
              typ: {
                type: 'String',
                description: 'this is the scope of token',
                example: 'at+jwt',
              },
              kid: {
                type: 'String',
                description: 'this is the scope of token',
                example: 'TLrvZxJzSRsmG6ispa54EaCo1sgXTflvre00KOyGCfw',
              },
            },
          },
          payload: {
            type: 'object',
            properties: {
              jti: {
                type: 'String',
                description: 'this is the scope of token',
                example: 'XJKrfcLi8rbrJekeubB1R',
              },
              sub: {
                type: 'String',
                description: 'this is the scope of token',
                example: 'app',
              },
              iat: {
                type: 'integer',
                description: 'this is the scope of token',
                example: '1716913106',
              },
              exp: {
                type: 'integer',
                description: 'this is the scope of token',
                example: '1716916706',
              },
              scope: {
                type: 'String',
                description: 'this is the scope of token',
                example: 'openid email profile',
              },
              client_id: {
                type: 'String',
                description: 'this is the scope of token',
                example: 'app',
              },
              iss: {
                type: 'String',
                description: 'this is the scope of token',
                example: 'http://localhost:3000',
              },
              aud: {
                type: 'String',
                description: 'this is the scope of token',
                example: 'stencil:api',
              },
            },
          },
          signature: {
            type: 'string',
            example:
              'fTjzWUnPKrIjHJabhcey_s5JTHSCMwkxF2kk4uo6VOyWNDr5_vnJN5gBTVzxlwE7YjLWioafWLgmcBiod3fCXdCxLoQokajDc7k4Ib1ueAucMItKV1YbHL1OaQ4Mq66ls5fuD1LSi1XunoRJkLHeSX9i7kJsd-0eBfaWi32XTtDZjyNAlys8sW3bWDW_e4XimsWeqt10Tdf7ARLRkjHhnLfrHUB33t8DASjSWdjpmi8YVnwpmB1au8Wj2MSWI1BrDxladt0blkmVVE3okoX6QXSn_WLiFNC4mY30ExTM1QMow-4pH0FrBMgkjSRgnARGSKVa-RyqIq2ocg2XY1nTbQ',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No token is given',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          message: {
            type: 'String',
            description: 'this shows the generated message for given input ',
            example:
              'Invalid credentials, username and password missing in body',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          message: {
            type: 'String',
            description: 'this shows the generated message for given input ',
            example:
              'Invalid credentials, username and password missing in body',
          },
        },
      },
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          example:
            'eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCIsImtpZCI6IlRMcnZaeEp6U1JzbUc2aXNwYTU0RWFDbzFzZ1hUZmx2cmUwMEtPeUdDZncifQ.eyJqdGkiOiJYSktyZmNMaThyYnJKZWtldWJCMVIiLCJzdWIiOiJhcHAiLCJpYXQiOjE3MTY5MTMxMDYsImV4cCI6MTcxNjkxNjcwNiwic2NvcGUiOiJvcGVuaWQgZW1haWwgcHJvZmlsZSIsImNsaWVudF9pZCI6ImFwcCIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMCIsImF1ZCI6InN0ZW5jaWw6YXBpIn0.fTjzWUnPKrIjHJabhcey_s5JTHSCMwkxF2kk4uo6VOyWNDr5_vnJN5gBTVzxlwE7YjLWioafWLgmcBiod3fCXdCxLoQokajDc7k4Ib1ueAucMItKV1YbHL1OaQ4Mq66ls5fuD1LSi1XunoRJkLHeSX9i7kJsd-0eBfaWi32XTtDZjyNAlys8sW3bWDW_e4XimsWeqt10Tdf7ARLRkjHhnLfrHUB33t8DASjSWdjpmi8YVnwpmB1au8Wj2MSWI1BrDxladt0blkmVVE3okoX6QXSn_WLiFNC4mY30ExTM1QMow-4pH0FrBMgkjSRgnARGSKVa-RyqIq2ocg2XY1nTbQ',
          description: 'this is auto generated jwt token',
        },
      },
    },
  })
  async jwt_verify(@Body('token') token: string) {
    return this.appService.jwtTokenVerifyService(token);
  }

  @Post('/signup')
  @ApiOperation({ summary: 'creates new user' })
  @ApiResponse({
    status: 200,
    description: 'user created successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          message: {
            type: 'String',
            description: 'this is the descirption generated',
            example: 'User created successfully ',
          },
          newUser: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'this is the id of user ',
                example: '17',
              },
              birthdate: {
                type: 'string',
                description: 'this is the DOB of user',
                example: '23-04-2023',
              },
              gender: {
                type: 'String',
                description: 'this is the gender of user',
                example: 'Male',
              },
              username: {
                type: 'String',
                description: 'this is username taken by user',
                example: 'ashu',
              },
              email: {
                type: 'String',
                description: 'this is email id of user',
                example: 'ashu@gmail.com',
              },
              password: {
                type: 'String',
                description: 'this is the password of user',
                example: 'ashu',
              },
              token: {
                type: 'String',
                description: 'this is token generated for user',
                example: 'null',
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid fields',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          message: {
            type: 'String',
            description: 'this shows the generated message for given input ',
            example: 'Invalid fields',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Duplicate entry',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          message: {
            type: 'String',
            description: 'this shows the generated message for given input ',
            example: 'Duplicate entry',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          message: {
            type: 'String',
            description: 'this shows the generated message for given input ',
            example: 'Internal server error',
          },
        },
      },
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          example: 'ashu',
          description: 'this is name of user',
        },
        password: {
          type: 'string',
          example: 'ashu',
          description: 'this is password of user',
        },
        email: {
          type: 'integer',
          example: 'ashu@gmail.com',
          description: 'this is email id of user',
        },
        birthdate: {
          type: 'integer',
          example: '23-04-2023',
          description: 'this is birthdate of user',
        },
        gender: {
          type: 'string',
          example: 'Male',
          description: 'this gender of user',
        },
      },
    },
  })
  async signupRoute(
    @Headers() headers: any,
    @Body()
    body: CreateUserDto,
  ) {
    return this.appService.signupService(body);
  }
}
