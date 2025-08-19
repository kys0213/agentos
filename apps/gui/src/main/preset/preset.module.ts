import { Module } from '@nestjs/common';
import { PresetController } from './preset.controller';
import { PresetModule as PresetProviderModule } from '../common/preset/preset.module';

@Module({
  imports: [PresetProviderModule],
  controllers: [PresetController],
})
export class PresetApiModule {}
