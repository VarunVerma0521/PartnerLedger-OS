import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const prismaService = app.get(PrismaService);

  const globalPrefix = configService.get<string>('app.globalPrefix', 'api');
  const frontendOrigin = configService.get<string>(
    'app.frontendOrigin',
    'http://localhost:3000',
  );
  const websocketOrigin = configService.get<string>(
    'websocket.corsOrigin',
    frontendOrigin,
  );
  const port = configService.get<number>('app.port', 4000);

  app.setGlobalPrefix(globalPrefix);
  app.enableCors({
    origin: Array.from(new Set([frontendOrigin, websocketOrigin])),
    credentials: true,
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await prismaService.enableShutdownHooks(app);
  await app.listen(port);
}

void bootstrap();
