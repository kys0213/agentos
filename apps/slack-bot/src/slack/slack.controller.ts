import { All, Controller, Req, Res } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';

import { SlackBoltService } from './slack-bolt.service';

@Controller('slack')
export class SlackController {
  constructor(private readonly slackBoltService: SlackBoltService) {}

  @All('events')
  async handleEvents(@Req() req: RawBodyRequest<Request>, @Res() res: Response): Promise<void> {
    await this.slackBoltService.dispatch(req, res);
  }
}
