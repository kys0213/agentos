export async function waitForRpcReady(timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const hasBridge =
      typeof window !== 'undefined' &&
      window.electronBridge &&
      typeof window.electronBridge.start === 'function' &&
      typeof window.electronBridge.post === 'function';
    const hasRpc = typeof window.rpc?.request === 'function';

    if (hasBridge && hasRpc) {
      return;
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  throw new Error('RPC not ready');
}
