import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { HeartParams, Hsl } from '../types'

const hslColor = (c: Hsl) => new THREE.Color().setHSL(c.h / 360, c.s / 100, c.l / 100)

/** Deterministik, ucuz 3B pürüz fonksiyonu (~ -1..1). */
function noise3(x: number, y: number, z: number): number {
  return Math.sin(x * 3.9 + y * 2.3) * Math.cos(y * 3.3 + z * 1.7) * Math.sin(z * 3.1 + x * 1.3)
}

function fbm(v: THREE.Vector3, f1: number, f2: number, a2: number): number {
  return noise3(v.x * f1, v.y * f1, v.z * f1) + a2 * noise3(v.x * f2, v.y * f2, v.z * f2)
}

/**
 * Bir kardiyak döngü içindeki mekanik "lub-dub" yer değiştirmesi.
 * Atıştan geçen saniyeye (t) göre sabit süreli bir geçici darbe üretir.
 */
function thump(t: number): number {
  if (t < 0) return 0
  const lub = Math.exp(-Math.pow((t - 0.06) / 0.05, 2))
  const dub = 0.55 * Math.exp(-Math.pow((t - 0.24) / 0.06, 2))
  return lub + dub
}

/**
 * Karıncık kütlesi: küreden yontulan anatomik gövde.
 * - alt yarı uzar ve apekse doğru daralır (uç hastanın soluna kayar)
 * - üst taban düzleşir (damarların çıktığı bölge)
 * - ön yüzde apekse kıvrılan interventriküler oluk
 * - oluk ve taban çevresinde kremsi epikardiyal yağ (vertex rengi)
 */
function buildVentricles(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 128, 96)
  const pos = geo.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  const v = new THREE.Vector3()

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)

    if (v.y < 0) v.y *= 1.5
    v.x *= 1.04
    v.z *= 0.94

    const k = THREE.MathUtils.clamp(-v.y / 1.5, 0, 1)
    const taper = 1 - 0.42 * k * k
    v.x = v.x * taper + 0.34 * k * k
    v.z *= taper

    if (v.y > 0.55) {
      const f = (v.y - 0.55) / 0.45
      v.x *= 1 - 0.16 * f
      v.z *= 1 - 0.2 * f
      v.y = 0.55 + (v.y - 0.55) * 0.7
    }

    // Ön yüz bombesi (sağ karıncık öne bakar).
    if (v.z > 0) v.z *= 1 + 0.1 * (1 - k)

    // İnterventriküler oluk.
    let fat = 0
    if (v.z > 0.15) {
      const grooveX = -0.12 + 0.48 * k
      const d = v.x - grooveX
      const g = Math.exp(-(d * d) / (2 * 0.12 * 0.12))
      v.z -= 0.075 * g
      fat = g
    }

    // Atriyoventriküler oluk çevresi yağ bandı.
    fat = Math.max(fat, Math.exp(-Math.pow((v.y - 0.45) / 0.17, 2)))
    // Yağ kenarlarını gürültüyle parçala (gerçek epikardiyal yağ blob bloptur).
    fat *= THREE.MathUtils.clamp(0.55 + 0.75 * noise3(v.x * 3.4 + 7.1, v.y * 3.4, v.z * 3.4), 0, 1.15)

    // Organik pürüz: iri form bozulması + ince doku dalgası.
    v.multiplyScalar(1 + 0.02 * fbm(v, 2.2, 5.6, 0.45) + 0.007 * noise3(v.x * 11, v.y * 11, v.z * 11))

    pos.setXYZ(i, v.x, v.y, v.z)

    const fw = Math.min(1, fat) * 0.55
    colors[i * 3 + 0] = 1 + fw * 0.25
    colors[i * 3 + 1] = 1 + fw * 0.9
    colors[i * 3 + 2] = 1 + fw * 0.55
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}

