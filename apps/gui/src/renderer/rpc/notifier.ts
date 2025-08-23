export interface Notifier {
  wait: () => Promise<void>;
  notify: () => void;
}

export function createNotifier(): Notifier {
  let resolve: (() => void) | null = null;
  let pending = false;

  const wait = async () => {
    if (pending) {
      return;
    }

    pending = true;

    await new Promise<void>((_res) => {
      resolve = () => {
        pending = false;
        const r = resolve;
        resolve = null;
        r && r();
      };
    });
  };

  const notify = () => {
    if (resolve) {
      resolve();
    }
  };

  return { wait, notify };
}
