import { Module } from '@nestjs/common';
// import { PresetController } from './preset.controller';
import { GeneratedPresetController } from './gen/preset.controller.gen.new';
import { PresetModule as PresetProviderModule } from '../common/preset/preset.module';

@Module({
  imports: [PresetProviderModule],
  controllers: [GeneratedPresetController],
})
export class PresetApiModule {}
