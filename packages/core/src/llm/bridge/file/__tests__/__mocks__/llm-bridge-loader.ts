import { BridgeLoadResult, BridgeLoader, ScanOptions } from 'llm-bridge-loader';
import {
  InvokeOption,
  LlmBridge,
  LlmBridgePrompt,
  LlmBridgeResponse,
  LlmManifest,
  LlmMetadata,
} from 'llm-bridge-spec';
import z from 'zod';

export class LlmBridgeLoader implements BridgeLoader {
  scan<M extends LlmManifest>(options?: ScanOptions): Promise<BridgeLoadResult<M>[]> {
    throw new Error('Method not implemented.');
  }

  async load<M extends LlmManifest>(name: string): Promise<BridgeLoadResult<M>> {
    class DummyBridge implements LlmBridge {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      constructor(_config: unknown) {}

      invoke(_prompt: LlmBridgePrompt, _options?: InvokeOption): Promise<LlmBridgeResponse> {
        throw new Error('Method not implemented.');
      }

      getMetadata(): Promise<LlmMetadata> {
        throw new Error('Method not implemented.');
      }
    }

    const manifest: LlmManifest = {
      /** 스키마 버전 */
      schemaVersion: '1.0.0',
      /** LLM 이름 */
      name,
      /** 구현 언어 */
      language: 'typescript',
      /** 진입점 파일 경로 */
      entry: 'index.ts',
      /** 설정 스키마 */
      configSchema: z.object({}),
      /** 지원 기능 정보 */
      capabilities: {
        modalities: [],
        supportsToolCall: false,
        supportsFunctionCall: false,
        supportsMultiTurn: false,
        supportsStreaming: false,
        supportsVision: false,
      },
      /** 지원 모델 정보 */
      models: [
        {
          name: 'test',
          contextWindowTokens: 1000,
          pricing: {
            unit: 0,
            currency: 'USD',
            prompt: 0,
            completion: 0,
          },
        },
      ],
      /** LLM 설명 */
      description: `Manifest for ${name}`,
    };

    return {
      ctor: DummyBridge,
      configSchema: manifest.configSchema,
      manifest: manifest as M,
    };
  }
}
