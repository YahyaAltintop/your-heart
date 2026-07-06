<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { HeartParams } from '../types'
import { t } from '../i18n'

const props = defineProps<{
  params: HeartParams
}>()

const canvasEl = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let ro: ResizeObserver | null = null
let raf = 0
let running = false

// Çizim tamponu (kayan tarama).
let w = 480
let h = 120
let dpr = 1
let data: Float32Array = new Float32Array(1)
let writeX = 0
let lastTs = 0
let tSinceBeat = 999

// Canlı nabız sayacı (atış aralıklarından üstel hareketli ortalama).
const displayBpm = ref(props.params.bpm)
let ema = props.params.bpm
let lastBeat = 0
const beatPulse = ref(false)
let pulseTimer: ReturnType<typeof setTimeout> | null = null

const ECG = '#3df5a3'

const rhythmTag = computed(() => {
  if (props.params.rhythmIrregularity > 0.4) return t('monitor.rhythmAfib')
  if (props.params.bpm > 100) return t('monitor.rhythmTach')
  if (props.params.bpm < 60) return t('monitor.rhythmBrad')
  return t('monitor.rhythmSr')
})

const gauss = (x: number, mu: number, sig: number) =>
  Math.exp(-((x - mu) * (x - mu)) / (2 * sig * sig))

/** Sabit süreli PQRST dalga morfolojisi. */
function ecgWave(t: number): number {
  if (t < 0 || t > 0.75) return 0
  const p = 0.1 * gauss(t, 0.09, 0.025)
  const q = -0.13 * gauss(t, 0.17, 0.012)
  const r = 1.0 * gauss(t, 0.2, 0.012)
  const s = -0.3 * gauss(t, 0.235, 0.015)
  const tw = 0.24 * gauss(t, 0.37, 0.05)
  return p + q + r + s + tw
}

/** Her kalp atışında sahne tarafından çağrılır. */
function trigger(ts?: number) {
  tSinceBeat = 0
  const now = ts ?? (lastTs || 0)
  if (lastBeat && now > lastBeat) {
    const inst = 60000 / (now - lastBeat)
    if (inst > 25 && inst < 240) {
      ema = ema * 0.55 + inst * 0.45
      displayBpm.value = Math.round(ema)
    }
  }
  lastBeat = now

  beatPulse.value = true
  if (pulseTimer) clearTimeout(pulseTimer)
  pulseTimer = setTimeout(() => (beatPulse.value = false), 150)
}
defineExpose({ trigger })

function resize() {
  const c = canvasEl.value
  if (!c) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = c.getBoundingClientRect()
  w = Math.max(1, Math.floor(rect.width))
  h = Math.max(1, Math.floor(rect.height))
  c.width = Math.floor(w * dpr)
  c.height = Math.floor(h * dpr)
  ctx = c.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  data = new Float32Array(w)
  writeX = 0
}

function drawGrid(g: CanvasRenderingContext2D) {
  g.clearRect(0, 0, w, h)
  g.save()
  g.strokeStyle = 'rgba(61,245,163,0.10)'
  g.lineWidth = 1
  const step = 18
  g.beginPath()
  for (let x = (writeX % step); x <= w; x += step) {
    g.moveTo(x + 0.5, 0)
    g.lineTo(x + 0.5, h)
  }
  for (let y = 0; y <= h; y += step) {
    g.moveTo(0, y + 0.5)
    g.lineTo(w, y + 0.5)
  }
  g.stroke()
  g.restore()
}

