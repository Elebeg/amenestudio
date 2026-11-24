'use client'

import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { ApartmentModel } from '@/three/apartment/ApartmentModel'
import { APARTMENT, footprint } from '@/three/apartment/layout'
import { dawnAt, lerp, mixHex } from '@/lib/dawn'

export type DawnCanvasProps = {
  /** relógio da abertura em segundos (escrito pelo Intro a cada quadro) */
  clock: RefObject<number>
  /** instante (s) em que o amanhecer começa e duração da rampa completa */
  start: number
  duration: number
  quality: 'high' | 'low'
  onReady: () => void
  onFail: () => void
}

/**
 * Amanhecer dentro do apartamento (variante A do protótipo), com a maquete real.
 * Câmera no living, olhando a parede de pedra (oeste) com a TV; a porta de vidro da varanda
 * (fachada norte, com voile) fica à direita e é por ela que o sol entra, rasante.
 *
 * Coordenadas do protótipo → planta: o fundo do protótipo (−z) é o oeste (−x) e a janela (+x)
 * é o norte (−z). Ver `toPlan`.
 */

const H = APARTMENT.height
const LIVING = APARTMENT.rooms.find((r) => r.id === 'living')!.rect
// centro de referência: parede de pedra em x = LIVING.x0 e fachada norte em z = LIVING.z0
const XC = LIVING.x0 + 2.5
const ZC = LIVING.z0 + 3.0
/** ponto do protótipo (x, y, z) → ponto da planta */
const toPlan = (x: number, y: number, z: number): [number, number, number] => [XC + z, y, ZC - x]

// câmera: entrada lenta por trás do sofá, subindo de leve (prototipo: lerp de posição e alvo)
// olhar oblíquo para o canto pedra × fachada: a luz rasante aparece na textura da pedra
const CAM_FROM = new THREE.Vector3(0.45, 1.22, LIVING.z0 + 4.75)
const CAM_TO = new THREE.Vector3(0.05, 1.36, LIVING.z0 + 4.25)
const LOOK_FROM = new THREE.Vector3(LIVING.x0 + 0.1, 1.12, LIVING.z0 + 1.35)
const LOOK_TO = new THREE.Vector3(LIVING.x0 + 0.1, 1.24, LIVING.z0 + 1.05)
/**
 * Calibração para a maquete real (planta aberta, materiais claros): o protótipo era uma sala
 * fechada; aqui o céu e o ambiente iluminariam demais e achatariam a luz rasante do sol.
 */
const SUN_GAIN = 1.3
/**
 * No começo o preenchimento fica baixo (luz rasante e contraste); com o dia claro ele sobe até os
 * valores da maquete, para a pedra chegar ao bege-acinzentado claro da foto (IMG_4759).
 */
const HEMI_GAIN = [0.42, 1.1] as const
const ENV_GAIN = [0.4, 1.0] as const
const EXPOSURE_END = 1.1
const GROUND = { night: 0x8a7560, day: 0xb9a58f }
const SUN_TARGET = new THREE.Vector3(...toPlan(-0.5, 1, -1.8))

const DUST_N = { high: 420, low: 220 }
const DUST_BOX = { x0: LIVING.x0 + 0.2, x1: LIVING.x0 + 3.2, y0: 0.2, y1: 2.4, z0: LIVING.z0 + 0.3, z1: LIVING.z0 + 3.4 }

function setupRenderer({ gl, scene }: { gl: THREE.WebGLRenderer; scene: THREE.Scene }) {
  const pmrem = new THREE.PMREMGenerator(gl)
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()
  scene.environment = env
  scene.environmentIntensity = 0.03
  scene.background = new THREE.Color(0x000000)
  gl.toneMapping = THREE.ACESFilmicToneMapping
  gl.toneMappingExposure = 0.5
  return env
}

const hsl = { h: 0, s: 0, l: 0 }
/** Estética de render de arquitetura: nada saturado (o laranja do nascer fica mais terroso). */
function soften(c: THREE.Color, k = 0.72): THREE.Color {
  c.getHSL(hsl)
  return c.setHSL(hsl.h, hsl.s * k, hsl.l)
}

type Own = {
  skyMat: THREE.MeshBasicMaterial
  curtainMat: THREE.MeshStandardMaterial
  dustMat: THREE.PointsMaterial
  dustGeo: THREE.BufferGeometry
  base: Float32Array
  n: number
}

