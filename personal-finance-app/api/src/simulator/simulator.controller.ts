import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { SimulatorService } from './simulator.service';
import { InterpretDto, ReportDto, SimulatorRunDto } from './simulator.dto';

@Controller('simulator')
export class SimulatorController {
  constructor(private readonly simulator: SimulatorService) {}

  @Get('stats')
  stats(@Req() req: AuthenticatedRequest) {
    return this.simulator.getStats(req.user!.userId);
  }

  @Post('run')
  run(@Req() req: AuthenticatedRequest, @Body() dto: SimulatorRunDto) {
    return this.simulator.run(req.user!.userId, dto);
  }

  @Post('interpret')
  interpret(@Req() req: AuthenticatedRequest, @Body() dto: InterpretDto) {
    return this.simulator.interpret(req.user!.userId, dto);
  }

  @Post('report')
  report(@Req() req: AuthenticatedRequest, @Body() dto: ReportDto) {
    return this.simulator.report(req.user!.userId, dto);
  }
}