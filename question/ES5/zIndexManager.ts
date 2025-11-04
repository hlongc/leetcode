/**
 * Z-Index 管理器
 * 用于管理全局浮层组件的层级
 */
class ZIndexManager {
  // 基础 z-index 值
  private baseZIndex: number = 1000;

  // 当前 z-index（会递增）
  private currentZIndex: number = 1000;

  // 记录每个组件的 z-index
  private componentZIndexMap = new Map<string, number>();

  // 组件栈（用于追踪打开顺序）
  private stack: string[] = [];

  /**
   * 注册一个新组件并获取 z-index
   * @param id 组件唯一标识
   * @param options 配置项
   */
  register(id: string, options?: { forceTop?: boolean }): number {
    // 如果已经存在，返回现有的 z-index
    if (this.componentZIndexMap.has(id)) {
      const existingZIndex = this.componentZIndexMap.get(id)!;

      // 如果需要强制置顶
      if (options?.forceTop) {
        return this.bringToTop(id);
      }

      return existingZIndex;
    }

    // 分配新的 z-index
    this.currentZIndex += 1;
    const zIndex = this.currentZIndex;

    this.componentZIndexMap.set(id, zIndex);
    this.stack.push(id);

    console.log(`[ZIndex] Register: ${id} -> ${zIndex}`);

    return zIndex;
  }

  /**
   * 注销组件
   * @param id 组件唯一标识
   */
  unregister(id: string): void {
    this.componentZIndexMap.delete(id);
    this.stack = this.stack.filter((item) => item !== id);

    console.log(`[ZIndex] Unregister: ${id}`);
  }

  /**
   * 将组件置顶
   * @param id 组件唯一标识
   */
  bringToTop(id: string): number {
    if (!this.componentZIndexMap.has(id)) {
      return this.register(id);
    }

    // 分配新的更高的 z-index
    this.currentZIndex += 1;
    const newZIndex = this.currentZIndex;

    this.componentZIndexMap.set(id, newZIndex);

    // 更新栈顺序
    this.stack = this.stack.filter((item) => item !== id);
    this.stack.push(id);

    console.log(`[ZIndex] Bring to top: ${id} -> ${newZIndex}`);

    return newZIndex;
  }

  /**
   * 获取组件当前的 z-index
   * @param id 组件唯一标识
   */
  get(id: string): number | undefined {
    return this.componentZIndexMap.get(id);
  }

  /**
   * 获取当前最高的 z-index
   */
  getHighest(): number {
    return this.currentZIndex;
  }

  /**
   * 获取下一个 z-index（不注册组件）
   */
  getNext(): number {
    return this.currentZIndex + 1;
  }

  /**
   * 重置管理器（谨慎使用）
   */
  reset(): void {
    this.currentZIndex = this.baseZIndex;
    this.componentZIndexMap.clear();
    this.stack = [];

    console.log("[ZIndex] Reset");
  }

  /**
   * 获取所有组件的 z-index 信息（调试用）
   */
  getAll(): Array<{ id: string; zIndex: number }> {
    return Array.from(this.componentZIndexMap.entries()).map(
      ([id, zIndex]) => ({
        id,
        zIndex,
      })
    );
  }
}

// 导出单例
export const zIndexManager = new ZIndexManager();
