import { ref } from 'vue'

export type Locale = 'tr' | 'en'

const STORAGE_KEY = 'your-heart:locale'

type Dict = Record<string, unknown>

const messages: Record<Locale, Dict> = {
  tr: {
    meta: { title: 'your-heart · 3B Kalp Modeli' },
    form: {
      badge: '🫀 your-heart',
      title: 'Kalbini tanı',
      subtitle:
        'Boy, kilo, yaş ve sağlık durumunu gir; sana özel atan bir 3B kalp modeli oluşturalım.',
      height: 'Boy',
      weight: 'Kilo',
      age: 'Yaş',
      gender: 'Cinsiyet',
      male: 'Erkek',
      female: 'Kadın',
      activity: 'Aktiflik düzeyi',
      activityLow: 'Az',
      activityLowHint: 'Hareketsiz',
      activityNormal: 'Orta',
      activityNormalHint: 'Dengeli',
      activityHigh: 'Yüksek',
      activityHighHint: 'Sporcu',
      health: 'Sağlık durumu',
      healthHint: '(varsa seç)',
      submit: 'Kalbimi oluştur →',
    },
    result: {
      back: '← Geri',
    },
    monitor: {
      rhythmSr: 'SR',
      rhythmAfib: 'AFIB',
      rhythmTach: 'S. TAŞİ',
      rhythmBrad: 'S. BRADİ',
    },
    conditions: {
      hypertension: {
        label: 'Hipertansiyon',
        desc: 'Evre 2 hipertansiyon (≥140/90 mmHg). Artmış sempatik aktivite nabzı >80 bpm’e çeker; sol ventrikül duvarı kalınlaşır (hipertrofi), damarlar dolgun ve koyulaşır.',
      },
      hypotension: {
        label: 'Hipotansiyon',
        desc: 'Düşük tansiyon (<90/60 mmHg). Baroreseptör refleksi devreye girer: kalp, doku kanlanmasını korumak için hızlanır (refleks taşikardi); doku solgunlaşır.',
      },
      tachycardia: {
        label: 'Taşikardi',
        desc: 'İstirahat nabzının >100 bpm olmasıdır; kalp dolum süresi kısaldığı için atış hacmi biraz düşer.',
      },
      bradycardia: {
        label: 'Bradikardi',
        desc: 'İstirahat nabzının <60 bpm olmasıdır; dolum süresi uzar, atışlar daha dolgun ve belirgin hissedilir.',
      },
      arrhythmia: {
        label: 'Aritmi',
        desc: 'Atriyal fibrilasyon: "düzensizce düzensiz" ritim. Atriyumlar titrer, karıncık hızı düzensiz ve genelde hızlıdır (tedavisiz ~100-160 bpm).',
      },
      anemia: {
        label: 'Anemi',
        desc: 'Kanın oksijen taşıma kapasitesi düşüktür; kalp debisini korumak için telafi edici taşikardi gelişir (ağır anemide ortalama nabız ~110 bpm), doku solgunlaşır.',
      },
      atherosclerosis: {
        label: 'Ateroskleroz',
        desc: 'Koroner arterlerde plak birikir (anlamlı darlık ≥%70). Damarlar sertleşir, sarımsı plak tonuna kayar ve daralır; yüksek istirahat nabzı kötü gidişle ilişkilidir.',
      },
      heart_failure: {
        label: 'Kalp yetmezliği',
        desc: 'Düşük ejeksiyon fraksiyonu (HFrEF, EF ≤%40; normal ~%55-70). Karıncık genişler (kardiyomegali, kardiyotorasik oran >0.5), atış gücü azalır, telafi edici taşikardi gelişir, renk morumsulaşır.',
      },
    },
  },
  en: {
    meta: { title: 'your-heart · 3D Heart Model' },
    form: {
      badge: '🫀 your-heart',
      title: 'Know your heart',
      subtitle:
        'Enter your height, weight, age and health conditions; we’ll build a personalized beating 3D heart.',
      height: 'Height',
      weight: 'Weight',
      age: 'Age',
      gender: 'Sex',
      male: 'Male',
      female: 'Female',
      activity: 'Activity level',
      activityLow: 'Low',
      activityLowHint: 'Sedentary',
      activityNormal: 'Moderate',
      activityNormalHint: 'Balanced',
      activityHigh: 'High',
      activityHighHint: 'Athlete',
      health: 'Health conditions',
      healthHint: '(select if any)',
      submit: 'Build my heart →',
    },
    result: {
      back: '← Back',
    },
    monitor: {
      rhythmSr: 'SR',
      rhythmAfib: 'AFIB',
      rhythmTach: 'S. TACH',
      rhythmBrad: 'S. BRAD',
    },
    conditions: {
      hypertension: {
        label: 'Hypertension',
        desc: 'Stage 2 hypertension (≥140/90 mmHg). Increased sympathetic activity pushes the rate above 80 bpm; the left ventricular wall thickens (hypertrophy) and vessels look engorged and darker.',
      },
      hypotension: {
        label: 'Hypotension',
        desc: 'Low blood pressure (<90/60 mmHg). The baroreceptor reflex kicks in: the heart speeds up to maintain perfusion (reflex tachycardia); tissue looks paler.',
      },
      tachycardia: {
        label: 'Tachycardia',
        desc: 'A resting heart rate above 100 bpm; filling time shortens so stroke volume drops slightly.',
      },
      bradycardia: {
        label: 'Bradycardia',
        desc: 'A resting heart rate below 60 bpm; filling time lengthens and beats feel fuller and more pronounced.',
      },
      arrhythmia: {
        label: 'Arrhythmia',
        desc: 'Atrial fibrillation: an “irregularly irregular” rhythm. The atria quiver and the ventricular rate is irregular and usually fast (~100–160 bpm untreated).',
      },
      anemia: {
        label: 'Anemia',
        desc: 'The blood’s oxygen-carrying capacity is low; compensatory tachycardia develops to maintain cardiac output (average ~110 bpm in severe anemia) and tissue looks pale.',
      },
      atherosclerosis: {
        label: 'Atherosclerosis',
        desc: 'Plaque builds up in the coronary arteries (significant stenosis ≥70%). Vessels stiffen, shift to a yellowish plaque tone and narrow; a high resting heart rate is linked to worse outcomes.',
      },
      heart_failure: {
        label: 'Heart failure',
        desc: 'Reduced ejection fraction (HFrEF, EF ≤40%; normal ~55–70%). The ventricle enlarges (cardiomegaly, cardiothoracic ratio >0.5), contraction weakens, compensatory tachycardia develops and the color turns purplish.',
      },
    },
  },
}

