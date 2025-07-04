export interface CurrencyRate {
  code: string;
  name: string;
  buy: number;
  sell: number;
  change: number;
  changePercent: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  timestamp: number;
}

export interface HistoricalData {
  currency: string;
  data: ChartDataPoint[];
}

export interface ConversionResult {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  result: number;
  rate: number;
}

export interface Currency {
  code: string;
  name: string;
}