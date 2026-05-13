
class RedisMock {
  private storage: Map<string, string> = new Map();
  public isReady = false;
  public isOpen = false;
  private handlers: { [key: string]: ((err: any) => void)[] } = {};

  on(event: string, handler: (err: any) => void) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }

  async connect() {
    this.isOpen = true;
    this.isReady = true;
  }

  async set(key: string, value: string) {
    this.storage.set(key, value);
  }

  async get(key: string) {
    return this.storage.get(key) || null;
  }

  async quit() {
    this.isOpen = false;
    this.isReady = false;
  }
}

export function createRedisMock() {
  return new RedisMock();
}
