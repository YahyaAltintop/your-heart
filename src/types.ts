// Uygulama genelinde kullanılan tip tanımları.

export type Gender = 'male' | 'female'

/** Günlük fiziksel aktivite düzeyi — istirahat nabzını etkiler. */
export type Activity = 'low' | 'normal' | 'high'

/** Kullanıcıdan alınan ham profil bilgisi. */
export interface Profile {
  height: number // cm
  weight: number // kg
  age: number // yıl
  gender: Gender
  activity: Activity
  conditions: string[] // seçili hastalık id'leri
}

/** HSL renk — sağlık durumuna göre kolay kaydırma için. */
export interface Hsl {
  h: number // 0..360
  s: number // 0..100
  l: number // 0..100
}

/**
 * Bir hastalığın kalp modeli üzerindeki etkisini tanımlar.
 * Tüm alanlar opsiyoneldir; verilmeyenler nötr kabul edilir.
 */
export interface ConditionEffect {
  bpmDelta?: number // istirahat nabzına eklenen sabit
  bpmMultiplier?: number // nabız çarpanı
  rhythmIrregularity?: number // 0..1 ritim düzensizliği katkısı
  contractionDelta?: number // kasılma gücü değişimi (-1..1)
  sizeMultiplier?: number // kalp boyutu çarpanı
  bodyShift?: Partial<Hsl> // gövde renginde HSL kaydırma
  vesselShift?: Partial<Hsl> // damar renginde HSL kaydırma
  vesselThicknessMultiplier?: number // damar kalınlığı çarpanı
  systolicDelta?: number // sistolik tansiyon değişimi (mmHg)
  diastolicDelta?: number // diyastolik tansiyon değişimi (mmHg)
}

/**
 * Seçilebilir bir hastalık/durum. Görünen metin (etiket/açıklama) i18n
 * katmanında `conditions.<id>.*` anahtarlarında tutulur; burada yalnızca
 * kimlik ve sayısal etki bulunur.
 */
export interface Condition {
  id: string
  effect: ConditionEffect
}

/**
 * Profilden türetilen, hem 3D sahnenin hem de arayüzün
 * kullandığı hesaplanmış kalp parametreleri.
 */
export interface HeartParams {
  bpm: number
  rhythmIrregularity: number // 0..1
  contractionStrength: number // 0..1 (atış genliği)
  sizeScale: number // görsel doğrusal ölçek
  bodyColor: Hsl
  vesselColor: Hsl
  vesselThickness: number // çarpan
  bmi: number
  bsa: number // m²
  systolic: number
  diastolic: number
}
