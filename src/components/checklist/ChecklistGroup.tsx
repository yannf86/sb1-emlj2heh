import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import ChecklistItem from './ChecklistItem';
import { getServiceInfo } from '@/lib/db/checklist';
import { AlertTriangle } from 'lucide-react';

interface ChecklistGroupProps {
  items: any[];
  onToggleComplete: (itemId: string, completed: boolean) => void;
  searchQuery?: string;
}

const ChecklistGroup: React.FC<ChecklistGroupProps> = ({
  items,
  onToggleComplete,
  searchQuery = ''
}) => {
  const [serviceInfo, setServiceInfo] = useState<{ name: string; icon: string }>({ name: '', icon: '' });
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const loadServiceInfo = async () => {
      if (items.length === 0 || !items[0].serviceId) return;
      
      try {
        const info = await getServiceInfo(items[0].serviceId);
        setServiceInfo(info);
      } catch (error) {
        console.error('Error loading service info:', error);
        setServiceInfo({ name: 'Service inconnu', icon: '📋' });
      }
    };
    
    loadServiceInfo();
  }, [items]);

  // Calculate completion percentage
  const completedItems = items.filter(item => item.completed);
  const completionPercentage = items.length > 0 
    ? Math.round((completedItems.length / items.length) * 100) 
    : 0;

  // Filter items by search query
  const filteredItems = searchQuery 
    ? items.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : items;

  if (filteredItems.length === 0) return null;

  return (
    <Card>
      <CardHeader 
        className="flex flex-row items-center justify-between py-3 cursor-pointer bg-slate-50 dark:bg-slate-800"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <div className="text-2xl mr-2">{serviceInfo.icon}</div>
          <span className="font-medium">{serviceInfo.name}</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-white dark:bg-slate-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
            {items.length}
          </div>
          <div className="flex items-center">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
              <div 
                className={`h-full ${
                  completionPercentage === 100 ? "bg-green-500" : 
                  completionPercentage >= 75 ? "bg-lime-500" :
                  completionPercentage >= 50 ? "bg-amber-500" :
                  "bg-red-500"
                }`} 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium">{completionPercentage}%</span>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-4">
          <div className="space-y-1">
            {completionPercentage < 100 && (
              <div className="bg-amber-50 border border-amber-200 p-2 rounded-md flex items-center mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                <span className="text-xs text-amber-800">Toute tâche non complétée doit être expliquée.</span>
              </div>
            )}
            
            {filteredItems.map(item => (
              <ChecklistItem
                key={item.id}
                item={item}
                onToggleComplete={onToggleComplete}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ChecklistGroup;