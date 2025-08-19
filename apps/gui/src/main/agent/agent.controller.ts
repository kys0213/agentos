import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AgentController {
  @MessagePattern('agent:get-agent')
  getAgent() {
    return 'agent';
  }
}
