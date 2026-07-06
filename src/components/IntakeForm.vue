<script setup lang="ts">
import { reactive } from 'vue'
import type { Activity, Gender, Profile } from '../types'
import { CONDITIONS } from '../data/conditions'
import { t } from '../i18n'

const emit = defineEmits<{
  submit: [profile: Profile]
}>()

const form = reactive<Profile>({
  height: 175,
  weight: 70,
  age: 30,
  gender: 'male',
  activity: 'normal',
  conditions: [],
})

const genders: { value: Gender; key: string }[] = [
  { value: 'male', key: 'form.male' },
  { value: 'female', key: 'form.female' },
]

const activities: { value: Activity; key: string; hint: string }[] = [
  { value: 'low', key: 'form.activityLow', hint: 'form.activityLowHint' },
  { value: 'normal', key: 'form.activityNormal', hint: 'form.activityNormalHint' },
  { value: 'high', key: 'form.activityHigh', hint: 'form.activityHighHint' },
]

function toggleCondition(id: string) {
  const i = form.conditions.indexOf(id)
  if (i === -1) form.conditions.push(id)
  else form.conditions.splice(i, 1)
}

function clampField(field: 'height' | 'weight' | 'age', min: number, max: number) {
  const n = Number(form[field])
  form[field] = Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min
}

function submit() {
  clampField('height', 100, 220)
  clampField('weight', 30, 250)
  clampField('age', 1, 120)
  emit('submit', {
    ...form,
    conditions: [...form.conditions],
  })
}
</script>

<template>
  <form class="intake" @submit.prevent="submit">
    <header class="intro">
      <span class="badge">{{ t('form.badge') }}</span>
      <h1>{{ t('form.title') }}</h1>
      <p>{{ t('form.subtitle') }}</p>
    </header>

    <div class="card">
      <!-- Sayısal ölçüler -->
      <div class="fields">
        <label class="field">
          <span class="flabel">{{ t('form.height') }} <em>{{ form.height }} cm</em></span>
          <input
            v-model.number="form.height"
            type="range"
            min="100"
            max="220"
            step="1"
          />
        </label>
        <label class="field">
          <span class="flabel">{{ t('form.weight') }} <em>{{ form.weight }} kg</em></span>
          <input
            v-model.number="form.weight"
            type="range"
            min="30"
            max="200"
            step="1"
          />
        </label>
        <label class="field">
          <span class="flabel">{{ t('form.age') }} <em>{{ form.age }}</em></span>
          <input
            v-model.number="form.age"
            type="range"
            min="1"
            max="100"
            step="1"
          />
        </label>
      </div>

      <!-- Cinsiyet -->
      <div class="segment-row">
        <span class="section-label">{{ t('form.gender') }}</span>
        <div class="segment">
          <button
            v-for="g in genders"
            :key="g.value"
            type="button"
            :class="{ active: form.gender === g.value }"
            @click="form.gender = g.value"
          >
            {{ t(g.key) }}
          </button>
        </div>
      </div>

      <!-- Aktiflik -->
      <div class="segment-row">
        <span class="section-label">{{ t('form.activity') }}</span>
        <div class="segment">
          <button
            v-for="a in activities"
            :key="a.value"
            type="button"
            :class="{ active: form.activity === a.value }"
            @click="form.activity = a.value"
          >
            {{ t(a.key) }}
            <small>{{ t(a.hint) }}</small>
          </button>
        </div>
      </div>

      <!-- Hastalıklar -->
      <div class="conditions">
        <span class="section-label"
          >{{ t('form.health') }} <em>{{ t('form.healthHint') }}</em></span
        >
        <div class="chips">
          <button
            v-for="c in CONDITIONS"
            :key="c.id"
            type="button"
            class="chip"
            :class="{ on: form.conditions.includes(c.id) }"
            :title="t('conditions.' + c.id + '.desc')"
            @click="toggleCondition(c.id)"
          >
            {{ t('conditions.' + c.id + '.label') }}
          </button>
        </div>
      </div>

      <button type="submit" class="cta">{{ t('form.submit') }}</button>
    </div>
  </form>
</template>

<style scoped>
.intake {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.6vh, 16px);
}
.intro {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: clamp(3px, 0.7vh, 7px);
  align-items: center;
}
.badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  border: 1px solid var(--accent-border);
}
.intro h1 {
  margin: 0;
  font-size: clamp(22px, 3.8vh, 30px);
  line-height: 1.04;
  letter-spacing: -0.8px;
  color: var(--text-strong);
}
.intro p {
  margin: 0;
  max-width: 380px;
  font-size: clamp(11px, 1.5vh, 14px);
  color: var(--text-soft);
  line-height: 1.38;
}
.card {
  display: flex;
  flex-direction: column;
  gap: clamp(9px, 1.5vh, 15px);
  padding: clamp(14px, 2.1vh, 20px);
  border-radius: 18px;
  background: var(--card);
  border: 1px solid var(--card-border);
  box-shadow: var(--shadow-card);
}
.fields {
  display: flex;
  flex-direction: column;
  gap: clamp(7px, 1.3vh, 14px);
}
.field {
  display: flex;
  flex-direction: column;
  gap: clamp(4px, 0.8vh, 7px);
}
.flabel {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-weight: 600;
  color: var(--text-strong);
  font-size: 14px;
}
.flabel em {
  font-style: normal;
  color: var(--accent-strong);
  font-variant-numeric: tabular-nums;
  font-size: 14px;
}
input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 7px;
  border-radius: 999px;
  background: var(--track);
  outline: none;
}
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent);
  border: 3px solid var(--thumb-ring);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 45%, transparent);
  cursor: pointer;
  transition: transform 0.15s;
}
input[type='range']::-webkit-slider-thumb:hover {
  transform: scale(1.12);
}
input[type='range']::-moz-range-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent);
  border: 3px solid var(--thumb-ring);
  cursor: pointer;
}
.section-label {
  display: block;
  font-weight: 600;
  color: var(--text-strong);
  font-size: 13.5px;
  margin-bottom: clamp(5px, 0.9vh, 8px);
}
.section-label em {
  font-style: normal;
  font-weight: 500;
  color: var(--text-soft);
  font-size: 12px;
}
.segment {
  display: flex;
  gap: 5px;
  padding: 4px;
  border-radius: 12px;
  background: var(--track);
}
.segment button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: clamp(6px, 1.1vh, 9px) 8px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: var(--text-soft);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition:
    background 0.18s,
    color 0.18s,
    box-shadow 0.18s;
}
.segment button small {
  font-size: 10px;
  font-weight: 500;
  opacity: 0.75;
}
.segment button.active {
  background: var(--card);
  color: var(--accent-strong);
  box-shadow: var(--shadow-soft);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(5px, 0.8vh, 7px);
}
.chip {
  padding: clamp(5px, 0.9vh, 7px) 11px;
  border-radius: 999px;
  border: 1px solid var(--card-border);
  background: transparent;
  color: var(--text);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.18s,
    color 0.18s,
    border-color 0.18s;
}
.chip:hover {
  border-color: var(--accent-border);
}
.chip.on {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent);
}
.cta {
  margin-top: 2px;
  padding: clamp(10px, 1.6vh, 13px);
  border: none;
  border-radius: 13px;
  background: var(--accent);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.2s,
    background 0.2s;
  box-shadow: 0 8px 22px color-mix(in srgb, var(--accent) 40%, transparent);
}
.cta:hover {
  transform: translateY(-1px);
  background: var(--accent-strong);
}
.cta:active {
  transform: translateY(0);
}
</style>
