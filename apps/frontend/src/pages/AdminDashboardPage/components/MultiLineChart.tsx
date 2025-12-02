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

interface LineData {
  date: string
  value: number
}

interface MultiLineChartProps {
  data: LineData[]
  lines: Array<{
    key: string
    name: string
    color: string
    data: LineData[]
  }>
  height?: number
  yAxisLabel?: string
}

export const MultiLineChart: React.FC<MultiLineChartProps> = ({
  data,
  lines,
  height = 300,
  yAxisLabel,
}) => {
  // Merge all line data by date
  const mergedData = React.useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>()

    // Collect all unique dates from all lines
    lines.forEach((line) => {
      line.data.forEach((item) => {
        if (!dateMap.has(item.date)) {
          dateMap.set(item.date, {})
        }
        const entry = dateMap.get(item.date)!
        entry[line.key] = item.value || 0
      })
    })

    // Also add dates from main data if provided
    data.forEach((item) => {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, {})
      }
    })

    // Convert to array and fill missing values with 0
    return Array.from(dateMap.entries())
      .map(([date, values]) => {
        const result: Record<string, string | number> = { date }
        lines.forEach((line) => {
          result[line.key] = values[line.key] || 0
        })
        return result
      })
      .sort((a, b) => (a.date as string).localeCompare(b.date as string))
  }, [data, lines])

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem)
    if (isNaN(date.getTime())) {
      // If not a valid date, try parsing as YYYY-MM-DD
      if (tickItem.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = tickItem.split('-')
        return `${day}/${month}`
      }
      return tickItem
    }
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
        data={mergedData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          tickFormatter={formatXAxis}
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
          labelFormatter={(label) =>
            new Date(label).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          }
          formatter={(value: number, name: string) => {
            const line = lines.find((l) => l.key === name)
            return [value.toLocaleString(), line?.name || name]
          }}
        />
        <Legend
          formatter={(value) => {
            const line = lines.find((l) => l.key === value)
            return line?.name || value
          }}
        />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={{ r: 4, fill: line.color }}
            activeDot={{ r: 6, strokeWidth: 2, fill: line.color, stroke: '#fff' }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

