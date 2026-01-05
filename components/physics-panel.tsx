"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen } from "lucide-react"
import type { WaveParams, WECType } from "./wec-simulation"

interface PhysicsPanelProps {
  waveParams: WaveParams
  simulationTime: number
  selectedWEC: WECType
}

export function PhysicsPanel({ waveParams, simulationTime, selectedWEC }: PhysicsPanelProps) {
  // Calculate physics values
  const omega = (2 * Math.PI) / waveParams.period // Angular frequency
  const k = (2 * Math.PI) / waveParams.wavelength // Wave number
  const c = waveParams.wavelength / waveParams.period // Wave speed (phase velocity)
  const rho = 1025 // Seawater density kg/m³
  const g = 9.81 // Gravity m/s²

  // Wave power density formula: P = (ρ * g² * H² * T) / (32π) in W/m
  const powerDensity = (rho * g * g * waveParams.height * waveParams.height * waveParams.period) / (32 * Math.PI)

  // Current wave state
  const currentDisplacement = (waveParams.height / 2) * Math.sin(omega * simulationTime)
  const currentVelocity = (waveParams.height / 2) * omega * Math.cos(omega * simulationTime)

  return (
    <Card className="bg-secondary/50 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Physics Equations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {/* Wave Equation */}
        <div className="bg-background/50 rounded-lg p-3">
          <div className="text-muted-foreground mb-1">Surface Displacement</div>
          <div className="font-mono text-foreground">{"η(x,t) = (H/2)·cos(kx - ωt)"}</div>
          <div className="text-primary mt-1">η = {currentDisplacement.toFixed(3)} m</div>
        </div>

        {/* Angular Frequency */}
        <div className="bg-background/50 rounded-lg p-3">
          <div className="text-muted-foreground mb-1">Angular Frequency</div>
          <div className="font-mono text-foreground">{"ω = 2π/T"}</div>
          <div className="text-primary mt-1">ω = {omega.toFixed(3)} rad/s</div>
        </div>

        {/* Wave Number */}
        <div className="bg-background/50 rounded-lg p-3">
          <div className="text-muted-foreground mb-1">Wave Number</div>
          <div className="font-mono text-foreground">{"k = 2π/λ"}</div>
          <div className="text-primary mt-1">k = {k.toFixed(4)} rad/m</div>
        </div>

        {/* Phase Velocity */}
        <div className="bg-background/50 rounded-lg p-3">
          <div className="text-muted-foreground mb-1">Phase Velocity</div>
          <div className="font-mono text-foreground">{"c = λ/T"}</div>
          <div className="text-primary mt-1">c = {c.toFixed(2)} m/s</div>
        </div>

        {/* Particle Velocity */}
        <div className="bg-background/50 rounded-lg p-3">
          <div className="text-muted-foreground mb-1">Particle Velocity</div>
          <div className="font-mono text-foreground">{"v = dη/dt = (H/2)·ω·sin(ωt)"}</div>
          <div className="text-primary mt-1">v = {currentVelocity.toFixed(3)} m/s</div>
        </div>

        {/* Wave Power */}
        <div className="bg-background/50 rounded-lg p-3">
          <div className="text-muted-foreground mb-1">Wave Power Density</div>
          <div className="font-mono text-foreground text-[10px]">{"P = (ρg²H²T)/(32π)"}</div>
          <div className="text-primary mt-1">P = {(powerDensity / 1000).toFixed(2)} kW/m</div>
        </div>

        {/* Energy Formula */}
        <div className="bg-background/50 rounded-lg p-3">
          <div className="text-muted-foreground mb-1">Wave Energy Density</div>
          <div className="font-mono text-foreground">{"E = (1/8)·ρ·g·H²"}</div>
          <div className="text-primary mt-1">
            E = {((rho * g * waveParams.height * waveParams.height) / 8 / 1000).toFixed(2)} kJ/m²
          </div>
        </div>

        {/* Deep Water Relation */}
        <div className="bg-background/50 rounded-lg p-3 border border-accent/30">
          <div className="text-accent mb-1 font-semibold">Deep Water Dispersion</div>
          <div className="font-mono text-foreground">{"ω² = g·k"}</div>
          <div className="font-mono text-foreground mt-1">{"λ = (g·T²)/(2π)"}</div>
        </div>
      </CardContent>
    </Card>
  )
}
