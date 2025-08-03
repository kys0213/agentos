import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import {
  HelpCircle,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Code,
  Cpu,
  MessageSquare,
  Camera,
  Zap,
  RefreshCw,
} from 'lucide-react';

/**
 * Content types supported by LLM
 */
export type ContentType = 'text' | 'image' | 'audio' | 'video' | 'file';

/**
 * LLM의 기능 지원 정보입니다.
 */
export interface LlmBridgeCapabilities {
  modalities: ContentType[];
  supportsToolCall: boolean;
  supportsFunctionCall: boolean;
  supportsMultiTurn: boolean;
  supportsStreaming: boolean;
  supportsVision: boolean;
}

/**
 * LLM 매니페스트 정보입니다.
 */
export interface LlmManifest {
  /** 스키마 버전 */
  schemaVersion: string;
  /** LLM 이름 */
  name: string;
  /** 구현 언어 */
  language: string;
  /** 진입점 파일 경로 */
  entry: string;
  /** 설정 스키마 (Zod schema as JSON) */
  configSchema: any; // ZodObject serialized
  /** 지원 기능 정보 */
  capabilities: LlmBridgeCapabilities;
  /** LLM 설명 */
  description: string;
  /** 추가 메타데이터 */
  version?: string;
  author?: string;
  homepage?: string;
  icon?: string;
  tags?: string[];
}

