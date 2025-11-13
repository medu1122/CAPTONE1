import React from 'react'
import { SearchIcon } from 'lucide-react'
import type { PostFilters as PostFiltersType } from '../types/community.types'
interface PostFiltersProps {
  filters: PostFiltersType
  onFilterChange: (filters: Partial<PostFiltersType>) => void
}
export const PostFilters: React.FC<PostFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const categories = [
    {
      value: '',
      label: 'Tất cả',
    },
    {
      value: 'question',
      label: 'Câu hỏi',
    },
    {
      value: 'discussion',
      label: 'Thảo luận',
    },
    {
      value: 'tip',
      label: 'Mẹo hay',
    },
    {
      value: 'problem',
      label: 'Vấn đề',
    },
    {
      value: 'success',
      label: 'Thành công',
    },
  ]
  const sortOptions = [
    {
      value: 'latest',
      label: 'Mới nhất',
    },
    {
      value: 'popular',
      label: 'Phổ biến',
    },
    {
      value: 'mostCommented',
      label: 'Nhiều bình luận',
    },
  ]
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      {/* Search */}
      <div className="relative mb-4">
        <SearchIcon
          size={20}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Tìm kiếm bài viết..."
          value={filters.search || ''}
          onChange={(e) =>
            onFilterChange({
              search: e.target.value,
            })
          }
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      {/* Category Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Danh mục
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() =>
                onFilterChange({
                  category: category.value as PostFiltersType['category'],
                })
              }
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${(filters.category || '') === category.value ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
      {/* Sort Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sắp xếp theo
        </label>
        <select
          value={filters.sortBy || 'latest'}
          onChange={(e) =>
            onFilterChange({
              sortBy: e.target.value as PostFiltersType['sortBy'],
            })
          }
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
