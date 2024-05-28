import {
  Controller,
  HttpStatus,
  Get,
  Res,
  Req,
  Logger,
  Body,
  Post,
  BadGatewayException,
  Headers,
  HttpException,
  Header,
} from '@nestjs/common';
import { AppService } from './app.service';
import axios from 'axios';
import { Request, Response } from 'express';

import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto, LoginDTO } from './dto/user.dto';
import { STATUS_CODES } from 'http';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags("User-OIDC")
@Controller()
export class AppController {
  private readonly logger: Logger;
  constructor(
    private readonly appService: AppService,
    private readonly userService: UserService,
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {this.logger = new Logger() }

  @Get('/health')
  @ApiOperation({summary : 'to prove the live status of website'})
  @ApiResponse({status:200, description : 'live status confirmed'})
  async getRoutesInfo() {
    return {
      "status": "live"  
    };
  }

  @Post('/login')
  @ApiOperation({summary : "creates an opaque token for a user logined if no resource parameter is given"})
  @ApiResponse({
    status : 200,
    description : 'jwt token or opaque token generated'
  })
  @ApiResponse({
    status : 400,
    description : 'Invalid credentials, username and password missing in body'
  })
  @ApiResponse({
    status : 401,
    description : 'Invalid resource type, send the resource in xyz:abc format'
  })
  @ApiResponse({
    status : 500,
    description : 'Internal server error'
  })
  @ApiBody({
    schema : {
      type : 'object',
      properties : {
        username : {
          type : 'string',
          example : 'ashu',
          description : 'this is name of user',
        },
        password : {
          type : 'string',
          example : 'ashu',
          description : 'this is password of user',
        },
        scopes : {
          type : 'string',
          example : 'openid email profile',
          description : 'this displays scopes',
        }
      }
    }
  })
  async loginRoute(
    @Headers() headers : any,
    @Body() body: LoginDTO,
  ) {
    const { username, password, scopes, resource, grant_type } = body;
    const jwtToken = headers.cookies?.jwt;
    if (!jwtToken && (!username || !password)) {
      throw new BadGatewayException({
        STATUS_CODES: 400,
        error: 'Invalid Credentials',
        error_description: 'username, password missing in body',
      })
      return;
    }
    if (resource && !resource.includes(':')) {
      throw new BadGatewayException({
        STATUS_CODES : 401,
        error: 'Invalid resource type',
        error_description: 'Send the resource in xyz:abc format',
      })
      return;
    }
    
    const user = jwtToken
      ? await this.jwtService.verifyAsync(jwtToken, {
          secret: `${process.env.JWT_SECRET}`,
        })
      : await this.prismaService.user.findUnique({
          where: {
            username,
            password,
          },
        });
    if (!user) {
      throw new BadGatewayException({
        STATUS_CODES : 401,
        error: 'Invalid Credentials',
        error_description:
          "User with the given username and password doesn't exist",
      })
      return;
    }

    const finalScope = scopes ? scopes : 'openid';

    const headersList = {
      Accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${process.env.AUTHORIZATION_TOKEN}`,
    };
    const bodyContent = `grant_type=client_credentials&${resource ? `resource=${resource}` : ``}&scope=${finalScope}`;
    const reqOptions = {
      url: `${process.env.HOST_NAME}:${process.env.HOST_PORT}/oidc/token`,
      method: 'POST',
      headers: headersList,
      data: bodyContent,
    };
    const response = await axios.request(reqOptions);

    await this.userService.insertToken(user.id, response.data.access_token);

    if (!jwtToken) {
      const token = await this.jwtService.signAsync(
        {
          id: user.id,
          sub: response.data.access_token,
        },
        { secret: process.env.JWT_SECRET },
      );
      // res.cookie('jwt', token);
    } else {
      // res.cookie('jwt', jwtToken);
    }

    this.logger.log(`A user just login! uid: ${user.id}`);
    throw new HttpException({
      message: resource ? 'jwt token generated': 'opaque token generated',
      data: response.data
    }, HttpStatus.OK)
  }

  // for verifying opaque tokens
  @Post('/opaque-verify')
  @ApiOperation({summary : "verifies the generated opaque token"})
  @ApiResponse({
    status : 200,
    description : 'opaque token verified'
  })
  @ApiResponse({
    status : 401,
    description : 'No token is given'
  })
  @ApiResponse({
    status : 500,
    description : 'Internal server error'
  })
  @ApiBody({
    schema : {
      type : 'object',
      properties : {
        token : {
          type : 'string',
          example : "ybc38pCHaizks0bMFBbKhqy9ZKqawdHH6LV5ZcrshNn",
          description : 'this is auto generated opaque token',
        }
      }
    }
  })
  async opaque_verify(
    @Headers() headers : any,
    @Body('token') token: string)
    {
    if (!token) {
      throw new BadGatewayException({
        STATUS_CODES : 401,
        error: 'No token given',
        error_description: 'No token were given while calling the endpoint',
      })
      return;
    }

    const headersList = {
      Accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${process.env.AUTHORIZATION_TOKEN}`,
    };
    const bodyContent = `token=${token}`;
    const reqOptions = {
      url: `${process.env.HOST_NAME}:${process.env.HOST_PORT}/oidc/token/introspection`,
      method: 'POST',
      headers: headersList,
      data: bodyContent,
    };
    const response = await axios.request(reqOptions);

    return response.data;
  }

  // to verify jwt created tokens, whose public keys are available
  @Post('/jwt-verify')
  @ApiOperation({summary : "verifies the generated jwt token"})
  @ApiResponse({
    status : 200,
    description : 'jwt token verified'
  })
  @ApiResponse({
    status : 401,
    description : 'No token is given'
  })
  @ApiResponse({
    status : 500,
    description : 'Internal server error'
  })
  @ApiBody({
    schema : {
      type : 'object',
      properties : {
        token : {
          type : 'string',
          example : "eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCIsImtpZCI6IlRMcnZaeEp6U1JzbUc2aXNwYTU0RWFDbzFzZ1hUZmx2cmUwMEtPeUdDZncifQ.eyJqdGkiOiJYSktyZmNMaThyYnJKZWtldWJCMVIiLCJzdWIiOiJhcHAiLCJpYXQiOjE3MTY5MTMxMDYsImV4cCI6MTcxNjkxNjcwNiwic2NvcGUiOiJvcGVuaWQgZW1haWwgcHJvZmlsZSIsImNsaWVudF9pZCI6ImFwcCIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMCIsImF1ZCI6InN0ZW5jaWw6YXBpIn0.fTjzWUnPKrIjHJabhcey_s5JTHSCMwkxF2kk4uo6VOyWNDr5_vnJN5gBTVzxlwE7YjLWioafWLgmcBiod3fCXdCxLoQokajDc7k4Ib1ueAucMItKV1YbHL1OaQ4Mq66ls5fuD1LSi1XunoRJkLHeSX9i7kJsd-0eBfaWi32XTtDZjyNAlys8sW3bWDW_e4XimsWeqt10Tdf7ARLRkjHhnLfrHUB33t8DASjSWdjpmi8YVnwpmB1au8Wj2MSWI1BrDxladt0blkmVVE3okoX6QXSn_WLiFNC4mY30ExTM1QMow-4pH0FrBMgkjSRgnARGSKVa-RyqIq2ocg2XY1nTbQ",
          description : 'this is auto generated jwt token',
        }
      }
    }
  })
  async jwt_verify(@Body('token') token: string){
    if (!token) {
      return ({
        error: 'No token given',
        error_description: 'No token were given while calling the endpoint',
      });
    }

    const val = await this.jwtService.decode(token,{complete: true});

    return val;
  }

  @Post('/signup')
  @ApiOperation({summary : "creates new user"})
  @ApiResponse({
    status : 200,
    description : 'user created successfully'
  })
  @ApiResponse({
    status : 400,
    description : 'Invalid fields'
  })
  @ApiResponse({
    status : 401,
    description : 'Duplicate entry'
  })
  @ApiResponse({
    status : 500,
    description : 'Internal server error'
  })
  @ApiBody({
    schema : {
      type : 'object',
      properties : {
        username : {
          type : 'string',
          example : 'ashu',
          description : 'this is name of user',
        },
        password : {
          type : 'string',
          example : 'ashu',
          description : 'this is password of user',
        },
        email : {
          type : 'integer',
          example : 'ashu@gmail.com',
          description : 'this is email id of user',
        },
        birthdate : {
          type : 'integer',
          example : '23-04-2023',
          description : 'this is birthdate of user',
        },
        gender : {
          type : 'string',
          example : 'Male',
          description : 'this gender of user'
        }
      }
    }
  })
  async signupRoute(
    @Headers() headers : any,
    @Body()
    body: CreateUserDto,
  ) {
    const { username, password, gender, birthdate, email } = body;
    if (!username || !password || !gender || !birthdate || !email) {
      throw new BadGatewayException({
        STATUS_CODES : 400,
        error: 'Invalid fields',
        error_description:
          'username, password, gender, birthdate, email all in string format required',
      })
      return;
    }
    const user = await this.prismaService.user.findUnique({
      where: {
        username: username,
        email: email,
      },
    });
    if (user) {
      throw new BadGatewayException({
        STATUS_CODES : 401,
        error: 'Duplicate entry',
        error_description: 'User already exists',
      })
      return;
    }
    const newUser = await this.prismaService.user.create({ data: body });
    this.logger.log('New user registered!', newUser);
    throw new HttpException({
      message: 'user created successfully',
      newUser,
    }, HttpStatus.OK)
  }
}
