import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express, Request, Response } from 'express';

let cachedServer: Express;

async function bootstrapServer(): Promise<Express> {
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter);

  // Enable CORS for frontend Nuxt integration
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.init();
  return expressApp;
}

// Standalone server for local development & Docker
if (!process.env.VERCEL) {
  const port = process.env.PORT ?? 3000;
  bootstrapServer().then((server) => {
    server.listen(port, () => {
      console.log(`[NestJS Server] Application is running on: http://localhost:${port}`);
    });
  });
}

// Vercel Serverless Function Handler
export default async function handler(req: Request, res: Response) {
  try {
    if (!cachedServer) {
      cachedServer = await bootstrapServer();
    }
    return cachedServer(req, res);
  } catch (err: any) {
    console.error('Serverless bootstrap error:', err);
    return res.status(500).json({
      statusCode: 500,
      error: 'Internal Server Error',
      message: err?.message || 'Bootstrap error',
    });
  }
}
