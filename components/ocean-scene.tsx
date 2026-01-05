"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { Text } from "@react-three/drei"
import type { WECType, WaveParams } from "./wec-simulation"

interface OceanSceneProps {
  waveParams: WaveParams
  simulationTime: number
  selectedWEC: WECType
  isPlaying: boolean
}

// Ocean component with animated waves
function Ocean({ waveParams, simulationTime }: { waveParams: WaveParams; simulationTime: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const geometryRef = useRef<THREE.PlaneGeometry>(null)

  const segments = 128
  const size = 100

  useFrame(() => {
    if (!geometryRef.current) return

    const positions = geometryRef.current.attributes.position
    const omega = (2 * Math.PI) / waveParams.period
    const k = (2 * Math.PI) / waveParams.wavelength

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      // Gerstner wave approximation
      const z =
        (waveParams.height / 2) *
        Math.sin(k * x - omega * simulationTime) *
        Math.cos(k * y * 0.3 - omega * simulationTime * 0.5)
      positions.setZ(i, z)
    }
    positions.needsUpdate = true
    geometryRef.current.computeVertexNormals()
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry ref={geometryRef} args={[size, size, segments, segments]} />
      <meshStandardMaterial
        color="#0c4a6e"
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
        metalness={0.3}
        roughness={0.6}
      />
    </mesh>
  )
}

// Point Absorber WEC
function PointAbsorber({ waveParams, simulationTime }: { waveParams: WaveParams; simulationTime: number }) {
  const buoyRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!buoyRef.current) return
    const omega = (2 * Math.PI) / waveParams.period
    const displacement = (waveParams.height / 2) * Math.sin(omega * simulationTime)
    buoyRef.current.position.y = displacement + 1
    buoyRef.current.rotation.x = Math.sin(omega * simulationTime * 0.5) * 0.1
    buoyRef.current.rotation.z = Math.cos(omega * simulationTime * 0.3) * 0.05
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Mooring line */}
      <mesh position={[0, -5, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 10, 8]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      {/* Anchor */}
      <mesh position={[0, -10, 0]}>
        <boxGeometry args={[2, 0.5, 2]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* Buoy */}
      <group ref={buoyRef}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[2, 32, 32]} />
          <meshStandardMaterial color="#0ea5e9" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 2, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Light on top */}
        <mesh position={[0, 4, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
        </mesh>
      </group>
      <Text position={[0, 6, 0]} fontSize={0.8} color="#e6e9ed" anchorX="center" anchorY="middle">
        Point Absorber
      </Text>
    </group>
  )
}

// Oscillating Water Column Device
function OWCDevice({ waveParams, simulationTime }: { waveParams: WaveParams; simulationTime: number }) {
  const waterRef = useRef<THREE.Mesh>(null)
  const turbineRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!waterRef.current || !turbineRef.current) return
    const omega = (2 * Math.PI) / waveParams.period
    const waterLevel = (waveParams.height / 2) * Math.sin(omega * simulationTime)
    waterRef.current.position.y = waterLevel - 2
    waterRef.current.scale.y = 1 + waterLevel * 0.1
    turbineRef.current.rotation.y += Math.cos(omega * simulationTime) * 0.3
  })

  const bladeAngles = useMemo(() => [0, 60, 120, 180, 240, 300], [])

  return (
    <group position={[0, 0, 0]}>
      {/* Main chamber structure */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[6, 8, 6]} />
        <meshStandardMaterial color="#374151" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Chamber walls */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[6.2, 8.2, 6.2]} />
        <meshStandardMaterial color="#1f2937" wireframe />
      </mesh>
      {/* Water inside chamber */}
      <mesh ref={waterRef} position={[0, -2, 0]}>
        <boxGeometry args={[5.5, 4, 5.5]} />
        <meshStandardMaterial color="#0284c7" transparent opacity={0.7} />
      </mesh>
      {/* Air chamber top */}
      <mesh position={[0, 5, 0]}>
        <cylinderGeometry args={[1.5, 2, 2, 32]} />
        <meshStandardMaterial color="#6b7280" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Turbine */}
      <group ref={turbineRef} position={[0, 6.5, 0]}>
        <mesh>
          <cylinderGeometry args={[0.8, 0.8, 0.3, 6]} />
          <meshStandardMaterial color="#06b6d4" metalness={0.8} roughness={0.2} />
        </mesh>
        {bladeAngles.map((angle, i) => (
          <mesh key={i} position={[0, 0, 0]} rotation={[0, (angle * Math.PI) / 180, Math.PI / 2]}>
            <boxGeometry args={[0.1, 1.5, 0.5]} />
            <meshStandardMaterial color="#22d3ee" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
      </group>
      <Text position={[0, 9, 0]} fontSize={0.8} color="#e6e9ed" anchorX="center" anchorY="middle">
        Oscillating Water Column
      </Text>
    </group>
  )
}

// Attenuator Device (Pelamis-style)
function AttenuatorDevice({ waveParams, simulationTime }: { waveParams: WaveParams; simulationTime: number }) {
  const segment0Ref = useRef<THREE.Mesh>(null)
  const segment1Ref = useRef<THREE.Mesh>(null)
  const segment2Ref = useRef<THREE.Mesh>(null)
  const segment3Ref = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const omega = (2 * Math.PI) / waveParams.period
    const k = (2 * Math.PI) / waveParams.wavelength
    const refs = [segment0Ref, segment1Ref, segment2Ref, segment3Ref]

    refs.forEach((ref, i) => {
      if (!ref.current) return
      const xPos = -6 + i * 4
      const phase = k * xPos
      const displacement = (waveParams.height / 2) * Math.sin(omega * simulationTime - phase * 0.5)
      ref.current.position.y = displacement
      ref.current.rotation.z = Math.cos(omega * simulationTime - phase * 0.5) * 0.15
    })
  })

  return (
    <group position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
      {/* Segment 0 */}
      <mesh ref={segment0Ref} position={[-6, 0, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 3.5, 16]} />
        <meshStandardMaterial color="#22d3ee" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[-4, 0, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Segment 1 */}
      <mesh ref={segment1Ref} position={[-2, 0, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 3.5, 16]} />
        <meshStandardMaterial color="#0891b2" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Segment 2 */}
      <mesh ref={segment2Ref} position={[2, 0, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 3.5, 16]} />
        <meshStandardMaterial color="#22d3ee" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[4, 0, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Segment 3 */}
      <mesh ref={segment3Ref} position={[6, 0, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 3.5, 16]} />
        <meshStandardMaterial color="#0891b2" metalness={0.5} roughness={0.4} />
      </mesh>

      <Text position={[0, 4, 0]} fontSize={0.8} color="#e6e9ed" anchorX="center" anchorY="middle">
        Attenuator (Pelamis)
      </Text>
    </group>
  )
}

