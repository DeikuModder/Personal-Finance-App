export declare class MailService {
    private readonly logger;
    private transporter;
    private getTransport;
    sendOtpCode(email: string, code: string): Promise<void>;
}
