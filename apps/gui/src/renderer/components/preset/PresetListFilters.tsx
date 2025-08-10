import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';

export interface PresetCategoryOption {
  id: string;
  label: string;
  count: number;
}

export interface PresetListFiltersProps {
  categories: PresetCategoryOption[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const PresetListFilters: React.FC<PresetListFiltersProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex gap-1">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectCategory(category.id)}
            className="gap-1"
          >
            {category.label}
            <Badge variant="secondary" className="ml-1 text-xs">
              {category.count}
            </Badge>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default PresetListFilters;
