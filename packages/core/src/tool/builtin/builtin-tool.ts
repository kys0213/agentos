export interface BuiltinTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface BuiltinToolFunction<Param extends Record<string, any>, Result> {
  (args: Param): Promise<Result> | Result;
}
