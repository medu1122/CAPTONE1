// FilterBar component
// Add your code here

import React from 'react'
import { SearchIcon } from 'lucide-react'
import type { PlantBoxFilters } from '../types/plantBox.types'
interface FilterBarProps {
  filters: PlantBoxFilters
  onFilterChange: (filters: Partial<PlantBoxFilters>) => void
}
export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
}) => {
  const types = [
    {
      value: 'all',
      label: 'Tất cả',
    },
    {
      value: 'active',
      label: 'Đang trồng',
    },
    {
      value: 'planned',
      label: 'Dự định',
    },
  ]
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <SearchIcon
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, cây, vị trí..."
            value={filters.search || ''}
            onChange={(e) =>
              onFilterChange({
                search: e.target.value,
              })
            }
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Type Filter Tabs */}
        <div className="flex gap-2">
          {types.map((type) => (
            <button
              key={type.value}
              onClick={() =>
                onFilterChange({
                  type: type.value as PlantBoxFilters['type'],
                })
              }
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filters.type === type.value ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={filters.sortBy || 'newest'}
          onChange={(e) =>
            onFilterChange({
              sortBy: e.target.value as PlantBoxFilters['sortBy'],
            })
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="nameAsc">Tên A-Z</option>
          <option value="nameDesc">Tên Z-A</option>
        </select>
      </div>
    </div>
  )
}
