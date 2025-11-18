import React from 'react'
type TabType = 'strategy' | 'timeline' | 'gallery' | 'notes'
interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}
export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    {
      id: 'strategy' as TabType,
      label: 'Chiến lược',
    },
    {
      id: 'timeline' as TabType,
      label: 'Timeline',
    },
    {
      id: 'gallery' as TabType,
      label: 'Gallery',
    },
    {
      id: 'notes' as TabType,
      label: 'Notes',
    },
  ]
  return (
    <div className="bg-white border-b border-gray-200 h-12 px-8">
      <div className="flex gap-8 h-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`h-full px-4 text-sm font-medium transition-colors relative ${activeTab === tab.id ? 'text-green-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
