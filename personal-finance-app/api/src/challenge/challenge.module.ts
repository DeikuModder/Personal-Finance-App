import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengeConfig } from './challenge-config.entity';
import { ChallengeService } from './challenge.service';
import { ChallengeController } from './challenge.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChallengeConfig])],
  providers: [ChallengeService],
  controllers: [ChallengeController],
})
export class ChallengeModule {}
