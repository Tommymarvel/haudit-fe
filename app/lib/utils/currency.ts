const SYMBOL_BY_CODE: Record<string, string> = {
  USD: '$',
  NGN: '₦',
  EUR: '€',
  GBP: '£',
};

function sanitizeAmount(value?: number) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function sanitizeAmountInput(value: string) {
  const normalized = value.replace(/,/g, '').replace(/[^\d.]/g, '');
  if (!normalized) return '';

  const [wholeRaw = '', ...decimalParts] = normalized.split('.');
  const hasDecimal = normalized.includes('.');
  const decimal = decimalParts.join('');
  const whole = wholeRaw.replace(/^0+(?=\d)/, '') || '0';
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return hasDecimal ? `${grouped}.${decimal}` : grouped;
}

export function normalizeCurrencyCode(currency?: string, fallback = 'USD') {
  const code = (currency || '').trim().toUpperCase();
  return code || fallback;
}

export function formatCurrencyAmount(
  value?: number,
  currency?: string,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    fallbackCurrency?: string;
    preferCode?: boolean;
  }
) {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    fallbackCurrency = 'USD',
    preferCode = false,
  } = options || {};

  const amount = sanitizeAmount(value);
  const code = normalizeCurrencyCode(currency, fallbackCurrency);
  const formattedNumber = amount.toLocaleString(undefined, {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  if (preferCode) return `${code} ${formattedNumber}`;

  const symbol = SYMBOL_BY_CODE[code];
  return symbol ? `${symbol}${formattedNumber}` : `${code} ${formattedNumber}`;
}

export function deriveSingleCurrency(
  values: Array<string | undefined | null>,
  fallback = 'USD'
) {
  const currencies = Array.from(
    new Set(
      values
        .map((value) => normalizeCurrencyCode(value || undefined, ''))
        .filter(Boolean)
    )
  );

  if (currencies.length === 1) return currencies[0];
  return fallback;
}

export function formatAmountInput(value: string) {
  return sanitizeAmountInput(String(value ?? ''));
}

export function parseAmountInput(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : Number.NaN;
  }

  const raw = String(value ?? '').trim();
  if (!raw) return Number.NaN;

  const parsed = Number(raw.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}