/** Kulakçıklar ve auriküller için pürüzlü elipsoit. */
function lumpySphere(sx: number, sy: number, sz: number, lump: number): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 48, 36)
  const pos = geo.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    // Daha iri, organik loblar; yüksek frekans kısık (karnabahar görünümünü önler).
    v.multiplyScalar(1 + lump * fbm(v, 1.8, 4.4, 0.3))
    pos.setXYZ(i, v.x * sx, v.y * sy, v.z * sz)
  }
  geo.computeVertexNormals()
  return geo
}

interface HeartTextures {
  map: THREE.CanvasTexture
  bump: THREE.CanvasTexture
  rough: THREE.CanvasTexture
}

/** Yüzeyde dallanan kılcal damarcık ağacı çizer. */
function drawVeinTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ang: number,
  len: number,
  width: number,
  depth: number,
) {
  if (depth <= 0 || width < 0.5) return
  const steps = 4
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x, y)
  let cx = x
  let cy = y
  let a = ang
  for (let i = 0; i < steps; i++) {
    a += (Math.random() - 0.5) * 0.9
    cx += Math.cos(a) * (len / steps)
    cy += Math.sin(a) * (len / steps)
    ctx.lineTo(cx, cy)
  }
  ctx.stroke()
  drawVeinTree(ctx, cx, cy, a + 0.3 + Math.random() * 0.8, len * 0.72, width * 0.62, depth - 1)
  drawVeinTree(ctx, cx, cy, a - 0.3 - Math.random() * 0.8, len * 0.72, width * 0.62, depth - 1)
}

/**
 * Kalp dokusu için prosedürel haritalar:
 * - map: nötr açık taban (malzeme rengi tonu belirler) + benekler + koyu damarcıklar
 * - bump: kas lifi çizgileri + ince tanecik + damarcık kabartısı
 * - rough: ıslak doku için yer yer parlayan pürüzlülük
 */
function makeHeartTextures(): HeartTextures {
  const W = 1024

  const mk = (fill: string) => {
    const c = document.createElement('canvas')
    c.width = c.height = W
    const ctx = c.getContext('2d')!
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, W, W)
    return { c, ctx }
  }

  const map = mk('#efe9e7')
  const bump = mk('#808080')
  const rough = mk('#a6a6a6')

  // 1) Büyük yumuşak benekler: küçük kanvasta çiz, büyüterek yumuşat.
  const blot = document.createElement('canvas')
  blot.width = blot.height = 128
  const bctx = blot.getContext('2d')!
  bctx.fillStyle = 'rgba(0,0,0,0)'
  for (let i = 0; i < 90; i++) {
    const dark = Math.random() < 0.55
    const v = dark ? 70 : 235
    bctx.fillStyle = `rgba(${v},${dark ? 45 : 225},${dark ? 55 : 222},${0.05 + Math.random() * 0.08})`
    const r = 6 + Math.random() * 22
    bctx.beginPath()
    bctx.ellipse(Math.random() * 128, Math.random() * 128, r, r * (0.5 + Math.random() * 0.5), Math.random() * Math.PI, 0, Math.PI * 2)
    bctx.fill()
  }
  map.ctx.globalAlpha = 0.8
  map.ctx.drawImage(blot, 0, 0, W, W)
  map.ctx.globalAlpha = 1
  rough.ctx.globalAlpha = 0.5
  rough.ctx.drawImage(blot, 0, 0, W, W)
  rough.ctx.globalAlpha = 1

  // 2) Kas lifi çizgileri: hafif dalgalı, yatay akış (miyokart lif yönü hissi).
  for (let i = 0; i < 900; i++) {
    const y0 = Math.random() * W
    const x0 = Math.random() * W
    const len = 40 + Math.random() * 120
    const amp = 2 + Math.random() * 6
    const ph = Math.random() * Math.PI * 2
    const light = Math.random() < 0.5
    const g = light ? 148 : 110
    bump.ctx.strokeStyle = `rgba(${g},${g},${g},${0.10 + Math.random() * 0.10})`
    bump.ctx.lineWidth = 0.8 + Math.random() * 1.4
    bump.ctx.beginPath()
    for (let s = 0; s <= 10; s++) {
      const x = x0 + (s / 10) * len
      const y = y0 + Math.sin(ph + (s / 10) * Math.PI * 2) * amp
      if (s === 0) bump.ctx.moveTo(x, y)
      else bump.ctx.lineTo(x, y)
    }
    bump.ctx.stroke()
  }

  // 3) Kılcal damarcık ağaçları: koyu bordo, yarı saydam.
  map.ctx.strokeStyle = 'rgba(88,26,42,0.13)'
  map.ctx.lineCap = 'round'
  for (let i = 0; i < 22; i++) {
    drawVeinTree(map.ctx, Math.random() * W, Math.random() * W, Math.random() * Math.PI * 2, 80 + Math.random() * 120, 2.8, 4)
  }
  bump.ctx.strokeStyle = 'rgba(96,96,96,0.35)'
  bump.ctx.lineCap = 'round'
  for (let i = 0; i < 10; i++) {
    drawVeinTree(bump.ctx, Math.random() * W, Math.random() * W, Math.random() * Math.PI * 2, 80 + Math.random() * 100, 3, 3)
  }
  // Damarcıklar ıslak/parlak olsun: rough haritasında koyult.
  rough.ctx.strokeStyle = 'rgba(90,90,90,0.25)'
  rough.ctx.lineCap = 'round'
  for (let i = 0; i < 12; i++) {
    drawVeinTree(rough.ctx, Math.random() * W, Math.random() * W, Math.random() * Math.PI * 2, 90 + Math.random() * 120, 4, 3)
  }

  // 4) İnce tanecik.
  for (let i = 0; i < 4200; i++) {
    const g = 96 + Math.floor(Math.random() * 64)
    bump.ctx.fillStyle = `rgba(${g},${g},${g},${(0.05 + Math.random() * 0.09).toFixed(3)})`
    const r = 0.8 + Math.random() * 4.5
    bump.ctx.beginPath()
    bump.ctx.ellipse(Math.random() * W, Math.random() * W, r, r * (0.4 + Math.random() * 0.6), Math.random() * Math.PI, 0, Math.PI * 2)
    bump.ctx.fill()
  }

  const toTex = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    if (srgb) t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  }
  return { map: toTex(map.c, true), bump: toTex(bump.c, false), rough: toTex(rough.c, false) }
}

