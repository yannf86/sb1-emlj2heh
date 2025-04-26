import React from 'react';

interface CheckboxGroupProps {
  items: Array<{ id: string; name: string }>;
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ 
  items, 
  selectedItems, 
  onSelectionChange 
}) => {
  const toggleItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={item.id}
            checked={selectedItems.includes(item.id)}
            onChange={() => toggleItem(item.id)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor={item.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {item.name}
          </label>
        </div>
      ))}
    </div>
  );
};

export const CheckboxItem: React.FC<{
  id: string;
  name: string;
  checked: boolean;
  onChange: () => void;
}> = ({ id, name, checked, onChange }) => (
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    />
    <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {name}
    </label>
  </div>
);