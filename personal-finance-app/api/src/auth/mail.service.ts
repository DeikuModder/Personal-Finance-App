import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  private getTransport(): Transporter | null {
    const host = process.env.SMTP_HOST;
    if (!host) {
      return null;
    }
    if (!this.transporter) {
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      const port = Number(process.env.SMTP_PORT) || 587;
      this.transporter = createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });
    }
    return this.transporter;
  }

  async sendOtpCode(email: string, code: string): Promise<void> {
    const transport = this.getTransport();
    if (!transport) {
      // No SMTP configured yet (e.g. local dev). Surface the code so the flow is still testable.
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
    } catch (err) {
      this.logger.error(`Failed to send OTP email to ${email}`, err);
      throw new ServiceUnavailableException("We couldn't send the email right now. Try again in a moment.");
    }
  }
}