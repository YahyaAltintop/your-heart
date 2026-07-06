<script setup lang="ts">
import { locale, setLocale, type Locale } from '../i18n'

const options: Locale[] = ['tr', 'en']
</script>

<template>
  <div class="lang-switch" role="group" aria-label="Dil / Language">
    <button
      v-for="l in options"
      :key="l"
      type="button"
      :class="{ active: locale === l }"
      :aria-pressed="locale === l"
      @click="setLocale(l)"
    >
      {{ l.toUpperCase() }}
    </button>
  </div>
</template>

<style scoped>
.lang-switch {
  display: inline-flex;
  gap: 3px;
  padding: 3px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--card) 80%, transparent);
  border: 1px solid var(--card-border);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(8px);
}
.lang-switch button {
  border: none;
  background: transparent;
  color: var(--text-soft);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 5px 11px;
  border-radius: 999px;
  cursor: pointer;
  transition:
    background 0.18s,
    color 0.18s;
}
.lang-switch button.active {
  background: var(--accent);
  color: #fff;
}
.lang-switch button:not(.active):hover {
  color: var(--text-strong);
}
</style>
