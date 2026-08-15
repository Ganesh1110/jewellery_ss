export interface CurrencyOption {
  code: string;       // e.g. 'INR'
  symbol: string;     // e.g. '₹'
  name: string;       // e.g. 'Indian Rupee'
  country: string;    // e.g. 'India'
  label: string;      // e.g. 'INR (₹) - India'
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', country: 'India', label: 'INR (₹) - India' },
  { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States', label: 'USD ($) - United States' },
  { code: 'EUR', symbol: '€', name: 'Euro', country: 'European Union', label: 'EUR (€) - European Union' },
  { code: 'GBP', symbol: '£', name: 'British Pound', country: 'United Kingdom', label: 'GBP (£) - United Kingdom' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', country: 'United Arab Emirates', label: 'AED (AED) - UAE' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', country: 'Canada', label: 'CAD (CA$) - Canada' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', country: 'Australia', label: 'AUD (A$) - Australia' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', country: 'Singapore', label: 'SGD (S$) - Singapore' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', country: 'Saudi Arabia', label: 'SAR (SAR) - Saudi Arabia' },
  { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', country: 'Qatar', label: 'QAR (QAR) - Qatar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', country: 'Japan', label: 'JPY (¥) - Japan' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', country: 'Malaysia', label: 'MYR (RM) - Malaysia' },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar', country: 'Kuwait', label: 'KWD (KD) - Kuwait' },
  { code: 'OMR', symbol: 'OMR', name: 'Omani Rial', country: 'Oman', label: 'OMR (OMR) - Oman' },
  { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar', country: 'Bahrain', label: 'BHD (BD) - Bahrain' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', country: 'Switzerland', label: 'CHF (CHF) - Switzerland' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', country: 'China', label: 'CNY (¥) - China' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', country: 'Hong Kong', label: 'HKD (HK$) - Hong Kong' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', country: 'New Zealand', label: 'NZD (NZ$) - New Zealand' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', country: 'South Africa', label: 'ZAR (R) - South Africa' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', country: 'Thailand', label: 'THB (฿) - Thailand' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', country: 'South Korea', label: 'KRW (₩) - South Korea' },
];

export function parseCurrencyCode(val: string): string {
  if (!val) return 'INR';
  const match = val.match(/([A-Z]{3})/);
  return match ? match[1] : 'INR';
}

export function getCurrencyOption(codeOrVal: string): CurrencyOption {
  const code = parseCurrencyCode(codeOrVal);
  return (
    SUPPORTED_CURRENCIES.find((c) => c.code === code) || {
      code,
      symbol: code === 'INR' ? '₹' : '$',
      name: code,
      country: '',
      label: `${code} - Custom`,
    }
  );
}

export function getCurrencySymbol(codeOrVal: string): string {
  const opt = getCurrencyOption(codeOrVal);
  return opt.symbol;
}
