import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CoderService } from './coder.service';
import { CoderEventRelay } from './coder.event-relay';
import { Roles, SUPERADMIN } from '../auth/auth.decorators';

type QueryParams = Record<string, string | number | boolean | undefined>;

@Controller('coder')
@Roles(SUPERADMIN)
export class CoderController {
  constructor(
    private readonly coder: CoderService,
    private readonly events: CoderEventRelay
  ) {}

  /* ------------------------------------------------------------
     Status / discovery
     ------------------------------------------------------------ */

  @Get('health')
  health(): Promise<any> {
    return this.coder.get('/global/health');
  }

  @Get('project')
  project(): Promise<any> {
    return this.coder.get('/project');
  }

  @Get('project/current')
  projectCurrent(): Promise<any> {
    return this.coder.get('/project/current');
  }

  @Get('path')
  path(): Promise<any> {
    return this.coder.get('/path');
  }

  @Get('vcs')
  vcs(): Promise<any> {
    return this.coder.get('/vcs');
  }

  @Get('config')
  config(): Promise<any> {
    return this.coder.get('/config');
  }

  @Get('config/providers')
  providers(): Promise<any> {
    return this.coder.get('/config/providers');
  }

  /* ------------------------------------------------------------
     Sessions
     ------------------------------------------------------------ */

  @Get('session')
  sessions(): Promise<any> {
    return this.coder.get('/session');
  }

  @Post('session')
  createSession(@Body() body: { parentID?: string; title?: string }): Promise<any> {
    return this.coder.mutate('POST', '/session', body ?? {});
  }

  @Get('session/:id')
  session(@Param('id') id: string): Promise<any> {
    return this.coder.get(`/session/${encodeURIComponent(id)}`);
  }

  @Patch('session/:id')
  updateSession(@Param('id') id: string, @Body() body: { title?: string }): Promise<any> {
    return this.coder.mutate('PATCH', `/session/${encodeURIComponent(id)}`, body ?? {});
  }

  @Delete('session/:id')
  deleteSession(@Param('id') id: string): Promise<any> {
    return this.coder.mutate('DELETE', `/session/${encodeURIComponent(id)}`);
  }

  @Get('session/:id/todo')
  todo(@Param('id') id: string): Promise<any> {
    return this.coder.get(`/session/${encodeURIComponent(id)}/todo`);
  }

  @Get('session/:id/diff')
  diff(@Param('id') id: string, @Query() query: QueryParams): Promise<any> {
    return this.coder.get(`/session/${encodeURIComponent(id)}/diff`, query);
  }

  @Post('session/:id/abort')
  abort(@Param('id') id: string): Promise<any> {
    return this.coder.mutate('POST', `/session/${encodeURIComponent(id)}/abort`);
  }

  @Post('session/:id/command')
  command(
    @Param('id') id: string,
    @Body() body: { command: string; arguments?: any; agent?: string; model?: string }
  ): Promise<any> {
    return this.coder.mutate('POST', `/session/${encodeURIComponent(id)}/command`, body ?? {});
  }

  @Post('session/:id/shell')
  shell(
    @Param('id') id: string,
    @Body() body: { command: string; agent?: string; model?: string }
  ): Promise<any> {
    return this.coder.mutate('POST', `/session/${encodeURIComponent(id)}/shell`, body ?? {});
  }

  /* ------------------------------------------------------------
     Messages
     ------------------------------------------------------------ */

  @Get('session/:id/message')
  messages(@Param('id') id: string, @Query() query: QueryParams): Promise<any> {
    return this.coder.get(`/session/${encodeURIComponent(id)}/message`, query);
  }

  @Post('session/:id/message')
  sendMessage(@Param('id') id: string, @Body() body: any): Promise<any> {
    return this.coder.mutate('POST', `/session/${encodeURIComponent(id)}/message`, body ?? {});
  }

  @Post('session/:id/prompt_async')
  promptAsync(@Param('id') id: string, @Body() body: any): Promise<any> {
    return this.coder.mutate('POST', `/session/${encodeURIComponent(id)}/prompt_async`, body ?? {});
  }

  @Post('session/:id/permissions/:permissionID')
  respondPermission(
    @Param('id') id: string,
    @Param('permissionID') permissionID: string,
    @Body() body: { response: string; remember?: boolean }
  ): Promise<any> {
    return this.coder.mutate(
      'POST',
      `/session/${encodeURIComponent(id)}/permissions/${encodeURIComponent(permissionID)}`,
      body ?? {}
    );
  }

  /* ------------------------------------------------------------
     Files
     ------------------------------------------------------------ */

  @Get('file')
  file(@Query() query: QueryParams): Promise<any> {
    return this.coder.get('/file', query);
  }

  @Get('file/content')
  fileContent(@Query() query: QueryParams): Promise<any> {
    return this.coder.get('/file/content', query);
  }

  @Get('file/status')
  fileStatus(): Promise<any> {
    return this.coder.get('/file/status');
  }

  @Get('find')
  find(@Query() query: QueryParams): Promise<any> {
    return this.coder.get('/find', query);
  }

  @Get('find/file')
  findFile(@Query() query: QueryParams): Promise<any> {
    return this.coder.get('/find/file', query);
  }

  /* ------------------------------------------------------------
     Live event stream (SSE)
     ------------------------------------------------------------ */

  @Sse('event')
  @Header('X-Accel-Buffering', 'no')
  @Header('Cache-Control', 'no-cache')
  eventStream(): Observable<{ type?: string; data: string }> {
    return this.events.stream();
  }
}