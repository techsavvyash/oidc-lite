import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { randomInt } from 'crypto';

interface UserInfo {
  applicationId: string;
  email: string;
  active: boolean;
  userData: {
    username: string;
    email: string;
    password: string;
  };
  membership: string[];
}

interface RegistrationInfo {
  generateAuthenticationToken: boolean;
  applicationId: string;
  roles: string[];
}

interface UserRequest {
  data: {
    userInfo: UserInfo;
    registrationInfo: RegistrationInfo;
  };
}

@Injectable()
export class TestUsersService {
  private readonly baseUrl = 'http://localhost:3000/user/registration/combined';
  private readonly headers = {
    Authorization: 'master',
    'x-stencil-tenantid': 'minio-tenant',
  };

  private generateRandomString(length: number): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  private createUser(index: number): UserRequest {
    const username = `user${index}`;
    const email = `${username}@example.com`;
    const password = this.generateRandomString(10);

    return {
      data: {
        userInfo: {
          applicationId: 'myminioadmin',
          email: email,
          active: true,
          userData: {
            username: username,
            email: email,
            password: password,
          },
          membership: ['first-group', 'second-group'],
        },
        registrationInfo: {
          generateAuthenticationToken: true,
          applicationId: 'myminioadmin',
          roles: ['admin', 'common'],
        },
      },
    };
  }

  public async registerUsers(): Promise<any[]> {
    const requests = [];
    for (let i = 0; i < 100; i++) {
      const userRequest = this.createUser(100 + i);
      requests.push(
        axios.post(this.baseUrl, userRequest, { headers: this.headers }),
      );
    }
    return Promise.all(requests);
  }
}
