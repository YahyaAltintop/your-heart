import type { Condition } from '../types'

/**
 * Seçilebilir hastalık/durum listesi ve her birinin kalp modeli üzerindeki
 * sayısal etkileri. Değerler bilimsel literatüre dayalı, eğitim amaçlı
 * yaklaşımlardır (bkz. docs/fizyoloji-referanslari.md) — klinik kesinlik
 * iddiası taşımaz. Görünen etiket/açıklama metinleri i18n'de tutulur
 * (`conditions.<id>.label` / `conditions.<id>.desc`).
 */
export const CONDITIONS: Condition[] = [
  {
    id: 'hypertension',
    effect: {
      bpmDelta: 8,
      sizeMultiplier: 1.1,
      contractionDelta: 0.05,
      bodyShift: { h: -3, s: 8, l: -6 },
      vesselShift: { s: 10, l: -8 },
      vesselThicknessMultiplier: 1.25,
      systolicDelta: 26,
      diastolicDelta: 15,
    },
  },
  {
    id: 'hypotension',
    effect: {
      bpmDelta: 8,
      bodyShift: { s: -14, l: 9 },
      vesselShift: { s: -12, l: 6 },
      systolicDelta: -24,
      diastolicDelta: -13,
    },
  },
  {
    id: 'tachycardia',
    effect: {
      bpmDelta: 34,
      contractionDelta: -0.08,
    },
  },
  {
    id: 'bradycardia',
    effect: {
      bpmDelta: -26,
      contractionDelta: 0.06,
    },
  },
  {
    id: 'arrhythmia',
    effect: {
      rhythmIrregularity: 0.65,
      bpmDelta: 10,
    },
  },
  {
    id: 'anemia',
    effect: {
      bpmDelta: 18,
      bodyShift: { s: -24, l: 15 },
      vesselShift: { s: -18, l: 12 },
    },
  },
  {
    id: 'atherosclerosis',
    effect: {
      bpmDelta: 5,
      vesselShift: { h: 34, s: -16, l: 4 },
      vesselThicknessMultiplier: 0.82,
      systolicDelta: 12,
      diastolicDelta: 4,
    },
  },
  {
    id: 'heart_failure',
    effect: {
      bpmDelta: 14,
      sizeMultiplier: 1.2,
      contractionDelta: -0.32,
      bodyShift: { h: -10, s: -6, l: -7 },
      vesselShift: { h: -8, l: -4 },
    },
  },
]

/** Id → Condition hızlı erişim tablosu. */
export const CONDITION_MAP: Record<string, Condition> = Object.fromEntries(
  CONDITIONS.map((c) => [c.id, c]),
)
