declare namespace chrome {
  namespace runtime {
    interface Manifest {
      name: string;
      version: string;
    }

    interface InstalledDetails {
      reason: string;
    }

    interface MessageSender {}

    interface OnInstalledEvent {
      addListener(callback: (details: InstalledDetails) => void): void;
    }

    interface OnStartupEvent {
      addListener(callback: () => void): void;
    }

    interface OnMessageEvent {
      addListener(
        callback: (
          message: unknown,
          sender: MessageSender,
          sendResponse: (response: unknown) => void
        ) => boolean | void
      ): void;
    }

    function getManifest(): Manifest;

    const onInstalled: OnInstalledEvent;
    const onStartup: OnStartupEvent;
    const onMessage: OnMessageEvent;
  }
}

const logPrefix = '[ancore-extension/background]';

const manifest = chrome.runtime.getManifest();

interface RuntimeMessage {
  type?: string;
}

console.info(`${logPrefix} booted`, {
  name: manifest.name,
  version: manifest.version,
});

chrome.runtime.onInstalled.addListener((details) => {
  console.info(`${logPrefix} installed`, { reason: details.reason });
});

chrome.runtime.onStartup.addListener(() => {
  console.info(`${logPrefix} startup`);
});

chrome.runtime.onMessage.addListener(
  (
    message: unknown,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ) => {
    const runtimeMessage = message as RuntimeMessage;

    if (runtimeMessage.type === 'wallet/ping') {
      sendResponse({
        ok: true,
        version: manifest.version,
        source: 'service-worker',
      });

      return true;
    }

    return false;
  }
);
