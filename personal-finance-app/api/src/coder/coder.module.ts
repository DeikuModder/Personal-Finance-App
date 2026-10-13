import { Module } from '@nestjs/common';
import { CoderController } from './coder.controller';
import { CoderService } from './coder.service';
import { CoderEventRelay } from './coder.event-relay';

@Module({
  controllers: [CoderController],
  providers: [CoderService, CoderEventRelay],
})
export class CoderModule {}