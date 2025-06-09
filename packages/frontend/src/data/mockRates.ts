import { CurrencyRate, ChartDataPoint, HistoricalData } from '../types';
import { subDays, format } from 'date-fns';

export const mockRates: CurrencyRate[] = [
  {
    code: 'USD',
    name: 'US Dollar',
    rate: 1,
    change: 0,
    changePercent: 0
  },
  {
    code: 'ARS',
    name: 'Argentine Peso',
    rate: 365.50,
    change: -2.30,
    changePercent: -0.62
  },
  {
    code: 'EUR',
    name: 'Euro',
    rate: 0.92,
    change: 0.005,
    changePercent: 0.54
  },
  {
    code: 'GBP',
    name: 'British Pound',
    rate: 0.79,
    change: 0.012,
    changePercent: 1.54
  },
  {
    code: 'BTC',
    name: 'Bitcoin',
    rate: 0.000023,
    change: 0.000001,
    changePercent: 4.55
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    rate: 150.25,
    change: -0.85,
    changePercent: -0.56
  }
];

// Generate mock historical data
const generateHistoricalData = (baseLine = 100, volatility = 5, days = 30): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  let currentValue = baseLine;
  
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const change = (Math.random() - 0.5) * volatility;
    currentValue += change;
    
    data.push({
      date: format(date, 'MMM dd'),
      value: Math.round(currentValue * 100) / 100,
      timestamp: date.getTime()
    });
  }
  
  return data;
};

export const mockHistoricalData: HistoricalData[] = [
  {
    currency: 'USD/ARS',
    data: generateHistoricalData(365, 15, 30)
  },
  {
    currency: 'EUR/USD',
    data: generateHistoricalData(1.08, 0.02, 30)
  },
  {
    currency: 'GBP/USD',
    data: generateHistoricalData(1.26, 0.03, 30)
  },
  {
    currency: 'BTC/USD',
    data: generateHistoricalData(43500, 2000, 30)
  }
];

export const getCurrencyRate = (code: string): number => {
  const currency = mockRates.find(rate => rate.code === code);
  return currency ? currency.rate : 1;
};

export const convertCurrency = (amount: number, fromCode: string, toCode: string): number => {
  const fromRate = getCurrencyRate(fromCode);
  const toRate = getCurrencyRate(toCode);
  
  if (fromCode === 'USD') {
    return amount * toRate;
  } else if (toCode === 'USD') {
    return amount / fromRate;
  } else {
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  }
};