import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { SimulatorService } from './simulator.service';
import { InterpretDto, ReportDto, SimulatorRunDto } from './simulator.dto';
export declare class SimulatorController {
    private readonly simulator;
    constructor(simulator: SimulatorService);
    stats(req: AuthenticatedRequest): Promise<import("./history.stats").SimulatorStats>;
    run(req: AuthenticatedRequest, dto: SimulatorRunDto): Promise<import("./simulation.engine").SimulationResult>;
    interpret(req: AuthenticatedRequest, dto: InterpretDto): Promise<import("./simulator-ai.service").InterpretResult>;
    report(req: AuthenticatedRequest, dto: ReportDto): Promise<import("./simulator-ai.service").ReportResult>;
}
