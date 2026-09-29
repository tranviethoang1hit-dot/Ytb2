import { Flame, Music2, Moon, Guitar, Zap, Globe, Sparkles, Mic, BookOpen } from 'lucide-react';
import { Category } from '../types';

interface CategoryChipsProps {
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (category: Category) => void;
}

const ICON_MAP: Record<string, any> = {
  Flame,
  Music2,
  Moon,
  Guitar,
  Zap,
  Globe,
  Sparkles,
  Mic,
  BookOpen,
};

export function CategoryChips({ categories, activeCategoryId, onSelectCategory }: CategoryChipsProps) {
  return (
    <div id="category-chips-bar" className="w-full overflow-x-auto py-2.5 px-4 scrollbar-none flex items-center gap-2 border-b border-zinc-900 bg-zinc-950/40">
      {categories.map((cat) => {
        const Icon = ICON_MAP[cat.iconName] || Music2;
        const isActive = activeCategoryId === cat.id;

        return (
          <button
            key={cat.id}
            id={`category-chip-${cat.id}`}
            onClick={() => onSelectCategory(cat)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all select-none shrink-0 ${
              isActive
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-1 ring-red-400/40'
                : 'bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
