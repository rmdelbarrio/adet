import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
// Import the necessary types for the CORS configuration callback
import { CorsOptions, CorsOptionsDelegate } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
    dotenv.config();
    const app = await NestFactory.create(AppModule);
    const port = process.env.PORT || 3000;
    
    // Define your Vercel URL here to replace the generic /\.vercel\.app$/ regex if preferred
    const vercelDomain = 'https://p7-caym.vercel.app'; // Your specific deployed URL

    const allowedOrigins = [
        'https://nextjs-aut.onrender.com', // Original origin
        'http://localhost:3000', // For local testing
        vercelDomain, // Your specific Vercel URL
        /\.vercel\.app$/, // Fallback for Vercel preview domains
    ];

    // FIX: Use CorsOptionsDelegate type for strict TypeScript mode
    const originDelegate: CorsOptionsDelegate = (origin, callback) => {
        // If the origin is not set (e.g., direct API call), allow it
        if (!origin) {
            callback(null, true);
            return;
        }

        const isAllowed = allowedOrigins.some(pattern => {
            if (typeof pattern === 'string') {
                return origin === pattern;
            }
            if (pattern instanceof RegExp) {
                return pattern.test(origin);
            }
            return false;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            // Logging the blocked origin is helpful for debugging
            console.error(`CORS blocked request from origin: ${origin}`);
            callback(new Error(`Not allowed by CORS: ${origin}`), false);
        }
    };


    app.enableCors({
        origin: originDelegate,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    } as CorsOptions); // We cast to CorsOptions because the type system supports the delegate property

    await app.listen(port);
    console.log(`server listening on: http://localhost:${port}`);
}
bootstrap();