type Pt = [number, number, number]

/** Koroner arter hatları (yüzeye oturtulmadan önceki kaba rotalar). */
const CORONARIES: { pts: Pt[]; r: number }[] = [
  // Sol ön inen (LAD) — interventriküler oluğu izler.
  {
    pts: [
      [0.0, 0.62, 0.5],
      [-0.1, 0.25, 0.95],
      [-0.02, -0.15, 1.0],
      [0.1, -0.6, 0.85],
      [0.25, -1.0, 0.6],
      [0.32, -1.3, 0.3],
    ],
    r: 0.034,
  },
  // LAD diyagonal dalları.
  { pts: [[-0.02, -0.1, 1.0], [0.3, -0.35, 0.85], [0.5, -0.6, 0.6]], r: 0.02 },
  { pts: [[0.08, -0.55, 0.9], [0.35, -0.8, 0.6], [0.5, -1.0, 0.4]], r: 0.018 },
  // Sağ koroner (RCA) — sağ AV oluğu boyunca dolanır.
  {
    pts: [
      [-0.05, 0.55, 0.55],
      [-0.5, 0.45, 0.75],
      [-0.85, 0.3, 0.45],
      [-1.0, 0.1, -0.05],
      [-0.8, -0.2, -0.5],
    ],
    r: 0.032,
  },
  { pts: [[-0.9, 0.2, 0.25], [-0.9, -0.2, 0.35], [-0.7, -0.6, 0.3]], r: 0.02 },
  // Sirkumfleks — sola dolanır.
  {
    pts: [
      [0.1, 0.6, 0.5],
      [0.5, 0.52, 0.6],
      [0.85, 0.35, 0.25],
      [0.95, 0.2, -0.25],
    ],
    r: 0.028,
  },
  { pts: [[0.85, 0.3, 0.3], [0.9, -0.1, 0.25], [0.75, -0.5, 0.2]], r: 0.02 },
]

