import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
    // Increase the limit (e.g., 20mb)
    app.use(bodyParser.json({ limit: '20mb' }));
    app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));

  app.setGlobalPrefix('v1');

  // Enable CORS for your frontend
  app.enableCors({
    origin: '*', // <-- change to your actual frontend URL
    credentials: true,
  });

  // Register global filter and interceptor using DI
  app.useGlobalInterceptors(app.get(TransformInterceptor));
  app.useGlobalFilters(app.get(GlobalExceptionFilter));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  const config = new DocumentBuilder()
    .setTitle('Your API')
    .setDescription('API of Supergram')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
