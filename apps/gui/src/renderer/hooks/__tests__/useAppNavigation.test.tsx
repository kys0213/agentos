import { act, renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAppNavigation } from '../useAppNavigation';

describe('useAppNavigation', () => {
  it('tracks agent creation step across start and reset flows', () => {
    const { result } = renderHook(() => useAppNavigation());

    expect(result.current.agentCreationStep).toBe('overview');
    expect(result.current.creatingAgent).toBe(false);

    act(() => {
      result.current.handleStartCreateAgent('category');
    });

    expect(result.current.creatingAgent).toBe(true);
    expect(result.current.agentCreationStep).toBe('category');

    act(() => {
      result.current.setAgentCreationStep('ai-config');
    });

    expect(result.current.agentCreationStep).toBe('ai-config');

    act(() => {
      result.current.handleBackToAgents();
    });

    expect(result.current.creatingAgent).toBe(false);
    expect(result.current.agentCreationStep).toBe('overview');
  });

  it('tracks MCP tool creation step', () => {
    const { result } = renderHook(() => useAppNavigation());

    expect(result.current.mcpCreationStep).toBe('overview');

    act(() => {
      result.current.handleStartCreateMCPTool('configuration');
    });

    expect(result.current.creatingMCPTool).toBe(true);
    expect(result.current.mcpCreationStep).toBe('configuration');

    act(() => {
      result.current.setMcpCreationStep('testing');
    });

    expect(result.current.mcpCreationStep).toBe('testing');

    act(() => {
      result.current.handleBackToTools();
    });

    expect(result.current.creatingMCPTool).toBe(false);
    expect(result.current.mcpCreationStep).toBe('overview');
  });

  it('tracks custom tool builder creation step', () => {
    const { result } = renderHook(() => useAppNavigation());

    expect(result.current.customToolCreationStep).toBe('describe');

    act(() => {
      result.current.handleStartCreateCustomTool();
    });

    expect(result.current.creatingCustomTool).toBe(true);
    expect(result.current.customToolCreationStep).toBe('describe');

    act(() => {
      result.current.setCustomToolCreationStep('generate');
    });

    expect(result.current.customToolCreationStep).toBe('generate');

    act(() => {
      result.current.handleBackToToolBuilder();
    });

    expect(result.current.creatingCustomTool).toBe(false);
    expect(result.current.customToolCreationStep).toBe('describe');
  });
});