export interface HeartSceneOptions {
  reducedMotion?: boolean
}

/**
 * Anatomik, prosedürel, atan 3B insan kalbi sahnesi.
 * Vue bileşeni yaşam döngüsünü (start/stop/resize/dispose) yönetir.
 */
export class HeartScene {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private clock: THREE.Clock
  private raf = 0
  private running = false
  private reducedMotion: boolean

  private group = new THREE.Group()
  private ventGroup = new THREE.Group()
  private atriaGroup = new THREE.Group()
  private vesselGroup = new THREE.Group()
  private coronaryGroup = new THREE.Group()

  private muscleMat: THREE.MeshPhysicalMaterial
  private atriaMat: THREE.MeshPhysicalMaterial
  private arteryMat: THREE.MeshPhysicalMaterial
  private veinMat: THREE.MeshPhysicalMaterial
  private lumenMat: THREE.MeshStandardMaterial
  private textures: HeartTextures
  private ventGeo: THREE.BufferGeometry

  /** Yüzeye oturtulmuş koroner hatlar; kalınlık değişince yeniden tüplenir. */
  private coronarySpecs: { pts: THREE.Vector3[]; r: number }[] = []

  // Boyut ve atış durumu.
  private targetScale = 1
  private currentScale = 1
  private amplitude = 0.09
  private baseEmissive = 0.12
  private glow = 0.35
  private tSinceBeat = 0
  private cycleLength = 1
  private bpm = 72
  private irregularity = 0.03

  /** Her yeni kardiyak döngü başında tetiklenir (ECG monitörü senkronu için). */
  onBeat: (() => void) | null = null

  constructor(canvas: HTMLCanvasElement, opts: HeartSceneOptions = {}) {
    this.reducedMotion = opts.reducedMotion ?? false

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 0.95
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    // RoomEnvironment çok parlaktır; doku rengini yıkamaması için kıs.
    this.scene.environmentIntensity = 0.05

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    // Varsayılan zoom: kalp, alttaki ritim monitörüyle birlikte ekrana rahat
    // sığacak şekilde geride konumlanır.
    this.camera.position.set(0, 0.3, 7.6)

    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.target.set(0, 0.1, 0)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.enablePan = false
    this.controls.minDistance = 3.2
    this.controls.maxDistance = 11
    this.controls.autoRotate = !this.reducedMotion
    this.controls.autoRotateSpeed = 0.6

    this.addLights()

    // --- Malzemeler ---
    this.textures = makeHeartTextures()
    this.muscleMat = new THREE.MeshPhysicalMaterial({
      color: 0xb0243a,
      vertexColors: true,
      map: this.textures.map,
      roughness: 1,
      roughnessMap: this.textures.rough,
      metalness: 0,
      clearcoat: 0.16,
      clearcoatRoughness: 0.28,
      sheen: 0.3,
      sheenColor: new THREE.Color(0x7a1220),
      bumpMap: this.textures.bump,
      bumpScale: 0.6,
      emissive: 0x40060e,
      emissiveIntensity: this.baseEmissive,
    })
    this.atriaMat = new THREE.MeshPhysicalMaterial({
      color: 0xc04a55,
      map: this.textures.map,
      roughness: 1,
      roughnessMap: this.textures.rough,
      clearcoat: 0.2,
      clearcoatRoughness: 0.25,
      sheen: 0.25,
      sheenColor: new THREE.Color(0x7a1220),
      bumpMap: this.textures.bump,
      bumpScale: 0.5,
      emissive: 0x40060e,
      emissiveIntensity: this.baseEmissive,
    })
    this.arteryMat = new THREE.MeshPhysicalMaterial({
      color: 0xc0303a,
      map: this.textures.map,
      roughness: 0.55,
      roughnessMap: this.textures.rough,
      clearcoat: 0.2,
      clearcoatRoughness: 0.25,
      bumpMap: this.textures.bump,
      bumpScale: 0.25,
    })
    this.veinMat = new THREE.MeshPhysicalMaterial({
      color: 0x5c5f9e,
      map: this.textures.map,
      roughness: 0.6,
      roughnessMap: this.textures.rough,
      clearcoat: 0.15,
      clearcoatRoughness: 0.3,
      bumpMap: this.textures.bump,
      bumpScale: 0.25,
    })
    this.lumenMat = new THREE.MeshStandardMaterial({
      color: 0x1c0507,
      roughness: 0.9,
      side: THREE.DoubleSide,
    })

    // --- Geometri ---
    this.ventGeo = buildVentricles()
    const vent = new THREE.Mesh(this.ventGeo, this.muscleMat)
    this.ventGroup.add(vent)
    this.ventGroup.add(this.coronaryGroup)

    this.buildAtria()
    this.buildGreatVessels()

    // Koroner hatları karıncık yüzeyine oturt (bir kez; sonra sadece tüplenir).
    this.coronarySpecs = CORONARIES.map((c) => ({
      pts: this.snapCurve(c.pts.map((p) => new THREE.Vector3(...p)), c.r),
      r: c.r,
    }))
    this.rebuildCoronaries(1)

    this.group.add(this.ventGroup, this.atriaGroup, this.vesselGroup)
    this.group.rotation.y = -0.35
    this.scene.add(this.group)

    this.clock = new THREE.Clock()
  }

