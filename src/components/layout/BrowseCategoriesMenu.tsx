import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, LayoutGrid, Sparkles, ArrowRight, X } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/Image';

export interface MegaSubSection {
  title: string;
  items: { label: string; href: string; isHot?: boolean }[];
}

export interface MegaCategory {
  id: string;
  name: string;
  href: string;
  badge?: string;
  subsections: MegaSubSection[];
  featuredCard?: {
    title: string;
    subtitle: string;
    image: string;
    link: string;
  };
}

export const MEGA_CATEGORIES: MegaCategory[] = [
  {
    id: 'necklaces',
    name: 'Necklaces',
    href: '/collections/necklaces',
    badge: 'Popular',
    subsections: [
      {
        title: 'BY STYLE',
        items: [
          { label: 'Chokers & Collars', href: '/search?q=choker', isHot: true },
          { label: 'Solitaire Pendants', href: '/search?q=pendant' },
          { label: 'Layered Gold Chains', href: '/search?q=chain' },
          { label: 'Heritage Necklaces', href: '/search?q=heritage' },
          { label: 'Lariat Necklaces', href: '/search?q=necklace' },
        ],
      },
      {
        title: 'TOP PICKS',
        items: [
          { label: 'Sapphire Halo Pendant', href: '/products/sapphire-halo-pendant' },
          { label: 'The Solitaire Pendant', href: '/products/the-solitaire-pendant' },
          { label: 'Rose Quartz Pendant', href: '/products/rose-quartz-pendant' },
          { label: 'Heritage Chain Necklace', href: '/products/heritage-chain-necklace' },
        ],
      },
      {
        title: 'BY MATERIAL',
        items: [
          { label: '18k Yellow Gold', href: '/search?q=18k' },
          { label: 'Rose Gold Finish', href: '/search?q=rose+gold' },
          { label: 'Platinum & Diamond', href: '/search?q=diamond' },
          { label: 'Akoya Pearl Strand', href: '/search?q=pearl' },
        ],
      },
    ],
    featuredCard: {
      title: 'Handcrafted Necklaces',
      subtitle: 'Sculpted in 18k Gold & Diamond Solitaires',
      image: '/images/Image1.jpeg',
      link: '/collections/new-arrivals',
    },
  },
  {
    id: 'rings',
    name: 'Rings',
    href: '/collections/rings',
    subsections: [
      {
        title: 'BY STYLE',
        items: [
          { label: 'Solitaire Engagement Rings', href: '/search?q=solitaire', isHot: true },
          { label: 'Diamond Love Bands', href: '/search?q=love+band' },
          { label: 'Halo Statement Rings', href: '/search?q=halo' },
          { label: 'Moonstone Cocktail Rings', href: '/search?q=cocktail' },
          { label: 'Mumbai Signet Rings', href: '/search?q=signet' },
        ],
      },
      {
        title: 'BEST LOVED',
        items: [
          { label: 'Halo Engagement Ring', href: '/products/halo-engagement-ring' },
          { label: 'Mumbai Signet Ring', href: '/products/mumbai-signet-ring' },
          { label: 'Moonstone Cocktail Ring', href: '/products/moonstone-cocktail-ring' },
          { label: 'Diamond Love Band', href: '/products/diamond-love-band' },
        ],
      },
      {
        title: 'BY PRICE',
        items: [
          { label: 'Under ₹25,000', href: '/search?q=ring' },
          { label: '₹25,000 – ₹50,000', href: '/search?q=ring' },
          { label: 'Luxury Above ₹50,000', href: '/search?q=ring' },
        ],
      },
    ],
    featuredCard: {
      title: 'Solitaire & Love Bands',
      subtitle: 'Tailored ring sizes from 6 to 9',
      image: '/images/Image2.jpeg',
      link: '/collections/bestsellers',
    },
  },
  {
    id: 'earrings',
    name: 'Earrings',
    href: '/collections/earrings',
    subsections: [
      {
        title: 'BY STYLE',
        items: [
          { label: 'Emerald Drop Earrings', href: '/products/emerald-drop-earrings', isHot: true },
          { label: 'Ruby Stud Earrings', href: '/products/ruby-stud-earrings' },
          { label: 'Daily Diamond Studs', href: '/search?q=stud' },
          { label: 'Traditional Jhumkas', href: '/search?q=jhumka' },
          { label: 'Hoops & Huggies', href: '/search?q=hoop' },
        ],
      },
      {
        title: 'GEMSTONE ACCENTS',
        items: [
          { label: 'Zambian Emeralds', href: '/search?q=emerald' },
          { label: 'Ruby & Rose Gold', href: '/search?q=ruby' },
          { label: 'Akoya Pearl Drops', href: '/search?q=pearl' },
        ],
      },
    ],
    featuredCard: {
      title: 'Gemstone Drops & Studs',
      subtitle: 'Vibrant handcrafted statement earrings',
      image: '/images/Image5.jpeg',
      link: '/collections/earrings',
    },
  },
  {
    id: 'bracelets',
    name: 'Bracelets & Bangles',
    href: '/collections/bracelets',
    subsections: [
      {
        title: 'BY STYLE',
        items: [
          { label: 'Gold Tennis Bracelet', href: '/products/gold-tennis-bracelet', isHot: true },
          { label: 'Stackable Gold Bangles', href: '/products/stackable-gold-bangles' },
          { label: 'Solid Gold Kadas', href: '/search?q=bangles' },
          { label: 'Chain & Charm Bracelets', href: '/search?q=bracelet' },
        ],
      },
    ],
    featuredCard: {
      title: 'Gold Bangles & Bracelets',
      subtitle: 'Flexible sizing and secure clasps',
      image: '/images/Image6.jpeg',
      link: '/collections/bracelets',
    },
  },
  {
    id: 'pendants',
    name: 'Pendants',
    href: '/collections/pendants',
    subsections: [
      {
        title: 'BY DESIGN',
        items: [
          { label: 'Solitaire Diamond Pendants', href: '/products/the-solitaire-pendant' },
          { label: 'Rose Quartz Pendants', href: '/products/rose-quartz-pendant' },
          { label: 'Sapphire Halo Pendants', href: '/products/sapphire-halo-pendant' },
        ],
      },
    ],
    featuredCard: {
      title: 'Pendant Creations',
      subtitle: 'Signature Shakthi Atelier pendants',
      image: '/images/Image9.jpeg',
      link: '/collections/new-arrivals',
    },
  },
];

