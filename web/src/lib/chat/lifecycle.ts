import type { UIMessageChunk } from 'ai';

export function waitForAbort<T>(work: Promise<T>, signal: AbortSignal) {
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    void work.then(resolve, reject).finally(() => {
      signal.removeEventListener('abort', abort);
    });
    if (signal.aborted) {
      abort();
    }
  });
}

export function abortableChatStream(
  stream: ReadableStream<UIMessageChunk>,
  signal: AbortSignal,
  cancel: () => void
) {
  const reader = stream.getReader();
  let closed = false;
  let abort: () => void;
  const detach = () => signal.removeEventListener('abort', abort);
  return new ReadableStream<UIMessageChunk>({
    start(controller) {
      abort = () => {
        if (closed) {
          return;
        }
        closed = true;
        detach();
        controller.enqueue({ type: 'abort' });
        controller.close();
        void reader.cancel().catch(() => {});
      };
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) {
        abort();
      }
    },
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (closed) {
          return;
        }
        if (done) {
          closed = true;
          detach();
          reader.releaseLock();
          controller.close();
        } else {
          controller.enqueue(value);
        }
      } catch (error) {
        if (!closed) {
          closed = true;
          detach();
          controller.error(error);
        }
      }
    },
    cancel() {
      closed = true;
      detach();
      cancel();
      void reader.cancel().catch(() => {});
    },
  });
}