  private addLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.12))

    const key = new THREE.DirectionalLight(0xfff0e8, 1.2)
    key.position.set(4, 6, 7)
    this.scene.add(key)

    const rim = new THREE.DirectionalLight(0x7aa2ff, 0.9)
    rim.position.set(-6, 3, -6)
    this.scene.add(rim)

    const under = new THREE.DirectionalLight(0xff3355, 0.3)
    under.position.set(2, -6, 3)
    this.scene.add(under)
  }

  /** Kulakçıklar (atria) ve kulakçık uzantıları (auriküller). */
  private buildAtria() {
    const add = (geo: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0, rz = 0) => {
      const m = new THREE.Mesh(geo, this.atriaMat)
      m.position.set(x, y, z)
      m.rotation.set(0, ry, rz)
      this.atriaGroup.add(m)
    }
    add(lumpySphere(0.5, 0.4, 0.46, 0.09), -0.6, 0.62, -0.08, 0.3, 0.15) // sağ atriyum
    add(lumpySphere(0.46, 0.36, 0.4, 0.1), 0.38, 0.72, -0.4, -0.3, -0.1) // sol atriyum
    add(lumpySphere(0.28, 0.15, 0.2, 0.14), -0.5, 0.6, 0.4, 0.5, 0.35) // sağ aurikül
    add(lumpySphere(0.22, 0.12, 0.16, 0.14), 0.52, 0.48, 0.28, -0.4, -0.3) // sol aurikül
  }

  /** Kesik uçlu tüp: damar + kesit halkası + koyu lümen diski. */
  private cappedTube(
    parent: THREE.Group,
    pts: THREE.Vector3[],
    r: number,
    mat: THREE.Material,
    cap = true,
  ): THREE.CatmullRomCurve3 {
    const curve = new THREE.CatmullRomCurve3(pts)
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, r, 16, false), mat)
    parent.add(tube)
    if (cap) {
      const end = curve.getPoint(1)
      const tan = curve.getTangent(1).normalize()
      const look = end.clone().add(tan)
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.82, r * 0.2, 10, 24), mat)
      ring.position.copy(end)
      ring.lookAt(look)
      parent.add(ring)
      const disc = new THREE.Mesh(new THREE.CircleGeometry(r * 0.8, 24), this.lumenMat)
      disc.position.copy(end).addScaledVector(tan, -0.01)
      disc.lookAt(look)
      parent.add(disc)
    }
    return curve
  }

  /** Aort, pulmoner gövde, ana toplardamarlar ve pulmoner venler. */
  private buildGreatVessels() {
    const gv = this.vesselGroup
    const V = (pts: Pt[]) => pts.map((p) => new THREE.Vector3(...p))

    // Aort: yükselir, kavis yapar, inen kısımda kesilir.
    this.cappedTube(
      gv,
      V([
        [0.05, 0.5, -0.08],
        [0.06, 1.1, -0.12],
        [0.0, 1.5, -0.2],
        [0.38, 1.62, -0.3],
        [0.6, 1.3, -0.42],
      ]),
      0.155,
      this.arteryMat,
    )
    // Kavis üzerindeki üç dal.
    this.cappedTube(gv, V([[0.03, 1.42, -0.19], [0.0, 1.82, -0.21]]), 0.05, this.arteryMat)
    this.cappedTube(gv, V([[0.18, 1.5, -0.25], [0.2, 1.86, -0.28]]), 0.045, this.arteryMat)
    this.cappedTube(gv, V([[0.32, 1.45, -0.3], [0.38, 1.78, -0.34]]), 0.04, this.arteryMat)

    // Pulmoner gövde: sağ karıncıktan çıkar, aortun önünden çaprazlar.
    this.cappedTube(
      gv,
      V([
        [-0.18, 0.4, 0.45],
        [-0.08, 0.8, 0.45],
        [0.1, 1.05, 0.28],
      ]),
      0.14,
      this.arteryMat,
      false,
    )
    const junction = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 16), this.arteryMat)
    junction.position.set(0.1, 1.05, 0.28)
    gv.add(junction)
    this.cappedTube(gv, V([[0.1, 1.05, 0.28], [0.3, 1.12, 0.1], [0.5, 1.1, -0.05]]), 0.09, this.arteryMat)
    this.cappedTube(gv, V([[0.1, 1.05, 0.28], [-0.12, 1.12, 0.05], [-0.38, 1.08, -0.08]]), 0.09, this.arteryMat)

    // Üst ana toplardamar (SVC) — sağ atriyuma iner.
    this.cappedTube(
      gv,
      V([
        [-0.5, 0.7, -0.05],
        [-0.44, 1.05, -0.12],
        [-0.42, 1.5, -0.18],
      ]),
      0.12,
      this.veinMat,
    )
    // Alt ana toplardamar (IVC) — altta kısa bir güdük.
    this.cappedTube(
      gv,
      V([
        [-0.55, 0.3, -0.35],
        [-0.7, -0.05, -0.55],
        [-0.75, -0.35, -0.7],
      ]),
      0.11,
      this.veinMat,
    )
    // Pulmoner venler — sol atriyumun arkasından iki güdük.
    this.cappedTube(gv, V([[0.5, 0.75, -0.55], [0.75, 0.78, -0.72]]), 0.065, this.veinMat)
    this.cappedTube(gv, V([[0.3, 0.65, -0.6], [0.4, 0.6, -0.85]]), 0.065, this.veinMat)
  }

  /**
   * Kontrol noktalarını karıncık yüzeyine ışın izleyerek oturtur.
   * Uç noktalar hafif gömülür (damar dokuya dalarak kaybolur),
   * ara noktalar yüzeyin biraz üstünde durur.
   */
  private snapCurve(pts: THREE.Vector3[], tubeR: number): THREE.Vector3[] {
    const ray = new THREE.Raycaster()
    const snapMat = new THREE.MeshBasicMaterial()
    const tmp = new THREE.Mesh(this.ventGeo, snapMat)
    tmp.updateMatrixWorld()
    const out = pts.map((p, i) => {
      const dir = p.clone().normalize()
      ray.set(dir.clone().multiplyScalar(4), dir.clone().negate())
      const hit = ray.intersectObject(tmp, false)[0]
      if (!hit) return p.clone()
      const lift = i === 0 || i === pts.length - 1 ? -tubeR * 0.9 : tubeR * 0.35
      return hit.point.clone().addScaledVector(dir, lift)
    })
    snapMat.dispose()
    return out
  }

  /** Koroner tüpleri verilen kalınlıkla yeniden üretir. */
  private rebuildCoronaries(thickness: number) {
    for (const child of [...this.coronaryGroup.children]) {
      this.coronaryGroup.remove(child)
      if (child instanceof THREE.Mesh) child.geometry.dispose()
    }
    for (const spec of this.coronarySpecs) {
      const curve = new THREE.CatmullRomCurve3(spec.pts)
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 48, spec.r * thickness, 10, false),
        this.arteryMat,
      )
      this.coronaryGroup.add(tube)
    }
  }

  /** Hesaplanmış kalp parametrelerini sahneye uygular. */
  setParams(p: HeartParams) {
    this.bpm = p.bpm
    this.irregularity = p.rhythmIrregularity
    this.targetScale = p.sizeScale * 1.22
    this.amplitude = 0.04 + 0.07 * p.contractionStrength
    this.glow = 0.2 + 0.45 * p.contractionStrength

    const body = p.bodyColor
    this.muscleMat.color.copy(hslColor(body))
    this.muscleMat.emissive.copy(hslColor({ ...body, l: body.l * 0.35 }))
    this.atriaMat.color.copy(
      hslColor({
        h: body.h,
        s: Math.max(0, body.s - 10),
        l: Math.min(100, body.l + 6),
      }),
    )
    this.atriaMat.emissive.copy(this.muscleMat.emissive)
    this.arteryMat.color.copy(hslColor(p.vesselColor))
    this.veinMat.color.copy(
      hslColor({ h: 250, s: 28, l: THREE.MathUtils.clamp(p.vesselColor.l * 0.9, 18, 60) }),
    )

    this.rebuildCoronaries(p.vesselThickness)
    this.scheduleNextCycle()
  }

  private scheduleNextCycle() {
    const base = 60 / this.bpm
    // Aritmi: döngü uzunluğuna rastgele sapma ekle.
    const jitter = 1 + (Math.random() - 0.5) * 2 * this.irregularity
    this.cycleLength = Math.max(0.25, base * jitter)
  }

  private frame = () => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.frame)

    const dt = Math.min(this.clock.getDelta(), 0.05)
    this.tSinceBeat += dt
    if (this.tSinceBeat >= this.cycleLength) {
      this.tSinceBeat -= this.cycleLength
      this.scheduleNextCycle()
      this.onBeat?.()
    }

    this.currentScale += (this.targetScale - this.currentScale) * Math.min(1, dt * 6)
    this.group.scale.setScalar(this.currentScale)

    // Karıncık kasılması + hafif sistolik burulma.
    const pulse = thump(this.tSinceBeat)
    this.ventGroup.scale.setScalar(1 + this.amplitude * pulse)
    this.ventGroup.rotation.y = 0.045 * pulse

    // Atriyal ön-kasılma: bir sonraki vuruştan ~0.16 sn önce.
    const ta = this.tSinceBeat - (this.cycleLength - 0.16)
    const atrialPulse = ta > 0 ? Math.exp(-Math.pow((ta - 0.05) / 0.045, 2)) : 0
    this.atriaGroup.scale.setScalar(1 + 0.04 * atrialPulse + 0.5 * this.amplitude * pulse)

    const glowNow = this.baseEmissive + this.glow * pulse
    this.muscleMat.emissiveIntensity = glowNow
    this.atriaMat.emissiveIntensity = glowNow * 0.8

    if (!this.reducedMotion) {
      this.group.position.y = Math.sin(this.clock.elapsedTime * 1.2) * 0.03
    }

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  start() {
    if (this.running) return
    this.running = true
    this.clock.start()
    this.raf = requestAnimationFrame(this.frame)
  }

  stop() {
    this.running = false
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  resize(width: number, height: number) {
    if (width === 0 || height === 0) return
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
  }

  dispose() {
    this.stop()
    this.controls.dispose()
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) obj.geometry.dispose()
    })
    this.muscleMat.dispose()
    this.atriaMat.dispose()
    this.arteryMat.dispose()
    this.veinMat.dispose()
    this.lumenMat.dispose()
    this.textures.map.dispose()
    this.textures.bump.dispose()
    this.textures.rough.dispose()
    this.scene.environment?.dispose()
    this.renderer.dispose()
  }
}