// Overtopping Device
function OvertoppingDevice({ waveParams, simulationTime }: { waveParams: WaveParams; simulationTime: number }) {
  const waterFlowRef = useRef<THREE.Mesh>(null)
  const turbineRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (!waterFlowRef.current || !turbineRef.current) return
    const omega = (2 * Math.PI) / waveParams.period
    const flowIntensity = Math.max(0, Math.sin(omega * simulationTime))
    waterFlowRef.current.scale.y = 0.5 + flowIntensity * 0.5
    const material = waterFlowRef.current.material as THREE.MeshStandardMaterial
    material.opacity = 0.3 + flowIntensity * 0.4
    turbineRef.current.rotation.x += flowIntensity * 0.2
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Main ramp structure */}
      <mesh position={[0, 1, 2]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[10, 0.5, 8]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      {/* Side walls */}
      <mesh position={[-5.25, 2, 0]}>
        <boxGeometry args={[0.5, 4, 12]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      <mesh position={[5.25, 2, 0]}>
        <boxGeometry args={[0.5, 4, 12]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      {/* Reservoir */}
      <mesh position={[0, 3, -3]}>
        <boxGeometry args={[10, 2, 4]} />
        <meshStandardMaterial color="#1e3a5f" transparent opacity={0.5} />
      </mesh>
      {/* Water in reservoir */}
      <mesh position={[0, 2.8, -3]}>
        <boxGeometry args={[9.5, 1.5, 3.5]} />
        <meshStandardMaterial color="#0284c7" transparent opacity={0.7} />
      </mesh>
      {/* Water flow (overflow) */}
      <mesh ref={waterFlowRef} position={[0, 1.5, 5]}>
        <boxGeometry args={[8, 1, 2]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.6} />
      </mesh>
      {/* Turbine house */}
      <mesh position={[0, 1, -6]}>
        <boxGeometry args={[4, 3, 2]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
      {/* Turbine */}
      <mesh ref={turbineRef} position={[0, 1, -5]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.8, 0.2, 8, 8]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.8} roughness={0.2} />
      </mesh>
      <Text position={[0, 6, 0]} fontSize={0.8} color="#e6e9ed" anchorX="center" anchorY="middle">
        Overtopping Device
      </Text>
    </group>
  )
}

export function OceanScene({ waveParams, simulationTime, selectedWEC, isPlaying }: OceanSceneProps) {
  return (
    <>
      <Ocean waveParams={waveParams} simulationTime={simulationTime} />

      {/* Render only the selected WEC device, centered at origin */}
      {selectedWEC === "point-absorber" && (
        <group position={[0, 0, 0]}>
          <PointAbsorber waveParams={waveParams} simulationTime={simulationTime} />
        </group>
      )}
      {selectedWEC === "owc" && (
        <group position={[0, 0, 0]}>
          <OWCDevice waveParams={waveParams} simulationTime={simulationTime} />
        </group>
      )}
      {selectedWEC === "attenuator" && (
        <group position={[0, 0, 0]}>
          <AttenuatorDevice waveParams={waveParams} simulationTime={simulationTime} />
        </group>
      )}
      {selectedWEC === "overtopping" && (
        <group position={[0, 0, 0]}>
          <OvertoppingDevice waveParams={waveParams} simulationTime={simulationTime} />
        </group>
      )}

      {/* Grid helper */}
      <gridHelper args={[100, 20, "#1e3a5f", "#0f172a"]} position={[0, -12, 0]} />
    </>
  )
}
