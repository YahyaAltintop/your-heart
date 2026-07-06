<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { HeartScene } from '../three/HeartScene'
import type { HeartParams } from '../types'

const props = defineProps<{
  params: HeartParams
  onBeat?: () => void
}>()

const wrapEl = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
let scene: HeartScene | null = null
let ro: ResizeObserver | null = null

function handleVisibility() {
  if (!scene) return
  if (document.hidden) scene.stop()
  else scene.start()
}

onMounted(() => {
  if (!canvasEl.value || !wrapEl.value) return
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  scene = new HeartScene(canvasEl.value, { reducedMotion })
  scene.onBeat = () => props.onBeat?.()
  scene.setParams(props.params)

  const rect = wrapEl.value.getBoundingClientRect()
  scene.resize(rect.width, rect.height)
  scene.start()

  ro = new ResizeObserver((entries) => {
    const r = entries[0].contentRect
    scene?.resize(r.width, r.height)
  })
  ro.observe(wrapEl.value)
  document.addEventListener('visibilitychange', handleVisibility)
})

// params, profil değiştikçe yeni bir nesne olarak yeniden hesaplanır;
// kimlik değişimini izlemek yeterli (derin izleme gerekmez).
watch(
  () => props.params,
  (p) => scene?.setParams(p),
)

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibility)
  ro?.disconnect()
  scene?.dispose()
  scene = null
})
</script>

<template>
  <div ref="wrapEl" class="viewer">
    <canvas ref="canvasEl" class="heart-canvas"></canvas>
  </div>
</template>

<style scoped>
.viewer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(120% 90% at 50% 18%, #3a1626 0%, #1a0b14 55%, #0b050b 100%);
  cursor: grab;
}
.viewer:active {
  cursor: grabbing;
}
.heart-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}
</style>
