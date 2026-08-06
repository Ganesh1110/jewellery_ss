'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Filter, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SortOption {
  value: string;
  label: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { value: 'BEST_SELLING', label: 'Best Selling' },
  { value: 'CREATED_DESC', label: 'Newest Arrivals' },
  { value: 'PRICE_ASC', label: 'Price: Low to High' },
  { value: 'PRICE_DESC', label: 'Price: High to Low' },
  { value: 'TITLE_ASC', label: 'Name: A to Z' },
  { value: 'TITLE_DESC', label: 'Name: Z to A' },
];

export function SortDropdown({ currentSort }: { currentSort?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeSort = currentSort || searchParams.get('sort') || 'BEST_SELLING';
  const activeLabel = SORT_OPTIONS.find((opt) => opt.value === activeSort)?.label || 'Best Selling';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (sortValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sortValue);
    params.delete('page'); // Reset to page 1 on sort change
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="btn-secondary flex items-center gap-2 px-4 py-2 text-body-sm font-medium text-neutral-800 hover:text-neutral-950 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Sort products, currently sorted by ${activeLabel}`}
      >
        <Filter className="h-4 w-4" aria-hidden="true" />
        <span>Sort: <strong className="font-medium text-neutral-950">{activeLabel}</strong></span>
        <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-sm bg-cream-50 border border-neutral-950/10 z-30 py-1.5 animate-fade-in"
          role="listbox"
          aria-label="Sort options"
        >
          {SORT_OPTIONS.map((option) => {
            const isSelected = option.value === activeSort;
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={isSelected}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-2 text-left text-body-sm transition-colors',
                  isSelected
                    ? 'bg-neutral-950/[0.05] font-medium text-neutral-950'
                    : 'text-neutral-700 hover:bg-neutral-950/[0.03] hover:text-neutral-950'
                )}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="h-4 w-4" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