const frame = (ts: number) => {
  if (!running) return
  raf = requestAnimationFrame(frame)
  if (!ctx) return

  const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0
  lastTs = ts
  tSinceBeat += dt

  const speed = w / 4.2
  const prevX = writeX
  writeX += speed * dt
  const sample = ecgWave(tSinceBeat)
  for (let x = Math.floor(prevX); x <= Math.floor(writeX); x++) {
    data[((x % w) + w) % w] = sample
  }
  if (writeX >= w) writeX -= w

  drawGrid(ctx)
  const mid = h * 0.62
  const amp = h * 0.44

  ctx.save()
  ctx.lineWidth = 2
  ctx.strokeStyle = ECG
  ctx.shadowColor = ECG
  ctx.shadowBlur = 10
  ctx.lineJoin = 'round'
  ctx.beginPath()
  const head = Math.floor(writeX)
  let started = false
  for (let x = 0; x < w; x++) {
    const dist = (head - x + w) % w
    if (dist < 5) {
      started = false
      continue
    }
    const y = mid - data[x] * amp
    if (!started) {
      ctx.moveTo(x, y)
      started = true
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke()
  ctx.restore()
}

onMounted(() => {
  resize()
  ro = new ResizeObserver(() => resize())
  if (canvasEl.value) ro.observe(canvasEl.value)
  running = true
  raf = requestAnimationFrame(frame)
})

onBeforeUnmount(() => {
  running = false
  if (raf) cancelAnimationFrame(raf)
  if (pulseTimer) clearTimeout(pulseTimer)
  ro?.disconnect()
})
</script>

<template>
  <div class="monitor" role="img" aria-label="Kalp atışı monitörü">
    <div class="ecg-wrap">
      <span class="lead">II</span>
      <canvas ref="canvasEl" class="ecg"></canvas>
    </div>

    <div class="readouts">
      <div class="vital hr">
        <div class="vital-top">
          <span class="tag">HR</span>
          <span class="rhythm">{{ rhythmTag }}</span>
        </div>
        <div class="big" :class="{ beat: beatPulse }">
          {{ displayBpm }}<span class="unit">bpm</span>
          <span class="ic" aria-hidden="true">♥</span>
        </div>
      </div>

      <div class="vital bp">
        <span class="tag">NIBP</span>
        <div class="mid">
          {{ params.systolic }}<span class="slash">/</span>{{ params.diastolic }}
          <span class="unit">mmHg</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.monitor {
  display: flex;
  align-items: stretch;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(6, 14, 12, 0.72);
  border: 1px solid rgba(61, 245, 163, 0.22);
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.5),
    inset 0 0 30px rgba(61, 245, 163, 0.05);
  backdrop-filter: blur(10px);
  font-variant-numeric: tabular-nums;
  min-width: 300px;
}
.ecg-wrap {
  position: relative;
  flex: 1 1 auto;
  min-width: 150px;
}
.lead {
  position: absolute;
  top: 2px;
  left: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  color: rgba(61, 245, 163, 0.7);
}
.ecg {
  display: block;
  width: 100%;
  height: 100px;
}
.readouts {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  flex: 0 0 auto;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  padding-left: 14px;
}
.vital-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  color: rgba(200, 255, 235, 0.55);
}
.rhythm {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #3df5a3;
  border: 1px solid rgba(61, 245, 163, 0.4);
  border-radius: 4px;
  padding: 1px 5px;
}
.big {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 40px;
  font-weight: 800;
  line-height: 1;
  color: #3df5a3;
  text-shadow: 0 0 14px rgba(61, 245, 163, 0.55);
  transition: transform 0.12s ease;
}
.big.beat {
  transform: scale(1.08);
}
.big .unit {
  font-size: 12px;
  font-weight: 600;
  color: rgba(61, 245, 163, 0.6);
}
.big .ic {
  font-size: 16px;
  margin-left: 2px;
  opacity: 0.5;
  transition:
    transform 0.12s ease,
    opacity 0.12s ease;
}
.big.beat .ic {
  opacity: 1;
  transform: scale(1.35);
}
.bp {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.bp .mid {
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-size: 22px;
  font-weight: 700;
  color: #ffd23f;
  text-shadow: 0 0 10px rgba(255, 210, 63, 0.35);
}
.bp .slash {
  opacity: 0.6;
  margin: 0 1px;
}
.bp .unit {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 210, 63, 0.55);
  margin-left: 4px;
}

@media (max-width: 560px) {
  .monitor {
    min-width: 0;
    gap: 10px;
    padding: 10px;
  }
  .big {
    font-size: 32px;
  }
  .readouts {
    padding-left: 10px;
  }
}
</style>
