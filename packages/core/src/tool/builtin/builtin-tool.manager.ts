import { BuiltinTool } from './builtin-tool';

export class BuiltinToolManager {
  private tools: Map<string, BuiltinTool> = new Map();

  constructor(tools: BuiltinTool[]) {
    this.tools = new Map(tools.map((tool) => [tool.name, tool]));
  }

  register(tool: BuiltinTool) {
    this.tools.set(tool.name, tool);
  }

  unregister(name: string) {
    this.tools.delete(name);
  }

  getTool(name: string): BuiltinTool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): BuiltinTool[] {
    return Array.from(this.tools.values());
  }
}
