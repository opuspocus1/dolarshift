import axios from 'axios';

// Types based on BCRA API specification
interface Divisa {
  codigo: string;
  denominacion: string;
}

interface CotizacionesDetalle {
  codigoMoneda: string;
  descripcion: string;
  tipoPase: number;
  tipoCotizacion: number;
}

interface CotizacionesFecha {
  fecha: string;
  detalle: CotizacionesDetalle[];
}

interface CotizacionesResponse {
  status: number;
  metadata: {
    resultset: {
      count: number;
      offset: number;
      limit: number;
    }
  };
  results: CotizacionesFecha[];
}

interface ErrorResponse {
  status: number;
  errorMessages: string[];
}

// BCRA API base URL
const BCRA_API_BASE_URL = 'https://api.bcra.gob.ar/estadisticascambiarias/v1.0';

// Function to get all available currencies
export const getDivisas = async (): Promise<Divisa[]> => {
  try {
    const response = await axios.get<{ status: number; results: Divisa[] }>(
      `${BCRA_API_BASE_URL}/Maestros/Divisas`
    );
    return response.data.results;
  } catch (error) {
    console.error('Error fetching currencies:', error);
    throw error;
  }
};

// Function to get exchange rates for a specific date
export const getCotizacionesByDate = async (fecha: string): Promise<CotizacionesFecha> => {
  try {
    const response = await axios.get<{ status: number; results: CotizacionesFecha }>(
      `${BCRA_API_BASE_URL}/Cotizaciones`,
      {
        params: { fecha }
      }
    );
    return response.data.results;
  } catch (error) {
    console.error('Error fetching exchange rates for date:', error);
    throw error;
  }
};

// Function to get exchange rates for a currency in a date range
export const getCotizacionesByCurrency = async (
  codMoneda: string,
  fechaDesde: string,
  fechaHasta: string,
  limit: number = 100,
  offset: number = 0
): Promise<CotizacionesResponse> => {
  try {
    const response = await axios.get<CotizacionesResponse>(
      `${BCRA_API_BASE_URL}/Cotizaciones/${codMoneda}`,
      {
        params: {
          fechaDesde,
          fechaHasta,
          limit,
          offset
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching exchange rates for currency:', error);
    throw error;
  }
};

// Helper function to format date for BCRA API (YYYY-MM-DD)
export const formatDateForBCRA = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Function to get today's exchange rates
export const getTodayExchangeRates = async (): Promise<CotizacionesFecha> => {
  const today = formatDateForBCRA(new Date());
  return getCotizacionesByDate(today);
}; 