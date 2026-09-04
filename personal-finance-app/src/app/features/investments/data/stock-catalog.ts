export interface Stock {
  symbol: string;
  name: string;
  type: 'stock' | 'etf' | 'crypto';
}

export const STOCK_CATALOG: Stock[] = [
  // US large-cap stocks
  { symbol: 'AAPL', name: 'Apple', type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft', type: 'stock' },
  { symbol: 'AMZN', name: 'Amazon', type: 'stock' },
  { symbol: 'GOOGL', name: 'Alphabet (Google)', type: 'stock' },
  { symbol: 'META', name: 'Meta Platforms', type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla', type: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'stock' },
  { symbol: 'V', name: 'Visa', type: 'stock' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'stock' },
  { symbol: 'KO', name: 'Coca-Cola', type: 'stock' },
  { symbol: 'PEP', name: 'PepsiCo', type: 'stock' },
  { symbol: 'DIS', name: 'Walt Disney', type: 'stock' },
  { symbol: 'NFLX', name: 'Netflix', type: 'stock' },
  { symbol: 'JPM', name: 'JPMorgan Chase', type: 'stock' },
  { symbol: 'BAC', name: 'Bank of America', type: 'stock' },
  { symbol: 'WMT', name: 'Walmart', type: 'stock' },
  { symbol: 'PG', name: 'Procter & Gamble', type: 'stock' },
  { symbol: 'IBM', name: 'IBM', type: 'stock' },
  { symbol: 'INTC', name: 'Intel', type: 'stock' },
  { symbol: 'AMD', name: 'AMD', type: 'stock' },
  { symbol: 'PYPL', name: 'PayPal', type: 'stock' },
  { symbol: 'UBER', name: 'Uber', type: 'stock' },
  { symbol: 'NKE', name: 'Nike', type: 'stock' },
  // International stocks
  { symbol: 'TM', name: 'Toyota', type: 'stock' },
  { symbol: 'BABA', name: 'Alibaba', type: 'stock' },
  { symbol: 'TSM', name: 'TSMC', type: 'stock' },
  { symbol: 'VALE', name: 'Vale', type: 'stock' },
  // ETFs
  { symbol: 'SPY', name: 'S&P 500 ETF', type: 'etf' },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', type: 'etf' },
  { symbol: 'VTI', name: 'Total Stock Market ETF', type: 'etf' },
  { symbol: 'VXUS', name: 'Total International ETF', type: 'etf' },
];