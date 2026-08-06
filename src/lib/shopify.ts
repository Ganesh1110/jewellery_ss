import { GraphQLClient, gql } from 'graphql-request';
import type {
  Product,
  ProductConnection,
  Collection,
  CollectionConnection,
  Cart,
  CartCreateInput,
  CartLineUpdateInput,
  Menu,
  Shop,
  Article,
  ArticleConnection,
} from '@/types/shopify';
import {
  mockProducts,
  mockCollections,
  mockProduct,
  mockCollection as getMockCollection,
  mockRecommendations,
  mockSearchProducts,
  mockMenus,
  mockShop,
  mockBlogs,
  mockArticlesForBlog,
  mockArticle,
  mockFetchCart,
  mockCreateCart,
  mockAddToCart,
  mockUpdateCartLine,
  mockRemoveFromCart,
  mockUpdateCartNote,
} from './mock-data';

export function isShopifyConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN &&
      process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN
  );
}

export function shouldUseMockData(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || !isShopifyConfigured();
}

function sortMockProducts(products: Product[], sortKey?: string): Product[] {
  const list = [...products];
  switch (sortKey) {
    case 'TITLE_ASC':
      return list.sort((a, b) => a.title.localeCompare(b.title));
    case 'TITLE_DESC':
      return list.sort((a, b) => b.title.localeCompare(a.title));
    case 'PRICE_ASC':
      return list.sort(
        (a, b) =>
          a.priceRange.minVariantPrice.amount - b.priceRange.minVariantPrice.amount
      );
    case 'PRICE_DESC':
      return list.sort(
        (a, b) =>
          b.priceRange.minVariantPrice.amount - a.priceRange.minVariantPrice.amount
      );
    case 'CREATED_DESC':
      return list;
    case 'BEST_SELLING':
    default:
      return list;
  }
}

const endpoint = `https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/api/${process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_VERSION || '2024-04'}/graphql.json`;

const client = new GraphQLClient(endpoint, {
  headers: {
    'X-Shopify-Storefront-Access-Token': process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN || '',
    'Content-Type': 'application/json',
  },
});

// GraphQL Fragments
const productFragment = gql`
  fragment ProductFragment on Product {
    id
    handle
    title
    description
    descriptionHtml
    vendor
    productType
    tags
    availableForSale
    totalInventory
    images(first: 10) {
      edges {
        node {
          id
          url
          altText
          width
          height
        }
      }
      pageInfo {
        hasNextPage
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
    options {
      id
      name
      values
    }
    variants(first: 250) {
      edges {
        node {
          id
          title
          availableForSale
          quantityAvailable
          selectedOptions {
            name
            value
          }
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          image {
            id
            url
            altText
            width
            height
          }
          sku
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    seo {
      title
      description
    }
    updatedAt
    publishedAt
  }
`;

const cartFragment = gql`
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    lines(first: 250) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              availableForSale
              quantityAvailable
              selectedOptions {
                name
                value
              }
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              image {
                id
                url
                altText
                width
                height
              }
              sku
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            amountPerQuantity {
              amount
              currencyCode
            }
          }
          attributes {
            key
            value
          }
          discounts {
            amount {
              amount
              currencyCode
            }
            code
          }
        }
      }
    }
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
      totalTaxAmount {
        amount
        currencyCode
      }
      totalDutyAmount {
        amount
        currencyCode
      }
    }
    discountCodes {
      code
      applicable
    }
    buyerIdentity {
      countryCode
      email
      phone
    }
    attributes {
      key
      value
    }
    note
    createdAt
    updatedAt
  }
`;

// Queries
export const GET_PRODUCTS = gql`
  query getProducts(
    $first: Int!
    $after: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $query: String
  ) {
    products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, query: $query) {
      edges {
        node {
          ...ProductFragment
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${productFragment}
`;

export const GET_PRODUCT_BY_HANDLE = gql`
  query getProductByHandle($handle: String!) {
    product(handle: $handle) {
      ...ProductFragment
    }
  }
  ${productFragment}
`;

