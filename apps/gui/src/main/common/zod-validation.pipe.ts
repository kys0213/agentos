import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { ZodTypeAny } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodTypeAny) {}

  transform(value: unknown) {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.format());
    }
    return parsed.data;
  }
}