/** İlk açılışta: kayıtlı tercih varsa onu, yoksa tarayıcı dilini kullan. */
function detect(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'tr' || saved === 'en') return saved
  } catch {
    // localStorage erişilemezse tarayıcı diline düş.
  }
  const nav = (navigator.language || 'en').toLowerCase()
  return nav.startsWith('tr') ? 'tr' : 'en'
}

export const locale = ref<Locale>(detect())

/** Noktalı anahtarı (a.b.c) sözlükte çözer; bulunamazsa anahtarı döndürür. */
function resolve(dict: Dict, key: string): string {
  const val = key.split('.').reduce<unknown>((o, k) => {
    if (o && typeof o === 'object') return (o as Record<string, unknown>)[k]
    return undefined
  }, dict)
  return typeof val === 'string' ? val : key
}

/** Çeviri fonksiyonu. locale.value okuduğu için şablonlarda reaktiftir. */
export function t(key: string): string {
  return resolve(messages[locale.value], key)
}

/** Etkin dili değiştirir, kalıcılaştırır ve belge dilini/başlığını günceller. */
export function setLocale(l: Locale) {
  locale.value = l
  try {
    localStorage.setItem(STORAGE_KEY, l)
  } catch {
    // sessizce geç
  }
  applyDocument()
}

/** <html lang> ve sekme başlığını etkin dile göre ayarlar. */
export function applyDocument() {
  document.documentElement.lang = locale.value
  document.title = t('meta.title')
}
