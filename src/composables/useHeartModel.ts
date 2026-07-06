import type { HeartParams, Hsl, Profile } from '../types'
import { CONDITION_MAP } from '../data/conditions'

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

const wrapHue = (h: number) => ((h % 360) + 360) % 360

/** Referans yetişkin vücut yüzey alanı (m²). */
const REF_BSA = 1.73

/** Sağlıklı bir kalbin temel gövde ve damar renkleri. */
const BASE_BODY: Hsl = { h: 353, s: 60, l: 42 }
const BASE_VESSEL: Hsl = { h: 2, s: 72, l: 46 }

/** Mosteller formülü ile vücut yüzey alanı (m²). */
function bodySurfaceArea(height: number, weight: number): number {
  return Math.sqrt((height * weight) / 3600)
}

function applyShift(base: Hsl, shift: Partial<Hsl>): Hsl {
  return {
    h: wrapHue(base.h + (shift.h ?? 0)),
    s: clamp(base.s + (shift.s ?? 0), 0, 100),
    l: clamp(base.l + (shift.l ?? 0), 0, 100),
  }
}

/**
 * Yaşa göre normal istirahat nabzı temel değeri (aralık orta noktaları).
 * Kaynak: pediatrik/erişkin referans aralıkları (Cleveland Clinic, NCBI
 * Nursing Skills tablosu, CDC NHSR). Bebeklikte yüksek; çocuklukta hızla
 * düşüp ergenlikten sonra ~70 bpm'de sabitlenir.
 */
const AGE_HR: [number, number][] = [
  [0, 130],
  [1, 120],
  [3, 105],
  [6, 95],
  [10, 85],
  [14, 78],
  [18, 72],
  [30, 70],
  [50, 70],
  [70, 71],
  [100, 72],
]

/** AGE_HR tablosunu doğrusal aradeğerleyerek yaşa göre temel nabzı verir. */
function ageBaselineHr(age: number): number {
  if (age <= AGE_HR[0][0]) return AGE_HR[0][1]
  const last = AGE_HR[AGE_HR.length - 1]
  if (age >= last[0]) return last[1]
  for (let i = 1; i < AGE_HR.length; i++) {
    if (age <= AGE_HR[i][0]) {
      const [a0, h0] = AGE_HR[i - 1]
      const [a1, h1] = AGE_HR[i]
      return h0 + ((h1 - h0) * (age - a0)) / (a1 - a0)
    }
  }
  return 72
}

/** İstirahat nabzının temel değerini profil özelliklerinden kestirir. */
function baseRestingHr(profile: Profile, bmi: number): number {
  let hr = ageBaselineHr(profile.age)

  // Cinsiyet: kadınlarda istirahat nabzı ~5 bpm yüksek; fark ergenlikle belirginleşir.
  const sexRamp = clamp((profile.age - 10) / 5, 0, 1)
  if (profile.gender === 'female') hr += 5 * sexRamp

  // Aktiflik/kondisyon: sporcularda belirgin bradikardi, sedanterde yükselme.
  if (profile.activity === 'low') hr += 7
  else if (profile.activity === 'high') hr -= 15

  // Vücut kütlesi (J-şekilli ilişki: hem çok düşük hem yüksek VKİ yükseltir).
  if (bmi >= 35) hr += 11
  else if (bmi >= 30) hr += 8
  else if (bmi >= 25) hr += 4
  else if (bmi < 18.5) hr += 2

  return hr
}

/**
 * Ham profili, hem 3D sahnenin hem arayüzün kullandığı
 * hesaplanmış kalp parametrelerine dönüştüren saf fonksiyon.
 */
export function computeHeartParams(profile: Profile): HeartParams {
  const heightM = profile.height / 100
  const bmi = profile.weight / (heightM * heightM)
  const bsa = bodySurfaceArea(profile.height, profile.weight)

  // --- Nabız ---
  let bpm = baseRestingHr(profile, bmi)
  let irregularity = 0.03 // doğal atış-atış değişkenliği
  let contraction = 0.82
  let sizeMul = 1

  let body = { ...BASE_BODY }
  let vessel = { ...BASE_VESSEL }
  let vesselThickness = 1

  // --- Tansiyon temeli ---
  let systolic = 116 + clamp((profile.age - 30) * 0.32, -6, 26)
  let diastolic = 75 + clamp((profile.age - 30) * 0.12, -4, 12)
  systolic += profile.gender === 'male' ? 3 : 0

  // --- Hastalık etkilerini uygula ---
  for (const id of profile.conditions) {
    const c = CONDITION_MAP[id]
    if (!c) continue
    const e = c.effect
    bpm += e.bpmDelta ?? 0
    if (e.bpmMultiplier) bpm *= e.bpmMultiplier
    irregularity += e.rhythmIrregularity ?? 0
    contraction += e.contractionDelta ?? 0
    if (e.sizeMultiplier) sizeMul *= e.sizeMultiplier
    if (e.bodyShift) body = applyShift(body, e.bodyShift)
    if (e.vesselShift) vessel = applyShift(vessel, e.vesselShift)
    if (e.vesselThicknessMultiplier) vesselThickness *= e.vesselThicknessMultiplier
    systolic += e.systolicDelta ?? 0
    diastolic += e.diastolicDelta ?? 0
  }

  bpm = Math.round(clamp(bpm, 38, 200))
  irregularity = clamp(irregularity, 0, 0.9)
  contraction = clamp(contraction, 0.28, 1)
  systolic = Math.round(clamp(systolic, 84, 210))
  diastolic = Math.round(clamp(diastolic, 48, 130))

  // --- Kalp boyutu ---
  // Sol ventrikül kütlesi vücut yüzey alanıyla ölçeklenir (LVMi ~ sabit),
  // dolayısıyla doğrusal boyut ≈ BSA^~0.42. Aynı BSA'da erkek kalbi
  // ~%10-15 daha kütleli (LVMi: E ~70 vs K ~61 g/m²) → hafif cinsiyet çarpanı.
  const genderHeart = profile.gender === 'male' ? 1.05 : 0.97
  const baseScale = Math.pow(bsa / REF_BSA, 0.42) * genderHeart
  const sizeScale = clamp(baseScale * sizeMul, 0.72, 1.7)

  return {
    bpm,
    rhythmIrregularity: irregularity,
    contractionStrength: contraction,
    sizeScale,
    bodyColor: body,
    vesselColor: vessel,
    vesselThickness: clamp(vesselThickness, 0.6, 1.6),
    bmi,
    bsa,
    systolic,
    diastolic,
  }
}
