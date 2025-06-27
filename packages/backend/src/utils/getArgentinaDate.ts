import axios from 'axios';

export async function getArgentinaDate(): Promise<Date> {
  try {
    // Intentar obtener la fecha de worldtimeapi.org
    const response = await axios.get('https://worldtimeapi.org/api/timezone/America/Argentina/Buenos_Aires', {
      timeout: 5000 // 5 segundos de timeout
    });
    
    const apiDate = new Date(response.data.datetime);
    const now = new Date();
    
    // Validar que la fecha de la API sea razonable (no más de 1 día de diferencia)
    const timeDiff = Math.abs(apiDate.getTime() - now.getTime());
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    if (timeDiff > oneDayInMs) {
      console.warn('[getArgentinaDate] API date seems incorrect, using local date');
      return now;
    }
    
    // Validar que la fecha no sea futura
    if (apiDate > now) {
      console.warn('[getArgentinaDate] API returned future date, using local date');
      return now;
    }
    
    return apiDate;
  } catch (error) {
    console.warn('[getArgentinaDate] Failed to get date from API, using local date:', error);
    // Si falla, usar la fecha local del sistema como fallback
    return new Date();
  }
}

// Función auxiliar para obtener una fecha válida para las consultas
export async function getValidDateForQueries(): Promise<Date> {
  const apiDate = await getArgentinaDate();
  const now = new Date();
  
  // Siempre usar la fecha más temprana entre la API y la fecha local
  // Esto evita fechas futuras
  return apiDate < now ? apiDate : now;
} 