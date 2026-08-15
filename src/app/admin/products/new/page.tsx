'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Upload, Plus, Trash2, Eye, Star, Layers, Sparkles, AlertCircle, Globe } from 'lucide-react';
import type { CustomProductInput, VariantInput } from '@/types/admin';
import { ProductCard } from '@/components/product/ProductCard';
import { OptimizedImage } from '@/components/ui/Image';
import type { Product, ProductVariant } from '@/types/shopify';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/context/ToastContext';
import { generateVariantMatrix } from '@/lib/variant-matrix';
import { SUPPORTED_CURRENCIES, parseCurrencyCode, getCurrencyOption } from '@/lib/currencies';
import { formatMoney } from '@/lib/utils';

export interface CellData {
  sku: string;
  barcode: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  lowStockThreshold: string;
  enabled: boolean;
}

function defaultCell(size: number): CellData {
  return { sku: '', barcode: '', price: size ? String(size) : '', compareAtPrice: '', stock: '10', lowStockThreshold: '5', enabled: true };
}

export default function NewProductPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [productType, setProductType] = useState('Necklace');
  const [customProductType, setCustomProductType] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [vendor, setVendor] = useState('Style Statement by Shakthi');
  const [price, setPrice] = useState<number | ''>('');
  const [compareAtPrice, setCompareAtPrice] = useState<number | ''>('');
  const [currencyCode, setCurrencyCode] = useState<string>('INR');
  const [defaultStoreCurrency, setDefaultStoreCurrency] = useState<string>('INR');
  const [collectionHandle, setCollectionHandle] = useState('bestsellers');
  const [tagsInput, setTagsInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cellOverrides, setCellOverrides] = useState<Record<string, Partial<CellData>>>({});

  const getSubcategoryPlaceholder = (type: string) => {
    switch (type.toLowerCase()) {
      case 'necklace':
        return 'e.g. Choker, Long Chain, Layered, Collar, Lariat';
      case 'ring':
        return 'e.g. Solitaire, Cocktail, Statement, Eternity Band';
      case 'earrings':
        return 'e.g. Studs, Jhumkas, Drops, Hoops, Chandelier';
      case 'bracelet':
      case 'bangles':
        return 'e.g. Tennis Bracelet, Kada, Stackable Bangles';
      case 'pendant':
        return 'e.g. Locket, Religious, Gemstone, Solitaire';
      default:
        return 'e.g. Enter subcategory (Choker, Statement, etc.)';
    }
  };

  // Fetch store default currency from settings on load
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.config) {
          const currRow = data.config.find((c: { key: string }) => c.key === 'currency');
          if (currRow?.value) {
            const code = parseCurrencyCode(currRow.value);
            setCurrencyCode(code);
            setDefaultStoreCurrency(code);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Custom Variant Options State
  const [optionName, setOptionName] = useState('Size');
  const [optionValuesInput, setOptionValuesInput] = useState('6, 7, 8, 9');
  const [optionsList, setOptionsList] = useState<Array<{ name: string; values: string[] }>>([
    { name: 'Size', values: ['6', '7', '8', '9'] },
  ]);

  // Handle Image File Uploads (PC / Mobile Camera / Photos)
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setImages((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleAddPreset = (url: string) => {
    setImages((prev) => [...prev, url]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const selected = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [selected, ...rest];
    });
  };

  const handleAddOption = () => {
    if (!optionName.trim() || !optionValuesInput.trim()) return;
    const values = optionValuesInput.split(',').map((v) => v.trim()).filter(Boolean);
    setOptionsList((prev) => [...prev, { name: optionName.trim(), values }]);
    setOptionName('');
    setOptionValuesInput('');
  };

  const handleRemoveOption = (index: number) => {
    setOptionsList((prev) => prev.filter((_, i) => i !== index));
  };

  const matrix = useMemo(() => generateVariantMatrix(optionsList), [optionsList]);

  const cellFor = (i: number): CellData => ({
    ...defaultCell(price === '' ? 0 : Number(price)),
    ...(cellOverrides[matrix[i].title] ?? {}),
  });

  const setCell = (i: number, patch: Partial<CellData>) => {
    setCellOverrides((prev) => ({ ...prev, [matrix[i].title]: { ...(prev[matrix[i].title] ?? {}), ...patch } }));
  };

  const enabledCells = matrix
    .map((cell, i) => ({ cell, data: cellFor(i), i }))
    .filter(({ data }) => data.enabled);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) return;

    setSaving(true);

    const finalProductType = productType === 'Other' ? customProductType.trim() || 'Jewelry' : productType;
    const tags = tagsInput.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (subcategory.trim() && !tags.includes(subcategory.trim().toLowerCase())) {
      tags.push(subcategory.trim().toLowerCase());
    }
    if (!tags.includes(collectionHandle)) tags.push(collectionHandle);

    const variants: VariantInput[] = matrix
      .map((cell, i) => ({ cell, data: cellFor(i) }))
      .filter(({ data }) => data.enabled)
      .map(({ cell, data }) => ({
        title: cell.title === 'Default Title' ? 'Default Title' : cell.title,
        sku: data.sku.trim() || undefined,
        barcode: data.barcode.trim() || undefined,
        price: Number(data.price) || Number(price) || 0,
        compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : undefined,
        currencyCode,
        stock: Number(data.stock) || 0,
        lowStockThreshold: Number(data.lowStockThreshold) || 5,
        selectedOptions: cell.selectedOptions,
      }));

    const inputData: CustomProductInput & { variants: VariantInput[] } = {
      title: title.trim(),
      description: description.trim(),
      productType: finalProductType,
      vendor: vendor.trim() || 'Style Statement by Shakthi',
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      currencyCode,
      collectionHandle,
      tags,
      images: images.length > 0 ? images : ['/placeholder.svg'],
      options: optionsList.length > 0 ? optionsList : undefined,
      variants,
    };

    try {
      setError(null);
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save product');
      }
      setSuccess(true);
      showToast('Product published successfully to storefront catalog!', 'success');
      setTimeout(() => {
        router.push('/admin');
      }, 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save product';
      setError(msg);
      showToast(msg, 'error');
      setSaving(false);
    }
  };

  // Generate live preview product object
  const autoHandle = title
    ? title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    : 'custom-product-preview';

  const previewVariants: ProductVariant[] = (enabledCells.length > 0
    ? enabledCells
    : [{ cell: { title: 'Default Title', selectedOptions: [] }, data: defaultCell(Number(price) || 0), i: 0 }]
  ).map(({ cell, data, i }, idx) => ({
    id: `variant-${idx}`,
    title: cell.title,
    availableForSale: Number(data.stock) > 0,
    quantityAvailable: Number(data.stock) || 0,
    selectedOptions: cell.selectedOptions,
    price: { amount: Number(data.price) || Number(price) || 0, currencyCode },
    compareAtPrice: data.compareAtPrice
      ? { amount: Number(data.compareAtPrice), currencyCode }
      : null,
    image: null,
    sku: data.sku || null,
    barcode: data.barcode || null,
    lowStockThreshold: Number(data.lowStockThreshold) || 5,
    archived: false,
  }));

  const previewTotalInventory = previewVariants.reduce((s, v) => s + (v.quantityAvailable ?? 0), 0);

  const previewProduct: Product = {
    id: 'gid://shopify/Product/preview',
    handle: autoHandle,
    title: title || 'Custom Jewelry Creation',
    description: description || 'Handcrafted fine jewelry crafted with intention.',
    descriptionHtml: `<p>${description}</p>`,
    vendor: vendor || 'Style Statement by Shakthi',
    productType: productType === 'Other' ? customProductType || 'Jewelry' : productType,
    tags: tagsInput.split(',').map((t) => t.trim()),
    availableForSale: previewTotalInventory > 0,
    totalInventory: previewTotalInventory,
    images: {
      edges: (images.length > 0 ? images : ['/placeholder.svg']).map((url, i) => ({
        node: { id: `img-${i}`, url, altText: title, width: 1200, height: 1500 },
      })),
      pageInfo: { hasNextPage: false },
    },
    featuredImage: {
      id: 'img-0',
      url: images[0] || '/placeholder.svg',
      altText: title,
      width: 1200,
      height: 1500,
    },
    options: optionsList.length > 0
      ? optionsList.map((opt, i) => ({ id: `opt-${i}`, name: opt.name, values: opt.values }))
      : [{ id: 'opt-0', name: 'Title', values: ['Default Title'] }],
    variants: {
      edges: previewVariants.map((node) => ({ node })),
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
    },
    priceRange: {
      minVariantPrice: { amount: Math.min(...previewVariants.map((v) => v.price.amount), Number(price) || 0), currencyCode },
      maxVariantPrice: { amount: Math.max(...previewVariants.map((v) => v.price.amount), Number(price) || 0), currencyCode },
    },
    compareAtPriceRange: compareAtPrice
      ? {
          minVariantPrice: { amount: Number(compareAtPrice), currencyCode },
          maxVariantPrice: { amount: Number(compareAtPrice), currencyCode },
        }
      : null,
    seo: { title, description },
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  };

  return (
    <div className="flex flex-col min-h-screen bg-cream-50">
      {/* Top Bar */}
      <header className="section-sm bg-white border-b border-neutral-200">
        <div className="container">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-body-sm text-neutral-500 hover:text-neutral-950 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Admin Catalog
          </Link>
          <span className="overline text-gold-600 block mb-1">Store Owner Portal</span>
          <h1 className="font-heading text-display-md text-neutral-950">Add Custom Product</h1>
        </div>
      </header>

      {/* Main Content */}
      <section className="section" aria-label="Add custom product form">
        <div className="container">
          {success ? (
            <div className="card p-10 max-w-md mx-auto text-center space-y-4 animate-fade-in">
              <CheckCircle2 className="h-12 w-12 text-gold-600 mx-auto" />
              <h2 className="font-heading text-heading-lg text-neutral-950">Product Published!</h2>
              <p className="text-body-sm text-neutral-600">
                &ldquo;{title}&rdquo; is now active on your store.
              </p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Column: Custom Form */}
              <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8">
                {/* 1. Basic Product Info */}
                <div className="card p-6 space-y-5">
                  <h2 className="font-heading text-heading-md text-neutral-950 border-b border-neutral-200 pb-3">
                    1. Basic Product Details
                  </h2>

                  <div className="space-y-2">
                    <label htmlFor="product-title" className="label">Product Title *</label>
                    <input
                      id="product-title"
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="input font-medium text-body"
                      placeholder="e.g. Handcrafted Solitaire Diamond Pendant"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="product-description" className="label">Description</label>
                    <textarea
                      id="product-description"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="input min-h-[100px] resize-y"
                      placeholder="Enter custom product details, diamond specifications, metal purity, or care instructions..."
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="product-type" className="label">Product Type / Category *</label>
                      <select
                        id="product-type"
                        value={productType}
                        onChange={(e) => setProductType(e.target.value)}
                        className="input"
                      >
                        <option value="Necklace">Necklace</option>
                        <option value="Ring">Ring</option>
                        <option value="Earrings">Earrings</option>
                        <option value="Pendant">Pendant</option>
                        <option value="Bracelet">Bracelet</option>
                        <option value="Bangles">Bangles</option>
                        <option value="Other">Custom Category...</option>
                      </select>
                    </div>

                    {productType === 'Other' ? (
                      <div className="space-y-2">
                        <label htmlFor="custom-category" className="label">Custom Category Name</label>
                        <input
                          id="custom-category"
                          type="text"
                          value={customProductType}
                          onChange={(e) => setCustomProductType(e.target.value)}
                          className="input"
                          placeholder="e.g. Anklets, Brooches"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label htmlFor="subcategory" className="label">Subcategory</label>
                        <input
                          id="subcategory"
                          type="text"
                          value={subcategory}
                          onChange={(e) => setSubcategory(e.target.value)}
                          className="input"
                          placeholder={getSubcategoryPlaceholder(productType)}
                        />
                      </div>
                    )}

                    {productType === 'Other' && (
                      <div className="space-y-2 sm:col-span-2">
                        <label htmlFor="subcategory-other" className="label">Subcategory</label>
                        <input
                          id="subcategory-other"
                          type="text"
                          value={subcategory}
                          onChange={(e) => setSubcategory(e.target.value)}
                          className="input"
                          placeholder="e.g. Choker, Statement, Handcrafted"
                        />
                      </div>
                    )}

                    <div className="space-y-2 sm:col-span-2">
                      <label htmlFor="vendor" className="label">Brand / Vendor</label>
                      <input
                        id="vendor"
                        type="text"
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                        className="input"
                        placeholder="Style Statement by Shakthi"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Image File Upload (PC / Mobile) */}
                <div className="card p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                    <h2 className="font-heading text-heading-md text-neutral-950">
                      2. Product Images (Upload from PC / Mobile)
                    </h2>
                    <span className="badge-gold">{images.length} Image{images.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="mobile-pc-upload-input"
                  />

                  {/* Drag & Drop Upload Zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                      isDragOver
                        ? 'border-gold-500 bg-gold-50/50 scale-[0.99]'
                        : 'border-neutral-300 hover:border-gold-500 hover:bg-neutral-50/80'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center mx-auto mb-3">
                      <Upload className="h-7 w-7" />
                    </div>
                    <p className="font-heading text-heading-sm font-semibold text-neutral-950 mb-1">
                      Click to Upload Images from PC / Mobile Camera
                    </p>
                    <p className="text-caption text-neutral-500 max-w-xs mx-auto">
                      Supports JPG, PNG, WEBP files directly from your smartphone photo gallery or computer.
                    </p>
                  </div>

                  {/* Image Thumbnail Grid */}
                  {images.length > 0 && (
                    <div className="space-y-2 pt-3">
                      <p className="text-caption text-neutral-500 uppercase tracking-wider">Image Gallery Preview</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {images.map((imgUrl, index) => (
                          <div
                            key={index}
                            className={`relative aspect-4-5 rounded-lg overflow-hidden border-2 group bg-neutral-100 ${
                              index === 0 ? 'border-gold-500 shadow-subtle' : 'border-neutral-200'
                            }`}
                          >
                            <OptimizedImage src={imgUrl} alt="" fill objectFit="cover" />
                            {/* Action overlay */}
                            <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[1px] flex items-center justify-center gap-2 p-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              {index !== 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryImage(index)}
                                  className="p-2 bg-gold-500 text-white rounded-full hover:bg-gold-600 shadow-subtle"
                                  title="Make primary image"
                                  aria-label={`Make image ${index + 1} the primary image`}
                                >
                                  <Star className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-subtle"
                                title="Remove image"
                                aria-label={`Remove image ${index + 1}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            {index === 0 && (
                              <span className="absolute bottom-1 left-1 badge-gold text-[9px] px-1.5 py-0.5 z-10">Primary</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Pricing & Inventory */}
                <div className="card p-6 space-y-5">
                  <h2 className="font-heading text-heading-md text-neutral-950 border-b border-neutral-200 pb-3 flex items-center justify-between">
                    <span>3. Custom Pricing & Inventory</span>
                  </h2>

                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="product-currency" className="label text-neutral-950 font-semibold flex items-center gap-1.5">
                        <Globe className="h-4 w-4 text-gold-600" />
                        Currency & Country Selection
                      </label>
                      <span className="text-caption text-gold-600 font-medium">
                        Store Default: {defaultStoreCurrency} ({getCurrencyOption(defaultStoreCurrency).symbol})
                      </span>
                    </div>
                    <select
                      id="product-currency"
                      value={currencyCode}
                      onChange={(e) => setCurrencyCode(e.target.value)}
                      className="input font-medium bg-white cursor-pointer"
                    >
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label} ({c.symbol})
                        </option>
                      ))}
                    </select>
                    <p className="text-caption text-neutral-500">
                      By default, this matches your store setting ({defaultStoreCurrency}). You can select a foreign currency for this product if needed.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="product-price" className="label">Price ({getCurrencyOption(currencyCode).symbol} {currencyCode}) *</label>
                      <input
                        id="product-price"
                        type="number"
                        required
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                        className="input font-semibold text-neutral-950"
                        placeholder="12500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="product-compare-price" className="label">Compare-At Price ({getCurrencyOption(currencyCode).symbol} {currencyCode})</label>
                      <input
                        id="product-compare-price"
                        type="number"
                        min="0"
                        value={compareAtPrice}
                        onChange={(e) => setCompareAtPrice(e.target.value ? Number(e.target.value) : '')}
                        className="input text-neutral-500"
                        placeholder="15000 (Shows sale discount percentage)"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                      <label htmlFor="collection" className="label">Target Store Collection</label>
                      <select
                        id="collection"
                        value={collectionHandle}
                        onChange={(e) => setCollectionHandle(e.target.value)}
                        className="input"
                      >
                        <option value="bestsellers">Bestsellers</option>
                        <option value="new-arrivals">New Arrivals</option>
                        <option value="all">All Products</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="label">Variant Count</label>
                      <div className="input flex items-center justify-between">
                        <span className="font-semibold text-neutral-950">{enabledCells.length}</span>
                        <span className="text-caption text-neutral-500">
                          {matrix.length > 0 ? `of ${matrix.length} generated` : 'default'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading text-heading-sm text-neutral-950">Variant Matrix</h3>
                      {matrix.length === 0 && (
                        <span className="text-caption text-neutral-500">Add options in section 4 to generate variants.</span>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-body-sm border-collapse">
                        <thead>
                          <tr className="text-left text-caption uppercase text-neutral-500">
                            <th className="py-2 pr-3 font-medium">Variant</th>
                            <th className="py-2 pr-3 font-medium">SKU</th>
                            <th className="py-2 pr-3 font-medium">Barcode</th>
                            <th className="py-2 pr-3 font-medium">Price ({getCurrencyOption(currencyCode).symbol})</th>
                            <th className="py-2 pr-3 font-medium">Compare-At ({getCurrencyOption(currencyCode).symbol})</th>
                            <th className="py-2 pr-3 font-medium">Stock</th>
                            <th className="py-2 pr-3 font-medium">Low Stock</th>
                            <th className="py-2 font-medium">Enable</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matrix.map((cell, i) => {
                            const data = cellFor(i);
                            return (
                              <tr key={`${cell.title}-${i}`} className={`border-t border-neutral-200 ${data.enabled ? '' : 'opacity-50'}`}>
                                <td className="py-2 pr-3">
                                  <span className="font-semibold text-neutral-950 whitespace-nowrap">{cell.title}</span>
                                </td>
                                <td className="py-2 pr-3">
                                  <input
                                    type="text"
                                    value={data.sku}
                                    onChange={(e) => setCell(i, { sku: e.target.value })}
                                    className="input !py-1.5 !px-2 min-w-[90px]"
                                    placeholder="SKU"
                                  />
                                </td>
                                <td className="py-2 pr-3">
                                  <input
                                    type="text"
                                    value={data.barcode}
                                    onChange={(e) => setCell(i, { barcode: e.target.value })}
                                    className="input !py-1.5 !px-2 min-w-[90px]"
                                    placeholder="Barcode"
                                  />
                                </td>
                                <td className="py-2 pr-3">
                                  <input
                                    type="number"
                                    min="0"
                                    value={data.price}
                                    onChange={(e) => setCell(i, { price: e.target.value })}
                                    className="input !py-1.5 !px-2 w-[90px]"
                                    placeholder={price ? String(price) : '0'}
                                  />
                                </td>
                                <td className="py-2 pr-3">
                                  <input
                                    type="number"
                                    min="0"
                                    value={data.compareAtPrice}
                                    onChange={(e) => setCell(i, { compareAtPrice: e.target.value })}
                                    className="input !py-1.5 !px-2 w-[90px]"
                                    placeholder="—"
                                  />
                                </td>
                                <td className="py-2 pr-3">
                                  <input
                                    type="number"
                                    min="0"
                                    value={data.stock}
                                    onChange={(e) => setCell(i, { stock: e.target.value })}
                                    className="input !py-1.5 !px-2 w-[80px]"
                                    placeholder="10"
                                  />
                                </td>
                                <td className="py-2 pr-3">
                                  <input
                                    type="number"
                                    min="0"
                                    value={data.lowStockThreshold}
                                    onChange={(e) => setCell(i, { lowStockThreshold: e.target.value })}
                                    className="input !py-1.5 !px-2 w-[80px]"
                                    placeholder="5"
                                  />
                                </td>
                                <td className="py-2">
                                  <input
                                    type="checkbox"
                                    checked={data.enabled}
                                    onChange={(e) => setCell(i, { enabled: e.target.checked })}
                                    className="h-4 w-4 accent-gold-600"
                                  />
                                </td>
                               </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label htmlFor="tags" className="label">Custom Tags (Comma Separated)</label>
                    <input
                      id="tags"
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="input"
                      placeholder="bestsellers, 18k-gold, handcrafted, gift"
                    />
                  </div>
                </div>

                {/* 4. Custom Options & Variants */}
                <div className="card p-6 space-y-5">
                  <h2 className="font-heading text-heading-md text-neutral-950 border-b border-neutral-200 pb-3">
                    4. Custom Options & Variants (Sizes, Metals, Colors)
                  </h2>

                  <div className="grid sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-4 space-y-1.5">
                      <label htmlFor="option-name" className="label">Option Name</label>
                      <input
                        id="option-name"
                        type="text"
                        value={optionName}
                        onChange={(e) => setOptionName(e.target.value)}
                        className="input"
                        placeholder="e.g. Ring Size, Metal"
                      />
                    </div>
                    <div className="sm:col-span-6 space-y-1.5">
                      <label htmlFor="option-values" className="label">Values (Comma Separated)</label>
                      <input
                        id="option-values"
                        type="text"
                        value={optionValuesInput}
                        onChange={(e) => setOptionValuesInput(e.target.value)}
                        className="input"
                        placeholder="e.g. 6, 7, 8, 9 or Yellow Gold, Rose Gold"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="btn-secondary w-full py-3"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {optionsList.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {optionsList.map((opt, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded border border-neutral-200 text-body-sm">
                          <div>
                            <span className="font-semibold text-neutral-950 mr-2">{opt.name}:</span>
                            <span className="text-neutral-600">{opt.values.join(', ')}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(i)}
                            className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                {error && (
                  <Alert variant="error" title="Form Error" dismissible onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                <div className="flex gap-4 pt-2">
                  <Button type="submit" disabled={saving} className="flex-1 py-4 text-body font-medium">
                    {saving ? 'Publishing Product...' : 'Publish Product to Storefront'}
                  </Button>
                  <Link href="/admin" className="btn-secondary px-6">
                    Cancel
                  </Link>
                </div>
              </form>

              {/* Right Column: Live Storefront Card Preview */}
              <div className="lg:col-span-5 sticky top-28 space-y-4">
                <div className="flex items-center gap-2 text-body-sm font-semibold text-neutral-950">
                  <Eye className="h-4 w-4 text-gold-600" />
                  <span>Real-Time Storefront Card Preview</span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-soft">
                  <ProductCard product={previewProduct} priority showQuickAdd />
                </div>

                <div className="card p-4 space-y-2 bg-cream-50 border-neutral-200">
                  <p className="text-caption font-semibold uppercase text-neutral-500">Live Product Specs</p>
                  <ul className="text-body-sm text-neutral-700 space-y-1">
                    <li><strong className="text-neutral-950">Title:</strong> {title || 'Untitled'}</li>
                    <li><strong className="text-neutral-950">Category:</strong> {productType === 'Other' ? customProductType || 'Jewelry' : productType}</li>
                    <li><strong className="text-neutral-950">Currency:</strong> {currencyCode} ({getCurrencyOption(currencyCode).symbol}) — {getCurrencyOption(currencyCode).country || getCurrencyOption(currencyCode).name}</li>
                    <li><strong className="text-neutral-950">Price:</strong> {formatMoney(Number(price) || 0, currencyCode)}</li>
                    {compareAtPrice && <li><strong className="text-neutral-950">Sale Compare Price:</strong> {formatMoney(Number(compareAtPrice), currencyCode)}</li>}
                    <li><strong className="text-neutral-950">Collection:</strong> {collectionHandle}</li>
                    <li><strong className="text-neutral-950">Options:</strong> {optionsList.map((o) => `${o.name} (${o.values.join(', ')})`).join(' | ') || 'Default'}</li>
                    <li><strong className="text-neutral-950">Variants:</strong> {enabledCells.length} enabled · {previewTotalInventory} total units</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
