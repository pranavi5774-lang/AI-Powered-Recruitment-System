'use client'

// ============================================================
// Hero3D — @react-three/fiber hero scene (no drei).
// Floating wireframe icosahedron + slow torus knot + ~150
// violet/cyan particles, gentle float via useFrame, soft fog.
// Loaded lazily + wrapped in an ErrorBoundary by HeroCanvas.
// ============================================================

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Group, Points as ThreePoints } from 'three'

const VIOLET = '#8b5cf6'
const CYAN = '#67e8f9'

function Icosahedron() {
  const ref = useRef<Group>(null)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!ref.current) return
    ref.current.rotation.y = t * 0.18
    ref.current.rotation.x = Math.sin(t * 0.24) * 0.18
    ref.current.position.y = Math.sin(t * 0.7) * 0.22
  })
  return (
    <group ref={ref}>
      <mesh>
        <icosahedronGeometry args={[1.7, 1]} />
        <meshBasicMaterial wireframe color={VIOLET} transparent opacity={0.75} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.15, 0]} />
        <meshBasicMaterial wireframe color={CYAN} transparent opacity={0.28} />
      </mesh>
    </group>
  )
}

function TorusKnot() {
  const ref = useRef<Group>(null)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!ref.current) return
    ref.current.rotation.x = t * 0.1
    ref.current.rotation.y = t * 0.14
    ref.current.position.y = -1.15 + Math.sin(t * 0.5) * 0.1
  })
  return (
    <group ref={ref} position={[0, -1.15, 0]}>
      <mesh scale={0.85}>
        <torusKnotGeometry args={[0.75, 0.24, 140, 18]} />
        <meshBasicMaterial wireframe color={CYAN} transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

function Particles({ count = 150 }: { count?: number }) {
  const ref = useRef<ThreePoints>(null)
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const violet = new Float32Array([0.545, 0.361, 0.965])
    const cyan = new Float32Array([0.404, 0.906, 0.976])
    for (let i = 0; i < count; i++) {
      // scatter within a flattened sphere shell around the scene
      const r = 2.4 + Math.random() * 3.2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = (r * Math.sin(phi) * Math.sin(theta)) * 0.55 // flatten vertically
      positions[i * 3 + 2] = r * Math.cos(phi) * 0.7
      const c = Math.random() > 0.5 ? violet : cyan
      colors[i * 3] = c[0]
      colors[i * 3 + 1] = c[1]
      colors[i * 3 + 2] = c[2]
    }
    return { positions, colors }
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.03
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.08
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.045} vertexColors transparent opacity={0.85} sizeAttenuation />
    </points>
  )
}

function Scene() {
  const group = useRef<Group>(null)
  useFrame((state) => {
    if (!group.current) return
    // gentle parallax toward pointer
    const { x, y } = state.pointer
    group.current.rotation.y += (x * 0.08 - group.current.rotation.y) * 0.04
    group.current.rotation.x += (-y * 0.05 - group.current.rotation.x) * 0.04
  })
  return (
    <group ref={group}>
      <Icosahedron />
      <TorusKnot />
      <Particles />
    </group>
  )
}

export default function Hero3D() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5.2], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
      aria-hidden="true"
    >
      <fog attach="fog" args={['#0e1226', 6.5, 12.5]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[4, 4, 4]} intensity={30} color={VIOLET} />
      <pointLight position={[-4, -2, 2]} intensity={18} color={CYAN} />
      <Scene />
    </Canvas>
  )
}
