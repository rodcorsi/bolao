import { createClient } from "redis";

const MAX_TRIES = 5;

const client = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
  password: process.env.REDIS_PASSWORD,
});
client.on("error", (err) => {
  console.error(
    `Error redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}` + err
  );
});

export default async function connectCache() {
  let tries = 0;
  while (!client.isReady) {
    tries++;
    if (tries === MAX_TRIES) {
      throw new Error("exceed the max number of try connect on redis server");
    }
    if (!client.isOpen) {
      await client.connect();
    } else {
      console.info(`waiting connection is ready ${tries}/${MAX_TRIES}`);
      await new Promise((f) => setTimeout(f, 1000));
    }
  }
  return client;
}

interface Record {
  expire: number;
  value: any;
}

export async function setCache<T>(
  key: string,
  value: T,
  expire: number
): Promise<T> {
  await client.set(
    key,
    JSON.stringify({
      value,
      expire,
    })
  );
  return value;
}

export interface Result<T> {
  get: () => T | null;
  getEvenExpired(): T | null;
  isExpired: () => boolean;
}

export async function getCacheResult<T>(key: string): Promise<Result<T>> {
  const cachedResponse = await client.get(key);
  return createResult<T>(cachedResponse);
}

function createResult<T>(response: string | null): Result<T> {
  const record = !!response ? (JSON.parse(response) as Record) : null;
  const _value = record?.value;
  const _expired =
    record != null && _value != null ? Date.now() > record.expire : true;
  return {
    get: () => (_expired ? null : _value),
    getEvenExpired: () => _value,
    isExpired: () => _expired,
  };
}
