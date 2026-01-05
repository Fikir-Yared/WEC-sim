"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts"
import { Play, Pause, RotateCcw, Waves, Zap, Activity, Info } from "lucide-react"
import { PhysicsPanel } from "./physics-panel"

const Scene3D = dynamic(() => import("./scene-3d"), { ssr: false })

export type WECType = "point-absorber" | "owc" | "attenuator" | "overtopping"

export interface WaveParams {
  height: number
  period: number
  wavelength: number
}

export interface SimulationData {
  time: number
  displacement: number
  velocity: number
  power: number
  energy: number
}

const WEC_INFO = {
  "point-absorber": {
    name: "Point Absorber",
    description:
      "A floating buoy that moves up and down with waves, converting vertical motion to electricity via a linear generator or hydraulic system.",
    efficiency: "25-40%",
    color: "#0ea5e9",
  },
  owc: {
    name: "Oscillating Water Column",
    description:
      "A partially submerged chamber that traps air above water. Waves cause the water level to rise and fall, pushing air through a turbine.",
    efficiency: "30-50%",
    color: "#06b6d4",
  },
  attenuator: {
    name: "Attenuator (Pelamis)",
    description:
      "A long, multi-segment floating structure oriented parallel to wave direction. Segments flex at joints, driving hydraulic pumps.",
    efficiency: "20-35%",
    color: "#22d3ee",
  },
  overtopping: {
    name: "Overtopping Device",
    description:
      "A structure that captures waves in an elevated reservoir. Water flows back to sea through turbines, similar to a low-head hydroelectric dam.",
    efficiency: "15-30%",
    color: "#38bdf8",
  },
}