export function useDynamicCategories(): MegaCategory[] {
  const [categories, setCategories] = useState<MegaCategory[]>(MEGA_CATEGORIES);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});
  }, []);

  return categories;
}

interface BrowseCategoriesMenuProps {
  onClose?: () => void;
}

export function BrowseCategoriesDesktopMenu({ onClose }: BrowseCategoriesMenuProps) {
  const categories = useDynamicCategories();
  const [activeTabId, setActiveTabId] = useState<string>(categories[0]?.id || 'necklaces');
  const activeCategory = categories.find((c) => c.id === activeTabId) || categories[0] || MEGA_CATEGORIES[0];

  return (
    <div className="w-full bg-cream-50 border-b border-neutral-950/10 shadow-2xl animate-fade-in text-neutral-900">
      <div className="max-w-container-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6 min-h-[340px]">
          {/* Left Sidebar: Category Selector */}
          <div className="col-span-3 border-r border-neutral-950/10 pr-4 space-y-1">
            <p className="text-caption uppercase tracking-[0.2em] font-semibold text-neutral-400 mb-3 px-3">
              Categories
            </p>
            {categories.map((cat) => {
              const isActive = cat.id === activeTabId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onMouseEnter={() => setActiveTabId(cat.id)}
                  onClick={() => setActiveTabId(cat.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-body-sm font-medium text-left transition-all ${
                    isActive
                      ? 'bg-neutral-950 text-cream-50 shadow-subtle'
                      : 'text-neutral-700 hover:bg-neutral-950/5 hover:text-neutral-950'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {cat.name}
                    {cat.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                        isActive ? 'bg-gold-500 text-white' : 'bg-gold-100 text-gold-800'
                      }`}>
                        {cat.badge}
                      </span>
                    )}
                  </span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${isActive ? 'text-cream-50 translate-x-0.5' : 'text-neutral-400'}`} />
                </button>
              );
            })}
          </div>

          {/* Center: Dynamic Subsections */}
          <div className="col-span-6 px-4 grid grid-cols-3 gap-6 align-start">
            {activeCategory.subsections.map((sub, idx) => (
              <div key={idx} className="space-y-3">
                <p className="text-caption uppercase tracking-[0.16em] font-semibold text-gold-700 border-b border-neutral-950/10 pb-1.5">
                  {sub.title}
                </p>
                <ul className="space-y-2 text-body-sm">
                  {sub.items.map((item, itemIdx) => (
                    <li key={itemIdx}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className="text-neutral-700 hover:text-neutral-950 hover:underline flex items-center gap-1.5 transition-colors"
                      >
                        <span>{item.label}</span>
                        {item.isHot && (
                          <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1 rounded">HOT</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Right: Featured Luxury Banner */}
          <div className="col-span-3 border-l border-neutral-950/10 pl-6 flex flex-col justify-between">
            {activeCategory.featuredCard ? (
              <div className="card overflow-hidden bg-white p-4 border border-neutral-950/10 flex flex-col h-full justify-between group">
                <div className="relative aspect-4-3 rounded overflow-hidden bg-neutral-100 mb-3">
                  <OptimizedImage
                    src={activeCategory.featuredCard.image}
                    alt={activeCategory.featuredCard.title}
                    fill
                    objectFit="cover"
                  />
                </div>
                <div className="space-y-1">
                  <span className="overline text-gold-600">Featured Highlight</span>
                  <h4 className="font-heading text-heading-xs text-neutral-950 group-hover:text-gold-700 transition-colors">
                    {activeCategory.featuredCard.title}
                  </h4>
                  <p className="text-caption text-neutral-500 line-clamp-2">
                    {activeCategory.featuredCard.subtitle}
                  </p>
                </div>
                <Link
                  href={activeCategory.featuredCard.link}
                  onClick={onClose}
                  className="mt-4 btn-secondary text-caption py-2 w-full justify-center inline-flex items-center gap-1.5"
                >
                  Explore Collection <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrowseCategoriesMobileAccordion({ onClose }: BrowseCategoriesMenuProps) {
  const categories = useDynamicCategories();
  const [openCatId, setOpenCatId] = useState<string | null>(categories[0]?.id || 'necklaces');

  const toggleCategory = (id: string) => {
    setOpenCatId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-2 border-b border-neutral-950/10 pb-4 mb-4">
      <div className="flex items-center gap-2 px-1 text-caption uppercase tracking-[0.2em] font-semibold text-gold-700 mb-2">
        <LayoutGrid className="h-4 w-4" />
        <span>Browse All Categories</span>
      </div>

      <div className="space-y-1">
        {categories.map((cat) => {
          const isOpen = openCatId === cat.id;
          return (
            <div key={cat.id} className="border border-neutral-950/10 rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between p-3.5 text-body-sm font-medium text-neutral-950 bg-neutral-50/50 hover:bg-neutral-100 transition-colors"
              >
                <span className="flex items-center gap-2 font-semibold">
                  {cat.name}
                  {cat.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase bg-gold-100 text-gold-800">
                      {cat.badge}
                    </span>
                  )}
                </span>
                <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-neutral-950' : ''}`} />
              </button>

              {isOpen && (
                <div className="p-3 bg-cream-50/50 space-y-4 border-t border-neutral-950/5">
                  {cat.subsections.map((sub, sIdx) => (
                    <div key={sIdx} className="space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-neutral-400">
                        {sub.title}
                      </p>
                      <div className="grid grid-cols-1 gap-1.5 pl-2">
                        {sub.items.map((item, iIdx) => (
                          <Link
                            key={iIdx}
                            href={item.href}
                            onClick={onClose}
                            className="text-body-sm text-neutral-700 hover:text-gold-700 py-1 flex items-center justify-between"
                          >
                            <span>{item.label}</span>
                            <ArrowRight className="h-3 w-3 text-neutral-400" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-neutral-200">
                    <Link
                      href={cat.href}
                      onClick={onClose}
                      className="text-caption font-semibold uppercase tracking-wider text-gold-700 hover:underline flex items-center gap-1"
                    >
                      View All {cat.name} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
