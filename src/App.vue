<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import IntakeForm from './components/IntakeForm.vue'
import VitalsMonitor from './components/VitalsMonitor.vue'
import LangSwitch from './components/LangSwitch.vue'
import { computeHeartParams } from './composables/useHeartModel'
import { t } from './i18n'
import type { Profile } from './types'

// 3B sahne (ve Three.js) yalnızca sonuç ekranında yüklensin.
const HeartViewer = defineAsyncComponent(() => import('./components/HeartViewer.vue'))

type Stage = 'form' | 'result'

const stage = ref<Stage>('form')
const profile = ref<Profile | null>(null)
const monitorRef = ref<InstanceType<typeof VitalsMonitor> | null>(null)

const params = computed(() =>
  profile.value ? computeHeartParams(profile.value) : null,
)

function onSubmit(p: Profile) {
  profile.value = p
  stage.value = 'result'
}

function edit() {
  stage.value = 'form'
}

// Sahnedeki her kalp atışını ECG monitörüne ilet (senkron sivri uç + sayaç).
function handleBeat() {
  monitorRef.value?.trigger()
}
</script>

<template>
  <div class="app">
    <div v-if="stage === 'form'" class="aura" aria-hidden="true"></div>

    <LangSwitch class="lang" />

    <Transition name="fade" mode="out-in">
      <!-- Giriş formu -->
      <main v-if="stage === 'form'" key="form" class="stage form-stage">
        <IntakeForm @submit="onSubmit" />
      </main>

      <!-- Sonuç: tam ekran atan kalp -->
      <main v-else-if="params" key="result" class="result-stage">
        <HeartViewer :params="params" :on-beat="handleBeat" />
        <button class="back" type="button" @click="edit">{{ t('result.back') }}</button>
        <VitalsMonitor ref="monitorRef" :params="params" class="vitals" />
      </main>
    </Transition>
  </div>
</template>

<style scoped>
.app {
  position: relative;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.aura {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(60% 55% at 18% 12%, var(--aura-1) 0%, transparent 60%),
    radial-gradient(55% 50% at 85% 20%, var(--aura-2) 0%, transparent 55%),
    radial-gradient(70% 60% at 50% 100%, var(--aura-3) 0%, transparent 60%);
  filter: saturate(1.05);
}
.lang {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10;
}
.stage {
  flex: 1;
  width: 100%;
  max-width: 1160px;
  margin: 0 auto;
  padding: clamp(12px, 3vh, 36px) 20px;
  box-sizing: border-box;
}
.form-stage {
  display: flex;
  align-items: center;
  justify-content: center;
}
.result-stage {
  position: fixed;
  inset: 0;
}
.vitals {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  width: min(520px, calc(100vw - 32px));
}
@media (max-width: 560px) {
  .vitals {
    bottom: 14px;
  }
}
.back {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 2;
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(20, 10, 16, 0.45);
  color: #f4dee4;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition:
    transform 0.15s,
    background 0.2s;
}
.back:hover {
  transform: translateX(-2px);
  background: rgba(40, 18, 28, 0.6);
}

/* Sahne geçişi */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