/** Céu, voile e poeira no instante `t` (objetos só desta cena). */
function applyOwn(own: Own, d: ReturnType<typeof dawnAt>, t: number, tmp: THREE.Color) {
  const sky = soften(tmp.setHex(d.sky))
  own.skyMat.color.copy(sky).multiplyScalar(d.skyGain)
  own.curtainMat.emissive.copy(sky)
  own.curtainMat.emissiveIntensity = d.curtainGlow
  own.dustMat.opacity = d.dust * 0.8
  // poeira subindo devagar no facho, com deriva lateral
  const a = own.dustGeo.attributes.position as THREE.BufferAttribute
  const span = DUST_BOX.y1 - DUST_BOX.y0
  for (let i = 0; i < own.n; i++) {
    const y0 = own.base[i * 3 + 1]
    a.setY(i, DUST_BOX.y0 + ((((y0 - DUST_BOX.y0 + t * 0.03) % span) + span) % span))
    a.setX(i, own.base[i * 3] + Math.sin(t * 0.4 + i) * 0.04)
    a.setZ(i, own.base[i * 3 + 2] + Math.cos(t * 0.31 + i * 1.7) * 0.03)
  }
  a.needsUpdate = true
}

/** Rampa de luz, céu, exposição, poeira e câmera a partir do relógio da abertura. */
function DawnRig({ clock, start, duration, quality, onReady }: Omit<DawnCanvasProps, 'onFail'>) {
  const get = useThree((st) => st.get)
  const size = useThree((st) => st.size)
  const sun = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const dustRef = useRef<THREE.Points>(null)
  const look = useRef(new THREE.Vector3())
  const tmp = useRef(new THREE.Color())
  const fit = Math.max(...[LIVING.x1 - LIVING.x0, LIVING.z1 - LIVING.z0]) / 2 + 2

  // céu atrás das janelas, voile fechado na porta da varanda, forro e poeira: objetos só desta cena
  const own = useMemo(() => {
    const f = footprint(APARTMENT)
    const v = APARTMENT.varanda.rect
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: true, fog: false })
    const sky = new THREE.PlaneGeometry(80, 40)
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xf2efea, roughness: 1 })
    const ceiling = new THREE.BoxGeometry(f.x1 - f.x0 + 0.6, 0.12, f.z1 - v.z0 + 0.6)
    const ceilingPos: [number, number, number] = [(f.x0 + f.x1) / 2, H + 0.07, (v.z0 + f.z1) / 2]
    // voile fechado: pano franzido cobrindo a porta de vidro (o sol atravessa, a luz difunde)
    const win = { w: 4.2, h: 2.42 }
    const curtainGeo = new THREE.PlaneGeometry(win.w, win.h, 200, 1)
    const cp = curtainGeo.attributes.position
    for (let i = 0; i < cp.count; i++) {
      const x = cp.getX(i)
      cp.setZ(i, Math.sin(x * 22) * 0.03 + Math.sin(x * 7.3) * 0.015)
    }
    curtainGeo.computeVertexNormals()
    const curtainMat = new THREE.MeshStandardMaterial({
      color: 0xf4efe7,
      roughness: 1,
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide,
      depthWrite: false,
      emissive: 0xfff1de,
      emissiveIntensity: 0.1,
    })
    const curtainPos: [number, number, number] = [(LIVING.x0 + LIVING.x1) / 2, win.h / 2 + 0.01, LIVING.z0 + 0.2]
    // poeira: posições base fixas; o movimento é função do tempo (determinístico)
    const n = DUST_N[quality]
    const base = new Float32Array(n * 3)
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    for (let i = 0; i < n; i++) {
      base[i * 3] = lerp(DUST_BOX.x0, DUST_BOX.x1, rnd())
      base[i * 3 + 1] = lerp(DUST_BOX.y0, DUST_BOX.y1, rnd())
      base[i * 3 + 2] = lerp(DUST_BOX.z0, DUST_BOX.z1, rnd())
    }
    const dustGeo = new THREE.BufferGeometry()
    dustGeo.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3))
    // partícula redonda e macia (não um quadrado)
    const c = document.createElement('canvas')
    c.width = c.height = 32
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.35, 'rgba(255,255,255,0.55)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 32, 32)
    const dustTex = new THREE.CanvasTexture(c)
    const dustMat = new THREE.PointsMaterial({
      color: 0xfff0d8,
      map: dustTex,
      size: 0.018,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { dustTex, skyMat, sky, ceilingMat, ceiling, ceilingPos, curtainGeo, curtainMat, curtainPos, dustGeo, dustMat, base, n }
  }, [quality])

  useEffect(
    () => () => {
      own.skyMat.dispose()
      own.sky.dispose()
      own.ceilingMat.dispose()
      own.ceiling.dispose()
      own.curtainGeo.dispose()
      own.curtainMat.dispose()
      own.dustGeo.dispose()
      own.dustMat.dispose()
      own.dustTex.dispose()
    },
    [own],
  )

  // retrato (celular): abre o campo de visão para a pedra e a TV caberem
  useEffect(() => {
    const cam = get().camera as THREE.PerspectiveCamera
    const aspect = size.width / Math.max(1, size.height)
    cam.fov = aspect < 1 ? 62 : aspect < 1.3 ? 50 : 40
    cam.updateProjectionMatrix()
  }, [get, size])

  useEffect(() => {
    if (sun.current) {
      sun.current.target.position.copy(SUN_TARGET)
      sun.current.target.updateMatrixWorld()
    }
  }, [])

  // pronto = quadros desenhados e texturas carregadas (com tempo-limite)
  const frames = useRef(0)
  const ready = useRef(false)
  const t0 = useRef(0)
  useFrame(() => {
    frames.current++
    if (ready.current) return
    if (!t0.current) t0.current = performance.now()
    const loaded = !useProgress.getState().active
    if (frames.current > 3 && (loaded || performance.now() - t0.current > 5000)) {
      ready.current = true
      onReady()
    }
  })

  useFrame(({ gl, scene, camera }) => {
    const t = clock.current ?? 0
    const p = Math.min(1, Math.max(0, (t - start) / duration))
    const d = dawnAt(p)
    const s = sun.current
    if (s) {
      const e = d.sunElevation
      const az = d.sunAzimuth
      // protótipo: (cos e·cos az, sin e, cos e·sin az) → planta (x, y, z) = (proto z, y, −proto x)
      s.position.set(Math.cos(e) * Math.sin(az), Math.sin(e), -Math.cos(e) * Math.cos(az)).multiplyScalar(18).add(SUN_TARGET)
      s.intensity = d.sunIntensity * SUN_GAIN
      soften(s.color.setHex(d.sunColor))
    }
    if (hemi.current) {
      hemi.current.intensity = d.hemiIntensity * lerp(HEMI_GAIN[0], HEMI_GAIN[1], d.ramp)
      hemi.current.groundColor.setHex(mixHex(GROUND.night, GROUND.day, d.ramp))
      hemi.current.color.setHex(d.hemiSky)
    }
    gl.toneMappingExposure = lerp(0.5, EXPOSURE_END, d.ramp)
    scene.environmentIntensity = d.env * lerp(ENV_GAIN[0], ENV_GAIN[1], d.ramp)
    applyOwn(own, d, t, tmp.current)

    camera.position.lerpVectors(CAM_FROM, CAM_TO, d.dolly)
    camera.lookAt(look.current.lerpVectors(LOOK_FROM, LOOK_TO, d.dolly))
  })

  const shadowSize = quality === 'high' ? 2048 : 1024
  return (
    <>
      <hemisphereLight ref={hemi} args={[0x24345e, 0x8a7560, 0.02]} />
      <directionalLight
        ref={sun}
        intensity={0}
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={3}
        shadow-camera-left={-fit}
        shadow-camera-right={fit}
        shadow-camera-top={fit}
        shadow-camera-bottom={-fit}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />
      {/* céu: plano grande ao norte, além da varanda */}
      <mesh geometry={own.sky} material={own.skyMat} position={[XC - 2, 2, LIVING.z0 - 14]} />
      <mesh geometry={own.ceiling} material={own.ceilingMat} position={own.ceilingPos} castShadow receiveShadow />
      <mesh geometry={own.curtainGeo} material={own.curtainMat} position={own.curtainPos} />
      <points ref={dustRef} geometry={own.dustGeo} material={own.dustMat} frustumCulled={false} />
    </>
  )
}

export default function DawnCanvas(p: DawnCanvasProps) {
  const env = useRef<THREE.Texture | null>(null)
  useEffect(() => () => env.current?.dispose(), [])
  return (
    <Canvas
      shadows="percentage"
      dpr={p.quality === 'high' ? [1, 1.5] : [1, 1]}
      camera={{ position: CAM_FROM.toArray(), fov: 40, near: 0.05, far: 120 }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      onCreated={(st) => {
        env.current = setupRenderer(st)
        st.gl.domElement.addEventListener(
          'webglcontextlost',
          (e) => {
            e.preventDefault()
            p.onFail()
          },
          { once: true },
        )
      }}
      style={{ position: 'absolute', inset: 0 }}
      aria-hidden
    >
      <DawnRig clock={p.clock} start={p.start} duration={p.duration} quality={p.quality} onReady={p.onReady} />
      <ApartmentModel source={{ kind: 'procedural' }} lighting="manha" />
    </Canvas>
  )
}
