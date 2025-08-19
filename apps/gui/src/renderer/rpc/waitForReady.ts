export async function waitForRendererReady(timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const hasBridge =
      typeof window !== 'undefined' &&
      (window as any).electronBridge &&
      typeof (window as any).electronBridge.start === 'function' &&
      typeof (window as any).electronBridge.post === 'function';
    const hasRpc = typeof (window as any).rpc?.request === 'function';
    if (hasBridge && hasRpc) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error('Renderer bootstrap timeout: electronBridge/rpc not ready');
}

