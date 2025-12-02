import React from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

interface LineChartProps {
  data: ChartDataPoint[]
  dataKey?: string
  color?: string
  height?: number
  showLegend?: boolean
  yAxisLabel?: string
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  dataKey = 'value',
  color = '#10b981',
  height = 300,
  showLegend = false,
  yAxisLabel,
}) => {
  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      // Handle different date formats
      if (dateStr.includes('T')) {
        const date = new Date(dateStr)
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
      }
      // If it's already in format like "2024-01-15" or "01/15"
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateStr.split('-')
        return `${day}/${month}`
      }
      // If it's in format "YYYY-MM-DD" or similar
      return dateStr.length > 10 ? dateStr.substring(5, 10).replace('-', '/') : dateStr
    } catch {
      return dateStr
    }
  }

  const chartData = data.map((item) => ({
    ...item,
    dateLabel: item.label || formatDate(item.date),
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="dateLabel"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
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
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

