import React from 'react';
import type { Preset } from '@agentos/core';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export interface PresetBasicFieldsProps {
  name: string;
  description: string;
  category: string[];
  status?: 'active' | 'idle' | 'inactive';
  onChange: (updates: Partial<Preset>) => void;
  showStatus?: boolean;
}

export const PresetBasicFields: React.FC<PresetBasicFieldsProps> = ({
  name,
  description,
  category,
  status,
  onChange,
  showStatus = false,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Preset Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="mt-1"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={category[0]} onValueChange={(value) => onChange({ category: [value] })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="research">Research</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showStatus && (
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value: 'active' | 'idle' | 'inactive') => onChange({ status: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresetBasicFields;
