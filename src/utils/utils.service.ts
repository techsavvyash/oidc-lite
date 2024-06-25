import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UtilsService {
  private readonly logger: Logger;
  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger(UtilsService.name);
  }

  async checkValidityOfToken(token: string, verifier: string, type: string) {
    if (type === 'refresh') {
      const tokenData = await this.prismaService.refreshToken.findUnique({
        where: { token },
      });
      if (!tokenData) {
        return {
          active: false,
        };
      }
    } else if (type !== 'access' && type !== 'id') {
      return {
        active: false,
      };
    }
    try {
      const tokenVerify = jwt.verify(token, verifier);
      const now = Math.floor(Date.now() / 1000);
      if ((tokenVerify as jwt.JwtPayload).exp <= now) {
        return {
          active: false,
        };
      }
      return {
        ...(tokenVerify as jwt.JwtPayload),
      };
    } catch (error) {
      return {
        active: false,
      };
    }
  }
}
