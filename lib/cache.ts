export interface Cache {
  put: <T>(key: string, value: T, time: number) => T;
  get: (key: string) => any | undefined;
  getLast: (key: string) => any | undefined;
}

interface Record {
  value: any;
  expire: number;
}

function createCache(): Cache {
  const _cache: { [key: string]: Record } = {};

  const put = <T>(key: string, value: T, time: number) => {
    const expire = Date.now() + time;
    _cache[key] = { value, expire };
    return value;
  };

  const get = (key: string) => {
    const record = _cache[key];
    if (!record) {
      return;
    }
    if (Date.now() > record.expire) {
      return;
    }
    return record.value;
  };

  const getLast = (key: string) => {
    const record = _cache[key];
    if (!record) {
      return;
    }
    return record.value;
  };

  return { put, get, getLast };
}

export default createCache();
