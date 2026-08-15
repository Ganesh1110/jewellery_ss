import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetailsClient } from '@/components/product/ProductDetailsClient';
import { fetchProduct, fetchProductRecommendations, fetchShop } from '@/lib/shopify';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProductPageProps {
  params: Promise<{ handle: string }>;
}

async function getProductData(handle: string) {
  const [product, shop] = await Promise.all([
    fetchProduct(handle),
    fetchShop(),
  ]);

  if (!product) return null;

  const recommendations = await fetchProductRecommendations(product.id);

  return {
    product,
    recommendations: recommendations.slice(0, 4),
    shop,
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = params instanceof Promise ? await params : (params as { handle: string });
  const product = await fetchProduct(resolvedParams?.handle);
  if (!product) {
    return { title: 'Product Not Found' };
  }
  const price = product.priceRange.minVariantPrice;
  const currency = price.currencyCode;
  const formattedPrice = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(price.amount);

  return {
    title: product.title,
    description: product.description || `Shop ${product.title} at Style Statement by Shakthi. ${formattedPrice}.`,
    openGraph: {
      title: product.title,
      description: product.description || `Shop ${product.title} at Style Statement by Shakthi.`,
      images: product.images.edges.map(({ node }) => ({
        url: node.url,
        width: node.width,
        height: node.height,
        alt: node.altText || product.title,
      })),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: product.description || `Shop ${product.title} at Style Statement by Shakthi.`,
      images: product.images.edges[0]?.node.url ? [product.images.edges[0].node.url] : [],
    },
    other: {
      'product:price:amount': price.amount.toString(),
      'product:price:currency': currency,
      'product:availability': product.availableForSale ? 'in stock' : 'out of stock',
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const data = await getProductData(resolvedParams.handle);

  if (!data) {
    notFound();
  }

  return (
    <ProductDetailsClient
      product={data.product}
      recommendations={data.recommendations}
      freeShippingThreshold={data.shop.freeShippingThreshold}
      returnWindow={data.shop.returnWindow}
    />
  );
}