export default function WECSimulation() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [selectedWEC, setSelectedWEC] = useState<WECType>("point-absorber")
  const [waveParams, setWaveParams] = useState<WaveParams>({
    height: 2.0,
    period: 8,
    wavelength: 100,
  })
  const [simulationTime, setSimulationTime] = useState(0)
  const [motionData, setMotionData] = useState<SimulationData[]>([])
  const [energyData, setEnergyData] = useState<SimulationData[]>([])
  const [totalEnergy, setTotalEnergy] = useState(0)
  const [currentPower, setCurrentPower] = useState(0)
  const animationRef = useRef<number>()
  const lastTimeRef = useRef(0)

  // Physics calculations
  const calculateWaveMotion = useCallback(
    (time: number) => {
      const omega = (2 * Math.PI) / waveParams.period

      // Wave displacement: η = H/2 * cos(ωt)
      const displacement = (waveParams.height / 2) * Math.cos(omega * time)

      // Wave velocity: v = dη/dt = H/2 * ω * sin(ωt)
      const velocity = (waveParams.height / 2) * omega * Math.sin(omega * time)

      // Wave power density: P = (ρ * g² * H² * T) / (32π) in W/m
      const rho = 1025 // seawater density kg/m³
      const g = 9.81 // gravity m/s²
      const powerDensity = (rho * g * g * waveParams.height * waveParams.height * waveParams.period) / (32 * Math.PI)

      // Device efficiency based on type
      const efficiencyMap = {
        "point-absorber": 0.32,
        owc: 0.4,
        attenuator: 0.28,
        overtopping: 0.22,
      }

      const efficiency = efficiencyMap[selectedWEC]
      const capturedPower = (powerDensity * efficiency * Math.abs(Math.sin(omega * time))) / 100

      return {
        displacement,
        velocity,
        power: capturedPower,
      }
    },
    [waveParams, selectedWEC],
  )

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const delta = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp

      setSimulationTime((prev) => {
        const newTime = prev + delta
        const motion = calculateWaveMotion(newTime)

        setMotionData((prevData) => {
          const newData = [
            ...prevData,
            {
              time: newTime,
              displacement: motion.displacement,
              velocity: motion.velocity,
              power: motion.power,
              energy: 0,
            },
          ].slice(-100)
          return newData
        })

        setCurrentPower(motion.power)
        setTotalEnergy((prev) => prev + motion.power * delta)

        setEnergyData((prevData) => {
          const newEnergy = (prevData[prevData.length - 1]?.energy || 0) + motion.power * delta
          return [
            ...prevData,
            {
              time: newTime,
              displacement: motion.displacement,
              velocity: motion.velocity,
              power: motion.power,
              energy: newEnergy,
            },
          ].slice(-100)
        })

        return newTime
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, calculateWaveMotion])

  const handleReset = () => {
    setSimulationTime(0)
    setMotionData([])
    setEnergyData([])
    setTotalEnergy(0)
    setCurrentPower(0)
    lastTimeRef.current = 0
  }

  const wecInfo = WEC_INFO[selectedWEC]

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Waves className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Wave Energy Converter Simulation</h1>
              <p className="text-sm text-muted-foreground">Interactive Physics Modeling</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-primary border-primary">
              <Activity className="h-3 w-3 mr-1" />
              {isPlaying ? "Running" : "Paused"}
            </Badge>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Controls */}
        <aside className="w-80 border-r border-border bg-card p-4 overflow-y-auto">
          {/* WEC Device Selection */}
          <Card className="mb-4 bg-secondary/50 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                WEC Device Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Object.keys(WEC_INFO) as WECType[]).map((type) => (
                <Button
                  key={type}
                  variant={selectedWEC === type ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => setSelectedWEC(type)}
                >
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: WEC_INFO[type].color }} />
                  <span className="text-xs">{WEC_INFO[type].name}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Device Info */}
          <Card className="mb-4 bg-secondary/50 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                {wecInfo.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">{wecInfo.description}</p>
              <Badge variant="secondary">Efficiency: {wecInfo.efficiency}</Badge>
            </CardContent>
          </Card>

          {/* Wave Parameters */}
          <Card className="mb-4 bg-secondary/50 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Waves className="h-4 w-4 text-primary" />
                Wave Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Wave Height (H)</span>
                  <span className="text-foreground font-mono">{waveParams.height.toFixed(1)} m</span>
                </div>
                <Slider
                  value={[waveParams.height]}
                  min={0.5}
                  max={6}
                  step={0.1}
                  onValueChange={([v]) => setWaveParams((p) => ({ ...p, height: v }))}
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Wave Period (T)</span>
                  <span className="text-foreground font-mono">{waveParams.period.toFixed(1)} s</span>
                </div>
                <Slider
                  value={[waveParams.period]}
                  min={4}
                  max={16}
                  step={0.5}
                  onValueChange={([v]) => setWaveParams((p) => ({ ...p, period: v }))}
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Wavelength (λ)</span>
                  <span className="text-foreground font-mono">{waveParams.wavelength.toFixed(0)} m</span>
                </div>
                <Slider
                  value={[waveParams.wavelength]}
                  min={50}
                  max={200}
                  step={5}
                  onValueChange={([v]) => setWaveParams((p) => ({ ...p, wavelength: v }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Physics Panel */}
          <PhysicsPanel waveParams={waveParams} simulationTime={simulationTime} selectedWEC={selectedWEC} />
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* 3D Scene */}
          <div className="flex-1 relative bg-[#0a1929]">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full text-muted-foreground">Loading 3D Scene...</div>
              }
            >
              <Scene3D
                waveParams={waveParams}
                simulationTime={simulationTime}
                selectedWEC={selectedWEC}
                isPlaying={isPlaying}
              />
            </Suspense>

            {/* Stats Overlay */}
            <div className="absolute top-4 right-4 space-y-2">
              <Card className="bg-card/90 backdrop-blur border-border">
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Current Power</div>
                  <div className="text-2xl font-bold text-primary font-mono">
                    {currentPower.toFixed(2)} <span className="text-sm">kW</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/90 backdrop-blur border-border">
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Total Energy</div>
                  <div className="text-2xl font-bold text-accent font-mono">
                    {totalEnergy.toFixed(2)} <span className="text-sm">kWh</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/90 backdrop-blur border-border">
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground">Simulation Time</div>
                  <div className="text-lg font-mono text-foreground">{simulationTime.toFixed(1)}s</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Charts */}
          <div className="h-64 border-t border-border bg-card p-4">
            <Tabs defaultValue="motion" className="h-full">
              <TabsList className="mb-2">
                <TabsTrigger value="motion">Wave Motion</TabsTrigger>
                <TabsTrigger value="power">Power Output</TabsTrigger>
                <TabsTrigger value="energy">Energy Generation</TabsTrigger>
              </TabsList>
              <TabsContent value="motion" className="h-[calc(100%-40px)]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={motionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="time" tickFormatter={(v) => `${v.toFixed(0)}s`} stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#121820",
                        border: "1px solid #1e3a5f",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="displacement"
                      stroke="#0ea5e9"
                      name="Displacement (m)"
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="velocity"
                      stroke="#06b6d4"
                      name="Velocity (m/s)"
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="power" className="h-[calc(100%-40px)]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={motionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="time" tickFormatter={(v) => `${v.toFixed(0)}s`} stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#121820",
                        border: "1px solid #1e3a5f",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="power"
                      stroke="#0ea5e9"
                      fill="#0ea5e9"
                      fillOpacity={0.3}
                      name="Power (kW)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="energy" className="h-[calc(100%-40px)]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={energyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="time" tickFormatter={(v) => `${v.toFixed(0)}s`} stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#121820",
                        border: "1px solid #1e3a5f",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="energy"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.3}
                      name="Cumulative Energy (kWh)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
