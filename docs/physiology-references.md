# Physiological Model — Scientific Basis and References

This document summarizes the literature behind the coefficients used in
`src/composables/useHeartModel.ts` and `src/data/conditions.ts`. Values are
**reasonable approximations** for educational/visualization purposes and make
no claim of clinical precision.

> ⚠️ The application does not substitute for medical diagnosis or advice.

---

## 1. Age → Resting Heart Rate

Heart rate is high in infancy, drops rapidly through childhood, and stabilizes
at ~70 bpm after adolescence. The model linearly interpolates a midpoint table
by age (`AGE_HR`).

| Age | Normal range (bpm) | Model baseline |
|-----|--------------------|----------------|
| Newborn (0–1 month) | 100–205 | ~130 |
| Infant (1–12 months) | 80–160 | ~120 |
| 1–3 years | 80–130 | ~118→105 |
| 3–5 years | 80–120 | ~105→100 |
| 6–12 years | 75–118 | ~95→85 |
| 13–19 years | 60–100 | ~78→72 |
| Adult / 65+ | 60–100 | ~70 (roughly stable with age) |
| Endurance athlete | 35–45 (elite ≤40) | via activity multiplier |

**Maximum heart rate:** The Tanaka formula `208 − 0.7 × age` is more accurate
than the classic `220 − age` (above age 40, the 220-age formula underestimates
max HR; ~10 bpm difference at age 70). Recommended by ACSM.

**HRV:** Heart rate variability decreases with age; RMSSD declines ~1–2 ms/year
after age 30, with the greatest drop in the 2nd–3rd decades.

Sources: [Cleveland Clinic — Heart Rate](https://my.clevelandclinic.org/health/diagnostics/heart-rate) ·
[NCBI Nursing Skills — Normal Heart Rate by Age](https://www.ncbi.nlm.nih.gov/books/NBK593193/table/ch1survey.T.normal_heart_rate_by_age/) ·
[CDC NHSR 41 — Resting Pulse Reference Data for Children](https://www.cdc.gov/nchs/data/nhsr/nhsr041.pdf) ·
[Tanaka et al. 2001, JACC (PMID 11153730)](https://pubmed.ncbi.nlm.nih.gov/11153730/) ·
[Frontiers — HRV Metrics and Norms](https://pmc.ncbi.nlm.nih.gov/articles/PMC5624990/)

## 2. Sex

Resting heart rate is on average ~4–8 bpm higher in women (smaller heart,
lower stroke volume). HUNT study: women 74, men 70 bpm. The model applies a
**female +5 bpm** offset that phases in gradually from adolescence.

Sources: [HUNT Study (Frontiers CVM)](https://www.frontiersin.org/journals/cardiovascular-medicine/articles/10.3389/fcvm.2026.1752910/full) ·
[Cleveland Clinic — Women and Heart Rate](https://my.clevelandclinic.org/health/articles/17644-women-and-heart-rate)

## 3. Height / Weight / BMI / Body Surface Area (BSA)

- **Obesity** raises resting heart rate (J-shaped relationship). Normal-weight
  ~72 bpm vs obese ~84 bpm; obese class ~18% faster. Model: BMI ≥25 +4,
  ≥30 +8, ≥35 +11; <18.5 +2 bpm.
- **Heart size:** Left ventricular mass scales with BSA (LVMi ≈ constant),
  so linear size ≈ `BSA^0.42`. ASE upper limits: LVMi ≤115 g/m² (M),
  ≤95 g/m² (F); 3D mean 70±9 (M) / 61±8 (F) g/m². At the same BSA, the male
  heart is ~10–15% heavier → model sex multiplier M ×1.05 / F ×0.97.
- **BSA (Mosteller):** `√(height_cm × weight_kg / 3600)`. Reference adult ~1.73 m².

Sources: [Healthline — Obesity & Resting Heart Rate](https://www.healthline.com/health/heart-health/heart-rate-obesity) ·
[J-shape BMI/HR (PMID 37249904)](https://pubmed.ncbi.nlm.nih.gov/37249904/) ·
[ASE — LV Mass Normal Values (JASE)](https://www.onlinejase.com/article/S0894-7317(15)00726-9/fulltext)

## 4. Activity / Fitness

In endurance athletes, resting heart rate drops to 35–45 bpm (athlete
bradycardia; HR ≤40 is well tolerated, ~28–29 in elites). It rises in
sedentary individuals. Model: high activity −15, low activity +7 bpm.

Source: [AHA Circulation — Bradycardia in Athletes](https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.125.076170)

## 5. Conditions

| Condition | HR effect | Blood pressure (mmHg) | Other |
|-----------|-----------|-----------------------|-------|
| **Hypertension** | +8 bpm (sympathetic; HR>80 signals over-activation) | Stage 2: ≥140/90 | LV hypertrophy → wall thickening, size ×1.1 |
| **Hypotension** | +8 bpm (reflex tachycardia) | <90/60 | Baroreceptor reflex; tissue pallor |
| **Tachycardia** | >100 bpm at rest | — | Filling ↓, stroke volume mildly ↓ |
| **Bradycardia** | <60 bpm | — | Filling ↑, beat fuller |
| **Arrhythmia (AFib)** | irregularly irregular; untreated ventricular ~100–160 | — | Rhythm irregularity 0.65 |
| **Anemia** | +18 bpm (compensatory; avg ~110 in severe anemia) | — | Cardiac output ↑ (especially Hgb <7), tissue pallor |
| **Atherosclerosis / CAD** | +5 bpm | systolic mildly ↑ | Significant stenosis ≥70%; vessels narrow, stiff, yellowish plaque |
| **Heart failure** | +14 bpm (compensatory) | — | EF ≤40% (HFrEF; normal 55–70%), cardiomegaly (CTR>0.5), dilation → size ×1.2, contractility ↓ |

**Blood pressure classification (2017 ACC/AHA):** Normal <120/80 · Elevated 120–129/<80 ·
Stage 1: 130–139/80–89 · Stage 2: ≥140/90.

**Cardiomegaly (cardiothoracic ratio):** normal 0.42–0.50 · mild 0.50–0.55 ·
moderate 0.55–0.60 · severe >0.60.

Sources: [2017 ACC/AHA BP Categories](https://pmc.ncbi.nlm.nih.gov/articles/PMC6912685/) ·
[AHA Hypertension — HR & Sympathetic Activation](https://www.ahajournals.org/doi/10.1161/HYPERTENSIONAHA.120.14898) ·
[Hypotension — StatPearls](https://www.ncbi.nlm.nih.gov/books/NBK499961/) ·
[Atrial Fibrillation — StatPearls](https://www.ncbi.nlm.nih.gov/books/NBK526072/) ·
[AHA — The Heart in Anemia](https://www.ahajournals.org/doi/pdf/10.1161/01.cir.8.1.111) ·
[HF EF Classification — JACC 2021 Universal Definition](https://www.jacc.org/doi/10.1016/j.jacc.2021.04.070) ·
[Cardiothoracic Ratio — NCBI](https://pmc.ncbi.nlm.nih.gov/articles/PMC8125954/) ·
[CAD & Resting HR Prognosis](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5689183/)
