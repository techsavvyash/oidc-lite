import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import * as uuid from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class KickstartService {
  private readonly logger: Logger;
  private readonly prismaService: PrismaService;
  constructor() {
    this.logger = new Logger(KickstartService.name);
    this.prismaService = new PrismaService();
  }

  async setupService() {
    const applicationCount = await this.prismaService.application.count();
    const tenantCount = await this.prismaService.tenant.count();
    const jwksCount = await this.prismaService.key.count();
    if (applicationCount !== 0 || tenantCount !== 0 || jwksCount !== 0) {
      return;
    }
    const fileName = process.env.KICKSTART_FILE_NAME;
    const hostName = `${process.env.HOST_NAME}:${process.env.HOST_PORT}`;

    if (!fileName || !hostName) {
      throw new Error(
        'Environment variables KICKSTART_FILE_NAME and HOST_NAME are required',
      );
    }
    const file = fs.readFileSync(path.resolve(`./${fileName}`), 'utf8').trim();
    const config = JSON.parse(file);
    
    const variables = config.variables;
    for (const key in variables) {
      if (variables[key] === '#{UUID()}') {
        variables[key] = uuid.v4();
      }
    }

    const replacePlaceholders = (
      str: string,
      vars: Record<string, string>,
    ): string => {
      return str.replace(/#\{([^}]+)\}/g, (_, key) => {
        return vars[key] || `#{${key}}`;
      });
    };

    const replaceObjectPlaceholders = (
      obj: any,
      vars: Record<string, string>,
    ): any => {
      if (typeof obj === 'string') {
        return replacePlaceholders(obj, vars);
      } else if (Array.isArray(obj)) {
        return obj.map((item) => replaceObjectPlaceholders(item, vars));
      } else if (typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
          newObj[key] = replaceObjectPlaceholders(obj[key], vars);
        }
        return newObj;
      }
      return obj;
    };

    const requests = config.requests.map((request) => {
      return {
        ...request,
        url: replacePlaceholders(request.url, variables),
        headers: replaceObjectPlaceholders(request.headers || {}, variables),
        body: replaceObjectPlaceholders(request.body || {}, variables),
      };
    });

    for (const request of requests) {
      const { method, url, headers, body } = request;
      const fullUrl = `${hostName}${url}`;

      try {
        const response = await axios({
          method,
          url: fullUrl,
          headers,
          data: body,
        });
        this.logger.log(
          `Request to ${fullUrl} succeeded with status ${response.status}`,
        );
      } catch (error) {
        this.logger.error(`Request to ${fullUrl} failed`, error.response?.data);
      }
    }
  }
}