export const GET_PRODUCT_RECOMMENDATIONS = gql`
  query getProductRecommendations($productId: ID!) {
    productRecommendations(productId: $productId) {
      ...ProductFragment
    }
  }
  ${productFragment}
`;

export const GET_COLLECTIONS = gql`
  query getCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      edges {
        node {
          id
          handle
          title
          description
          descriptionHtml
          image {
            id
            url
            altText
            width
            height
          }
          seo {
            title
            description
          }
          updatedAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export const GET_COLLECTION_BY_HANDLE = gql`
  query getCollectionByHandle($handle: String!, $first: Int!, $after: String) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      image {
        id
        url
        altText
        width
        height
      }
      seo {
        title
        description
      }
      updatedAt
      products(first: $first, after: $after) {
        edges {
          node {
            ...ProductFragment
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
  ${productFragment}
`;

export const GET_CART = gql`
  query getCart($cartId: ID!) {
    cart(id: $cartId) {
      ...CartFragment
    }
  }
  ${cartFragment}
`;

// Mutations
export const CREATE_CART = gql`
  mutation createCart($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${cartFragment}
`;

export const ADD_TO_CART = gql`
  mutation addToCart($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${cartFragment}
`;

export const UPDATE_CART_LINE = gql`
  mutation updateCartLine($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${cartFragment}
`;

export const REMOVE_FROM_CART = gql`
  mutation removeFromCart($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${cartFragment}
`;

export const UPDATE_CART_NOTE = gql`
  mutation updateCartNote($cartId: ID!, $note: String!) {
    cartNoteUpdate(cartId: $cartId, note: $note) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${cartFragment}
`;

export const UPDATE_CART_ATTRIBUTES = gql`
  mutation updateCartAttributes($cartId: ID!, $attributes: [AttributeInput!]!) {
    cartAttributesUpdate(cartId: $cartId, attributes: $attributes) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${cartFragment}
`;

export const UPDATE_CART_BUYER_IDENTITY = gql`
  mutation updateCartBuyerIdentity($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${cartFragment}
`;

// Menu & Navigation
export const GET_MENU = gql`
  query getMenu($handle: String!) {
    menu(handle: $handle) {
      id
      handle
      title
      items {
        id
        title
        url
        resourceType
        resourceId
        items {
          id
          title
          url
          resourceType
          resourceId
        }
      }
    }
  }
`;

export const GET_MENUS = gql`
  query getMenus {
    menus(first: 20) {
      edges {
        node {
          id
          handle
          title
          items {
            id
            title
            url
            resourceType
            resourceId
            items {
              id
              title
              url
              resourceType
              resourceId
            }
          }
        }
      }
    }
  }
`;

// Shop
export const GET_SHOP = gql`
  query getShop {
    shop {
      name
      description
      brand {
        logo {
          id
          url
          altText
          width
          height
        }
        coverImage {
          id
          url
          altText
          width
          height
        }
        shortDescription
      }
      primaryDomain {
        url
        host
      }
      currencyCode
      countriesInShipping
      paymentSettings {
        acceptedPaymentMethods
      }
      policies {
        privacyPolicy {
          id
          title
          body
          url
        }
        refundPolicy {
          id
          title
          body
          url
        }
        termsOfService {
          id
          title
          body
          url
        }
        shippingPolicy {
          id
          title
          body
          url
        }
      }
    }
  }
`;

// Blog & Articles
export const GET_BLOGS = gql`
  query getBlogs($first: Int!) {
    blogs(first: $first) {
      edges {
        node {
          id
          handle
          title
        }
      }
    }
  }
`;

export const GET_ARTICLES = gql`
  query getArticles($blogHandle: String!, $first: Int!, $after: String) {
    blog(handle: $blogHandle) {
      id
      handle
      title
      articles(first: $first, after: $after) {
        edges {
          node {
            id
            handle
            title
            excerpt
            contentHtml
            image {
              id
              url
              altText
              width
              height
            }
            author {
              name
              bio
              image {
                id
                url
                altText
                width
                height
              }
            }
            publishedAt
            blog {
              id
              handle
              title
            }
            seo {
              title
              description
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
    }
  }
`;

export const GET_ARTICLE_BY_HANDLE = gql`
  query getArticleByHandle($blogHandle: String!, $articleHandle: String!) {
    blog(handle: $blogHandle) {
      article(handle: $articleHandle) {
        id
        handle
        title
        excerpt
        contentHtml
        image {
          id
          url
          altText
          width
          height
        }
        author {
          name
          bio
          image {
            id
            url
            altText
            width
            height
          }
        }
        publishedAt
        blog {
          id
          handle
          title
        }
        seo {
          title
          description
        }
      }
    }
  }
`;

// API Functions
export async function fetchProducts(
  first = 12,
  after?: string,
  sortKey?: string,
  reverse = false,
  query?: string
): Promise<ProductConnection> {
  if (shouldUseMockData()) {
    const products = sortMockProducts(
      query ? mockSearchProducts(query) : mockProducts,
      sortKey
    );
    return {
      edges: products.slice(0, first).map((node) => ({ node, cursor: node.handle })),
      pageInfo: {
        hasNextPage: products.length > first,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    };
  }

  const data = await client.request<{ products: ProductConnection }>(GET_PRODUCTS, {
    first,
    after,
    sortKey,
    reverse,
    query,
  });
  return data.products;
}

export async function fetchProduct(handle: string): Promise<Product | null> {
  if (shouldUseMockData()) {
    return mockProduct(handle);
  }
  const data = await client.request<{ product: Product | null }>(GET_PRODUCT_BY_HANDLE, { handle });
  return data.product;
}

export async function fetchProductRecommendations(productId: string): Promise<Product[]> {
  if (shouldUseMockData()) {
    return mockRecommendations(productId);
  }
  const data = await client.request<{ productRecommendations: Product[] }>(GET_PRODUCT_RECOMMENDATIONS, {
    productId,
  });
  return data.productRecommendations;
}

export async function fetchCollections(first = 20, after?: string): Promise<CollectionConnection> {
  if (shouldUseMockData()) {
    return {
      edges: mockCollections.slice(0, first).map((node) => ({ node, cursor: node.handle })),
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
    };
  }
  const data = await client.request<{ collections: CollectionConnection }>(GET_COLLECTIONS, {
    first,
    after,
  });
  return data.collections;
}

export async function fetchCollection(
  handle: string,
  first = 12,
  after?: string
): Promise<Collection | null> {
  if (shouldUseMockData()) {
    return getMockCollection(handle);
  }
  const data = await client.request<{ collection: Collection | null }>(GET_COLLECTION_BY_HANDLE, {
    handle,
    first,
    after,
  });
  return data.collection;
}

export async function fetchCart(cartId: string): Promise<Cart | null> {
  if (shouldUseMockData()) {
    return mockFetchCart(cartId);
  }
  const data = await client.request<{ cart: Cart | null }>(GET_CART, { cartId });
  return data.cart;
}

export async function createCart(input: CartCreateInput = {}): Promise<Cart | null> {
  if (shouldUseMockData()) {
    return mockCreateCart();
  }
  const data = await client.request<{ cartCreate: { cart: Cart | null; userErrors: any[] } }>(CREATE_CART, {
    input,
  });
  if (data.cartCreate.userErrors.length > 0) {
    throw new Error(data.cartCreate.userErrors[0].message);
  }
  return data.cartCreate.cart;
}

export async function addToCart(
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number; attributes?: Array<{ key: string; value: string }> }>
): Promise<Cart | null> {
  if (shouldUseMockData()) {
    return mockAddToCart(cartId, lines);
  }
  const data = await client.request<{ cartLinesAdd: { cart: Cart | null; userErrors: any[] } }>(ADD_TO_CART, {
    cartId,
    lines,
  });
  if (data.cartLinesAdd.userErrors.length > 0) {
    throw new Error(data.cartLinesAdd.userErrors[0].message);
  }
  return data.cartLinesAdd.cart;
}

export async function updateCartLine(
  cartId: string,
  lines: CartLineUpdateInput[]
): Promise<Cart | null> {
  if (shouldUseMockData()) {
    return mockUpdateCartLine(cartId, lines);
  }
  const data = await client.request<{ cartLinesUpdate: { cart: Cart | null; userErrors: any[] } }>(UPDATE_CART_LINE, {
    cartId,
    lines,
  });
  if (data.cartLinesUpdate.userErrors.length > 0) {
    throw new Error(data.cartLinesUpdate.userErrors[0].message);
  }
  return data.cartLinesUpdate.cart;
}

export async function removeFromCart(cartId: string, lineIds: string[]): Promise<Cart | null> {
  if (shouldUseMockData()) {
    return mockRemoveFromCart(cartId, lineIds);
  }
  const data = await client.request<{ cartLinesRemove: { cart: Cart | null; userErrors: any[] } }>(REMOVE_FROM_CART, {
    cartId,
    lineIds,
  });
  if (data.cartLinesRemove.userErrors.length > 0) {
    throw new Error(data.cartLinesRemove.userErrors[0].message);
  }
  return data.cartLinesRemove.cart;
}

export async function updateCartNote(cartId: string, note: string): Promise<Cart | null> {
  if (shouldUseMockData()) {
    return mockUpdateCartNote(cartId, note);
  }
  const data = await client.request<{ cartNoteUpdate: { cart: Cart | null; userErrors: any[] } }>(UPDATE_CART_NOTE, {
    cartId,
    note,
  });
  if (data.cartNoteUpdate.userErrors.length > 0) {
    throw new Error(data.cartNoteUpdate.userErrors[0].message);
  }
  return data.cartNoteUpdate.cart;
}

export async function fetchMenu(handle: string): Promise<Menu | null> {
  if (shouldUseMockData()) {
    return mockMenus.find((m) => m.handle === handle) || null;
  }
  const data = await client.request<{ menu: Menu | null }>(GET_MENU, { handle });
  return data.menu;
}

export async function fetchMenus(): Promise<Menu[]> {
  if (shouldUseMockData()) {
    return mockMenus;
  }
  const data = await client.request<{ menus: { edges: Array<{ node: Menu }> } }>(GET_MENUS);
  return data.menus.edges.map(({ node }) => node);
}

export async function fetchShop(): Promise<Shop> {
  if (shouldUseMockData()) {
    return mockShop;
  }
  const data = await client.request<{ shop: Shop }>(GET_SHOP);
  return data.shop;
}

export async function fetchBlogs(first = 10): Promise<Array<{ id: string; handle: string; title: string }>> {
  if (shouldUseMockData()) {
    return mockBlogs();
  }
  const data = await client.request<{ blogs: { edges: Array<{ node: { id: string; handle: string; title: string } }> } }>(GET_BLOGS, {
    first,
  });
  return data.blogs.edges.map(({ node }) => node);
}

export async function fetchArticles(
  blogHandle: string,
  first = 10,
  after?: string
): Promise<ArticleConnection> {
  if (shouldUseMockData()) {
    const edges = mockArticlesForBlog(blogHandle);
    const sliced = edges.edges.slice(0, first);
    return {
      edges: sliced,
      pageInfo: { hasNextPage: edges.edges.length > first, hasPreviousPage: false },
    };
  }
  const data = await client.request<{ blog: { articles: ArticleConnection } }>(GET_ARTICLES, {
    blogHandle,
    first,
    after,
  });
  return data.blog.articles;
}

export async function fetchArticle(blogHandle: string, articleHandle: string): Promise<Article | null> {
  if (shouldUseMockData()) {
    return mockArticle(blogHandle, articleHandle);
  }
  const data = await client.request<{ blog: { article: Article | null } }>(GET_ARTICLE_BY_HANDLE, {
    blogHandle,
    articleHandle,
  });
  return data.blog?.article || null;
}