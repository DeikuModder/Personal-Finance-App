"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const express_1 = require("express");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bodyParser: false });
    app.setGlobalPrefix('api');
    app.use((0, express_1.json)({ limit: '6mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '6mb' }));
    app.enableCors({
        origin: (origin, callback) => {
            const allowedOrigins = (process.env.CORS_ORIGIN || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    const port = Number(process.env.PORT) || 3000;
    await app.listen(port);
    console.log(`FinTrack API listening on :${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map