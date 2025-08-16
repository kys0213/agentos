import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { interval, map, take } from 'rxjs';
import { z } from 'zod';

const DemoStreamTicksSchema = z.object({ count: z.number().int().min(1).max(20).optional() });

@Controller()
export class FrameController {
  @EventPattern('demo.streamTicks')
  streamTicks(@Payload() payload?: unknown) {
    const parsed = DemoStreamTicksSchema.safeParse(payload ?? {});
    const count = parsed.success ? (parsed.data.count ?? 5) : 5;
    return interval(200).pipe(
      take(count),
      map((i) => ({ tick: i + 1 }))
    );
  }
}
