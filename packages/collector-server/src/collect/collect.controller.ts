import { BadRequestException, Body, Controller, Get, Headers, HttpStatus, Inject, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { CollectService } from './collect.service';
import { CollectRequestDto } from './dto/collect-request.dto';
import { ApiKeyGuard } from './guards/api-key.guard';

@Controller()
export class CollectController {
  constructor(@Inject(CollectService) private readonly collectService: CollectService) {}

  @UseGuards(ApiKeyGuard)
  @Post('v1/collect')
  async collect(
    @Headers('idempotency-key') idempotencyKeyHeader: string | undefined,
    @Body() body: CollectRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ ack_id: string; accepted: number; rejected: number }> {
    if (!idempotencyKeyHeader || idempotencyKeyHeader.trim().length === 0) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    const { ack, created } = await this.collectService.ingest(body, idempotencyKeyHeader.trim());
    response.status(created ? HttpStatus.ACCEPTED : HttpStatus.OK);
    return ack;
  }

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }
}
