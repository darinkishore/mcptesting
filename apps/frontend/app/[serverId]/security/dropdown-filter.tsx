'use client'

import React from 'react'

interface DropdownFilterProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: {
    value: string
    label: string
  }[]
}

export const DropdownFilter: React.FC<DropdownFilterProps> = ({
  label,
  value,
  onChange,
  options,
}) => {
  return (
    <div>
      <label className="block text-sm uppercase font-medium mb-1">
        {label}
      </label>
      <select
        className="bg-white border-2 border-black text-sm block w-full p-1 cursor-pointer hover:bg-gray-50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}