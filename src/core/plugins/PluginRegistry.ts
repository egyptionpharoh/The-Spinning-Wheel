// /src/core/plugins/PluginRegistry.ts
import { IPlugin } from '../types';

class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: Map<string, IPlugin> = new Map();

  private constructor() {}

  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  public registerPlugin(plugin: IPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`[PluginRegistry]: Plugin ${plugin.id} is already registered. Overwriting.`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  public removePlugin(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (plugin && plugin.onDispose) {
      plugin.onDispose(); // تنظيف الذاكرة قبل الحذف
    }
    return this.plugins.delete(id);
  }

  public hasPlugin(id: string): boolean {
    return this.plugins.has(id);
  }

  public getPlugin(id: string): IPlugin | undefined {
    return this.plugins.get(id);
  }

  public getAllPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * تهيئة جميع الإضافات المسجلة (يُستدعى عند بدء التطبيق)
   */
  public async initializeAll(): Promise<void> {
    const initPromises = Array.from(this.plugins.values()).map(async (plugin) => {
      if (plugin.onInitialize) {
        await plugin.onInitialize();
      }
    });
    await Promise.all(initPromises);
  }

  public clearRegistry(): void {
    this.plugins.forEach(plugin => {
      if (plugin.onDispose) plugin.onDispose();
    });
    this.plugins.clear();
  }
}

export const pluginRegistry = PluginRegistry.getInstance();