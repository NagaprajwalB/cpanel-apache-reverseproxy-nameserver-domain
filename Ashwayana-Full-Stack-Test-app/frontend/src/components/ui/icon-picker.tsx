'use client';

import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState('');
  
  // Cast to structure to get all icons dynamically
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const SelectedIcon = value && icons[value] ? icons[value] : LucideIcons.HelpCircle;

  const filteredIcons = Object.keys(icons).filter(
    (key) => key !== 'createLucideIcon' && key.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 50); // Limit to 50 for performance

  return (
    <Popover>
      <PopoverTrigger className="inline-flex items-center justify-start rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition w-[200px] text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50">
        <SelectedIcon className="mr-2 h-4 w-4" />
        {value || 'Select an icon...'}
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-2" align="start">
        <Input
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <ScrollArea className="h-64">
          <div className="grid grid-cols-5 gap-2">
            {filteredIcons.map((key) => {
              const Icon = icons[key];
              if (!Icon) return null;
              return (
                <Button
                  key={key}
                  variant="ghost"
                  className="h-10 w-10 p-0"
                  onClick={() => onChange(key)}
                  title={key}
                >
                  <Icon className="h-5 w-5" />
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
