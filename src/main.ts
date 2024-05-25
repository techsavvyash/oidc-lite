import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import {urlencoded} from "body-parser";
import { resolve } from 'path';
import * as bodyParser from 'body-parser';

import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.useStaticAssets(resolve('./src/public'));
  app.setBaseViewsDir(resolve('./src/views'));
  app.setViewEngine('ejs');
  app.enableCors();
  app.use(cookieParser());
  app.use(bodyParser.json());

  app.use('/interaction', urlencoded({ extended: false }));


  await app.listen(3000);
}
bootstrap();
