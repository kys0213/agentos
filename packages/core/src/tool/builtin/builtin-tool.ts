export interface BuiltinTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface BuiltinToolFunction<Param extends Record<string, unknown>, Result> {
  (args: Param): Promise<Result> | Result;
}
