import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CurrencyConverter from '../components/CurrencyConverter';
import ScrollToTop from '../components/ScrollToTop';
import { Calculator, TrendingUp, Clock } from 'lucide-react';
import { exchangeService, ExchangeRate } from '../services/exchangeService';
import { Currency } from '../types';

const Converter: React.FC = () => {
  const { t } = useTranslation();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const fetchRates = async () => {
      const data = await exchangeService.getExchangeRates(new Date());
      setRates(data);
    };

    const fetchCurrencies = async () => {
      const data = await exchangeService.getCurrencies();
      setCurrencies(data);
    };

    fetchRates();
    fetchCurrencies();
  }, []);

  const currenciesWithRates = rates.filter(currency => currency.buy !== null || currency.sell !== null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calculator className="h-8 w-8" />
            Calculadora
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Converter */}
          <div className="lg:col-span-2">
            <CurrencyConverter />
          </div>
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
};

export default Converter;