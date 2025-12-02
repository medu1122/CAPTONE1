import React from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ChartDataPoint {
  name: string
  value: number
  [key: string]: any
}

interface BarChartProps {
  data: ChartDataPoint[]
  dataKey?: string
  color?: string
  height?: number
  showLegend?: boolean
  yAxisLabel?: string
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  dataKey = 'value',
  color = '#10b981',
  height = 300,
  showLegend = false,
  yAxisLabel,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="name"
          stroke="#6b7280"
          style={{ fontSize: '11px' }}
          angle={-45}
          textAnchor="end"
          height={100}
          interval={0}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px',
          }}
          labelStyle={{ color: '#374151', fontWeight: 'bold' }}
        />
        {showLegend && <Legend />}
        <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

