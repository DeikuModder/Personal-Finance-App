"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer_1 = require("nodemailer");
let MailService = MailService_1 = class MailService {
    constructor() {
        this.logger = new common_1.Logger(MailService_1.name);
        this.transporter = null;
    }
    getTransport() {
        const host = process.env.SMTP_HOST;
        if (!host) {
            return null;
        }
        if (!this.transporter) {
            const user = process.env.SMTP_USER;
            const pass = process.env.SMTP_PASS;
            const port = Number(process.env.SMTP_PORT) || 587;
            this.transporter = (0, nodemailer_1.createTransport)({
                host,
                port,
                secure: port === 465,
                auth: user && pass ? { user, pass } : undefined,
            });
        }
        return this.transporter;
    }
    async sendOtpCode(email, code) {
        const transport = this.getTransport();
        if (!transport) {
            this.logger.warn(`[OTP] No SMTP configured - sign-in code for ${email}: ${code}`);
            return;
        }
        const from = process.env.SMTP_FROM || 'FinTrack <no-reply@fintrack.app>';
        const text = [
            `Your FinTrack sign-in code is: ${code}`,
            '',
            'It expires in 10 minutes. If you did not request it, you can ignore this email.',
        ].join('\n');
        try {
            await transport.sendMail({
                from,
                to: email,
                subject: 'FinTrack sign-in code',
                text,
            });
        }
        catch (err) {
            this.logger.error(`Failed to send OTP email to ${email}`, err);
            throw new common_1.ServiceUnavailableException("We couldn't send the email right now. Try again in a moment.");
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)()
], MailService);
//# sourceMappingURL=mail.service.js.map