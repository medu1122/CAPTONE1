import React from 'react';
import { vietnamProvinces } from '../../../data/vietnamProvinces';
import { ChevronDown } from 'lucide-react';

interface Props {
  selectedProvince: string | null;
  onProvinceSelect: (code: string) => void;
}

export const ProvinceSelect: React.FC<Props> = ({ selectedProvince, onProvinceSelect }) => {
  const selectedProvinceData = selectedProvince
    ? vietnamProvinces.find(p => p.code === selectedProvince)
    : null;

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Chọn tỉnh/thành phố
      </label>
      <div className="relative">
        <select
          value={selectedProvince || ''}
          onChange={(e) => {
            const code = e.target.value;
            if (code) {
              onProvinceSelect(code);
            }
          }}
          className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer hover:border-gray-400 transition-colors"
        >
          <option value="">-- Chọn tỉnh/thành phố --</option>
          {vietnamProvinces.map((province) => (
            <option key={province.code} value={province.code}>
              {province.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      {selectedProvinceData && (
        <p className="mt-2 text-sm text-gray-500">
          Đã chọn: <span className="font-medium text-green-600">{selectedProvinceData.name}</span>
        </p>
      )}
    </div>
  );
};

