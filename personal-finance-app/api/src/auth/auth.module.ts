import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpCode } from './otp-code.entity';
import { RefreshToken } from './refresh-token.entity';
import { AllowedEmail } from './allowed-email.entity';
import { MailService } from './mail.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([OtpCode, RefreshToken, AllowedEmail]), UsersModule],
  controllers: [AuthController],
  providers: [AuthService, MailService, JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard],
})
export class AuthModule {}