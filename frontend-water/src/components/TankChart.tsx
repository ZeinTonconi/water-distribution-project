import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import type { SimulationWeek } from '../types'

interface Props {
  optimized: SimulationWeek[]
  naive: SimulationWeek[]
  tankCapacity: number
}

export default function TankChart({ optimized, naive, tankCapacity }: Props) {
  const data = optimized.map((w, i) => ({
    semana: `S${w.week}`,
    optimizado: Math.round(w.tank_level_l),
    naive: Math.round(naive[i]?.tank_level_l ?? 0),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="semana"
          tick={{ fontSize: 11 }}
          interval={Math.floor(data.length / 6)}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={v => `${Math.round(v / 1000 * 10) / 10}k`}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            `${value.toLocaleString('es-BO')} L`,
            name === 'optimizado' ? 'Con plan' : 'Sin plan'
          ]}
        />
        <Legend
          formatter={v => v === 'optimizado' ? 'Con plan' : 'Sin plan'}
        />
        <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="optimizado"
          stroke="#1a56db"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="naive"
          stroke="#9ca3af"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}