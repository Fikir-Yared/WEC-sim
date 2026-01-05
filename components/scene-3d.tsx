"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Sky } from "@react-three/drei"
import { OceanScene } from "./ocean-scene"
import type { WECType, WaveParams } from "./wec-simulation"

interface Scene3DProps {
  waveParams: WaveParams
  simulationTime: number
  selectedWEC: WECType
  isPlaying: boolean
}

export default function Scene3D({ waveParams, simulationTime, selectedWEC, isPlaying }: Scene3DProps) {
  return (
    <Canvas camera={{ position: [30, 15, 30], fov: 50 }} style={{ width: "100%", height: "100%" }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <Sky distance={450000} sunPosition={[100, 20, 100]} inclination={0.6} azimuth={0.25} />
      <OceanScene
        waveParams={waveParams}
        simulationTime={simulationTime}
        selectedWEC={selectedWEC}
        isPlaying={isPlaying}
      />
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={10} maxDistance={100} />
    </Canvas>
  )
}
