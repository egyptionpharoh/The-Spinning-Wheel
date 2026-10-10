// /src/types/plugin.ts
import { EvaluationOutcome } from './core';

export type ThemeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';

export interface EvaluationOption {
  label: string;
  action: EvaluationOutcome;
  variant: ThemeVariant; // تم ربطها بالثيم بدلاً من الألوان الثابتة
  icon?: string;
  shouldRemoveFromWheel: boolean; // هل هذا الإجراء يستبعد العنصر من العجلة؟
}

export interface PluginMetadata {
  author: string;
  version: string;
  description: string;
}

export interface PluginCapabilities {
  supportsEvaluation: boolean; // هل يتطلب تقييماً (الطلاب) أم عرضاً فقط؟
  supportsWeights: boolean;    // هل يدعم احتمالات غير متساوية؟
  supportsImport: boolean;     // هل يقبل استيراد بيانات خارجية؟
}

export interface PluginCardProps<T> {
  itemData: T;
  displayId: string;
  onEvaluate: (action: EvaluationOutcome, shouldRemove: boolean) => void;
  onClose: () => void;
}

export interface IPlugin<T = any> {
  id: string;
  name: string;
  metadata: PluginMetadata;
  capabilities: PluginCapabilities;
  
  // Lifecycle Hooks
  onInitialize?: () => Promise<void> | void;
  onDispose?: () => Promise<void> | void;
  
  parseRawData: (rawData: any[]) => Map<string, T>;
  getEvaluationOptions: () => EvaluationOption[];
  
  CardComponent: React.FC<PluginCardProps<T>>;
}