interface ZodFieldInfo {
  type: string;
  required: boolean;
  description?: string;
  default?: any;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

interface DynamicFormRendererProps {
  manifest: LlmManifest;
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export function DynamicFormRenderer({
  manifest,
  values,
  onChange,
  onValidationChange,
}: DynamicFormRendererProps) {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<Record<string, ZodFieldInfo>>({});

  // Parse Zod schema to extract field information
  useEffect(() => {
    const parseZodSchema = (schema: any): Record<string, ZodFieldInfo> => {
      const parsedFields: Record<string, ZodFieldInfo> = {};

      // Mock parsing - in real implementation, you'd parse the actual Zod schema
      // For demo purposes, we'll create sample fields based on common LLM config patterns
      if (manifest.name.toLowerCase().includes('openai')) {
        parsedFields.apiKey = {
          type: 'password',
          required: true,
          description: 'Your OpenAI API key from https://platform.openai.com',
        };
        parsedFields.organizationId = {
          type: 'string',
          required: false,
          description: 'Optional organization ID for team accounts',
        };
        parsedFields.baseUrl = {
          type: 'url',
          required: false,
          description: 'Custom API endpoint (leave empty for default)',
          default: 'https://api.openai.com/v1',
        };
        parsedFields.timeout = {
          type: 'number',
          required: false,
          description: 'Request timeout in seconds',
          default: 30,
          validation: { min: 5, max: 300 },
        };
        parsedFields.enableLogging = {
          type: 'boolean',
          required: false,
          description: 'Enable request logging for debugging',
          default: false,
        };
      } else if (manifest.name.toLowerCase().includes('anthropic')) {
        parsedFields.apiKey = {
          type: 'password',
          required: true,
          description: 'Your Anthropic API key',
        };
        parsedFields.version = {
          type: 'select',
          required: true,
          description: 'Anthropic API version to use',
          default: '2023-06-01',
          options: [
            { value: '2023-06-01', label: '2023-06-01 (Latest)' },
            { value: '2023-01-01', label: '2023-01-01' },
          ],
        };
        parsedFields.maxTokens = {
          type: 'number',
          required: false,
          description: 'Maximum tokens per request',
          default: 4096,
          validation: { min: 1, max: 8192 },
        };
      } else if (
        manifest.name.toLowerCase().includes('ollama') ||
        manifest.name.toLowerCase().includes('llama')
      ) {
        parsedFields.host = {
          type: 'string',
          required: true,
          description: 'Ollama server host',
          default: 'localhost',
        };
        parsedFields.port = {
          type: 'number',
          required: true,
          description: 'Ollama server port',
          default: 11434,
          validation: { min: 1, max: 65535 },
        };
        parsedFields.model = {
          type: 'string',
          required: true,
          description: 'Name of the model to use',
        };
        parsedFields.useGpu = {
          type: 'boolean',
          required: false,
          description: 'Enable GPU acceleration if available',
          default: true,
        };
      }

      return parsedFields;
    };

    setFields(parseZodSchema(manifest.configSchema));
  }, [manifest]);

  const validateField = (fieldName: string, field: ZodFieldInfo, value: any): string | null => {
    if (field.required && (!value || value === '')) {
      return `${fieldName} is required`;
    }

    if (field.validation) {
      const { min, max, minLength, maxLength, pattern } = field.validation;

      if (field.type === 'number') {
        const numValue = Number(value);
        if (min !== undefined && numValue < min) return `Minimum value is ${min}`;
        if (max !== undefined && numValue > max) return `Maximum value is ${max}`;
      }

      if (field.type === 'string' || field.type === 'password') {
        const strValue = String(value || '');
        if (minLength !== undefined && strValue.length < minLength) {
          return `Minimum length is ${minLength} characters`;
        }
        if (maxLength !== undefined && strValue.length > maxLength) {
          return `Maximum length is ${maxLength} characters`;
        }
        if (pattern && !new RegExp(pattern).test(strValue)) {
          return 'Invalid format';
        }
      }

      if (field.type === 'url' && value) {
        try {
          new URL(value);
        } catch {
          return 'Invalid URL format';
        }
      }
    }

    return null;
  };

  const handleFieldChange = (fieldName: string, field: ZodFieldInfo, newValue: any) => {
    const updatedValues = { ...values, [fieldName]: newValue };
    onChange(updatedValues);

    // Validate field
    const error = validateField(fieldName, field, newValue);
    const updatedErrors = { ...errors };

    if (error) {
      updatedErrors[fieldName] = error;
    } else {
      delete updatedErrors[fieldName];
    }

    setErrors(updatedErrors);

    // Check overall form validity
    const hasErrors = Object.keys(updatedErrors).length > 0;
    const allRequiredFilled = Object.entries(fields)
      .filter(([_, field]) => field.required)
      .every(([fieldName, _]) => updatedValues[fieldName] && updatedValues[fieldName] !== '');

    onValidationChange?.(!hasErrors && allRequiredFilled);
  };

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const getCapabilityIcon = (capability: keyof LlmBridgeCapabilities) => {
    switch (capability) {
      case 'supportsToolCall':
        return <Code className="w-4 h-4" />;
      case 'supportsFunctionCall':
        return <Zap className="w-4 h-4" />;
      case 'supportsMultiTurn':
        return <MessageSquare className="w-4 h-4" />;
      case 'supportsStreaming':
        return <RefreshCw className="w-4 h-4" />;
      case 'supportsVision':
        return <Camera className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getModalityColor = (modality: ContentType) => {
    switch (modality) {
      case 'text':
        return 'bg-blue-100 text-blue-700';
      case 'image':
        return 'bg-green-100 text-green-700';
      case 'audio':
        return 'bg-purple-100 text-purple-700';
      case 'video':
        return 'bg-red-100 text-red-700';
      case 'file':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const renderField = (fieldName: string, field: ZodFieldInfo) => {
    const value = values[fieldName] ?? field.default ?? '';
    const error = errors[fieldName];
    const isPassword = field.type === 'password';
    const showPassword = showPasswords[fieldName];

    return (
      <div key={fieldName} className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">
            {fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.description && (
            <div className="group relative">
              <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 max-w-xs">
                {field.description}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          {field.type === 'select' ? (
            <select
              value={value}
              onChange={(e) => handleFieldChange(fieldName, field, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md text-sm ${
                error ? 'border-red-500' : 'border-input'
              } bg-background`}
            >
              <option value="">Select {fieldName}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === 'boolean' ? (
            <div className="flex items-center gap-2">
              <Switch
                checked={value || false}
                onCheckedChange={(checked) => handleFieldChange(fieldName, field, checked)}
              />
              <span className="text-sm text-muted-foreground">
                {value ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          ) : (
            <div className="relative">
              <Input
                type={
                  isPassword && !showPassword
                    ? 'password'
                    : field.type === 'number'
                      ? 'number'
                      : 'text'
                }
                value={value}
                onChange={(e) =>
                  handleFieldChange(
                    fieldName,
                    field,
                    field.type === 'number' ? Number(e.target.value) : e.target.value
                  )
                }
                placeholder={`Enter ${fieldName}...`}
                className={error ? 'border-red-500' : ''}
              />
              {isPassword && (
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility(fieldName)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-1 text-red-500">
            <AlertCircle className="w-3 h-3" />
            <span className="text-xs">{error}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Bridge Info */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          {manifest.icon && (
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-3xl">{manifest.icon}</span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{manifest.name}</h3>
              {manifest.version && (
                <Badge variant="outline" className="text-xs">
                  v{manifest.version}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {manifest.language}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{manifest.description}</p>

            {/* Capabilities */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-2">Supported Modalities</h4>
                <div className="flex flex-wrap gap-1">
                  {manifest.capabilities.modalities.map((modality) => (
                    <Badge
                      key={modality}
                      variant="secondary"
                      className={`text-xs ${getModalityColor(modality)}`}
                    >
                      {modality}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Features</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(manifest.capabilities).map(([key, value]) => {
                    if (key === 'modalities' || typeof value !== 'boolean') return null;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        {getCapabilityIcon(key as keyof LlmBridgeCapabilities)}
                        <span className={`text-xs ${value ? 'text-green-600' : 'text-gray-400'}`}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                        </span>
                        {value ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Technical Info */}
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Schema Version:</span> {manifest.schemaVersion}
                </div>
                <div>
                  <span className="font-medium">Entry Point:</span> {manifest.entry}
                </div>
                {manifest.author && (
                  <div>
                    <span className="font-medium">Author:</span> {manifest.author}
                  </div>
                )}
                {manifest.homepage && (
                  <div>
                    <span className="font-medium">Homepage:</span>
                    <a href={manifest.homepage} className="text-blue-600 hover:underline ml-1">
                      {manifest.homepage}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Configuration Fields */}
      <Card className="p-6">
        <div className="mb-4">
          <h4 className="font-semibold">Configuration</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the connection settings for this bridge
          </p>
        </div>
        <div className="space-y-4">
          {Object.entries(fields).map(([fieldName, field]) => renderField(fieldName, field))}
        </div>
      </Card>
    </div>
  );
}
