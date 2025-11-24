/**
 * 带过期功能的LocalStorage封装类
 * 支持设置过期时间，自动清理过期数据
 */

interface StorageData<T> {
  value: T;
  expireTime: number | null; // 过期时间戳，null表示永不过期
}

class LocalStorageWithExpire {
  private readonly prefix: string;

  constructor(prefix: string = "storage_") {
    this.prefix = prefix;
  }

  /**
   * 设置存储项
   * @param key 键名
   * @param value 值
   * @param expire 过期时间（毫秒），不传则永不过期
   */
  setItem<T>(key: string, value: T, expire?: number): void {
    const fullKey = this.prefix + key;
    const expireTime = expire ? Date.now() + expire : null;

    const data: StorageData<T> = {
      value,
      expireTime,
    };

    try {
      localStorage.setItem(fullKey, JSON.stringify(data));
    } catch (error) {
      console.error("LocalStorage存储失败:", error);
      // 可能是存储空间满了，尝试清理过期数据
      this.clearExpired();
      try {
        localStorage.setItem(fullKey, JSON.stringify(data));
      } catch (retryError) {
        console.error("清理后仍然存储失败:", retryError);
        throw retryError;
      }
    }
  }

  /**
   * 获取存储项
   * @param key 键名
   * @returns 值，如果不存在或已过期返回null
   */
  getItem<T>(key: string): T | null {
    const fullKey = this.prefix + key;
    const item = localStorage.getItem(fullKey);

    if (!item) {
      return null;
    }

    try {
      const data: StorageData<T> = JSON.parse(item);

      // 检查是否过期
      if (data.expireTime !== null && Date.now() > data.expireTime) {
        // 已过期，删除并返回null
        this.removeItem(key);
        return null;
      }

      return data.value;
    } catch (error) {
      console.error("解析存储数据失败:", error);
      // 数据格式错误，删除该项
      this.removeItem(key);
      return null;
    }
  }

  /**
   * 删除存储项
   * @param key 键名
   */
  removeItem(key: string): void {
    const fullKey = this.prefix + key;
    localStorage.removeItem(fullKey);
  }

  /**
   * 清空所有带前缀的存储项
   */
  clear(): void {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  /**
   * 清理所有过期的数据
   */
  clearExpired(): void {
    const keysToRemove: string[] = [];
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const data: StorageData<any> = JSON.parse(item);
            if (data.expireTime !== null && now > data.expireTime) {
              keysToRemove.push(key);
            }
          } catch (error) {
            // 解析失败的数据也删除
            keysToRemove.push(key);
          }
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  /**
   * 检查key是否存在且未过期
   * @param key 键名
   */
  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }

  /**
   * 获取所有带前缀的键名（不包括前缀部分）
   */
  keys(): string[] {
    const keys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        // 移除前缀
        keys.push(key.substring(this.prefix.length));
      }
    }

    return keys;
  }

  /**
   * 更新某个key的过期时间
   * @param key 键名
   * @param expire 新的过期时间（毫秒），不传则永不过期
   */
  updateExpire(key: string, expire?: number): boolean {
    const value = this.getItem(key);
    if (value === null) {
      return false;
    }
    this.setItem(key, value, expire);
    return true;
  }

  /**
   * 获取剩余过期时间（毫秒）
   * @param key 键名
   * @returns 剩余时间（毫秒），-1表示永不过期，null表示不存在或已过期
   */
  getExpireTime(key: string): number | null {
    const fullKey = this.prefix + key;
    const item = localStorage.getItem(fullKey);

    if (!item) {
      return null;
    }

    try {
      const data: StorageData<any> = JSON.parse(item);

      if (data.expireTime === null) {
        return -1; // 永不过期
      }

      const remaining = data.expireTime - Date.now();

      if (remaining <= 0) {
        // 已过期
        this.removeItem(key);
        return null;
      }

      return remaining;
    } catch (error) {
      return null;
    }
  }
}

// 创建默认实例
const storage = new LocalStorageWithExpire();

// 导出
export default LocalStorageWithExpire;
export { storage };

// ============ 使用示例 ============

// 示例1: 基本使用
storage.setItem("user", { name: "Alice", age: 25 }, 5000); // 5秒后过期
console.log(storage.getItem("user")); // { name: 'Alice', age: 25 }

setTimeout(() => {
  console.log(storage.getItem("user")); // null（已过期）
}, 6000);

// 示例2: 永不过期
storage.setItem("token", "abc123"); // 不设置过期时间

// 示例3: 检查是否存在
console.log(storage.hasItem("user")); // true
console.log(storage.hasItem("notExist")); // false

// 示例4: 获取剩余时间
storage.setItem("temp", "data", 10000); // 10秒后过期
console.log(storage.getExpireTime("temp")); // 约9900+毫秒

// 示例5: 更新过期时间
storage.setItem("data", "value", 5000);
storage.updateExpire("data", 10000); // 更新为10秒后过期

// 示例6: 清理过期数据
storage.clearExpired();

// 示例7: 获取所有键
console.log(storage.keys()); // ['user', 'token', 'temp', 'data', ...]

// 示例8: 清空所有数据
// storage.clear();

// 示例9: 使用自定义前缀
const customStorage = new LocalStorageWithExpire("myapp_");
customStorage.setItem("config", { theme: "dark" }, 60000); // 1分钟后过期
