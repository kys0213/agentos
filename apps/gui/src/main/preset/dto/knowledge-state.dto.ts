import { IsInt, Min } from 'class-validator';

export class KnowledgeStateDto {
  @IsInt()
  @Min(0)
  indexed!: number;

  @IsInt()
  @Min(0)
  vectorized!: number;

  @IsInt()
  @Min(0)
  totalSize!: number; // bytes
}

