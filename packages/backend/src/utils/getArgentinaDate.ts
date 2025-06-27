import axios from 'axios';

// Función para obtener la fecha real desde múltiples fuentes
async function getRealDate(): Promise<Date> {
  const apis = [
    'https://worldtimeapi.org/api/timezone/America/Argentina/Buenos_Aires',
    'https://worldtimeapi.org/api/timezone/UTC',
    'https://worldtimeapi.org/api/ip'
  ];

  for (const apiUrl of apis) {
    try {
      console.log(`[getRealDate] Trying API: ${apiUrl}`);
      const response = await axios.get(apiUrl, {
        timeout: 3000 // 3 segundos de timeout
      });
      
      const apiDate = new Date(response.data.datetime);
      const now = new Date();
      
      // Validar que la fecha de la API sea razonable (no más de 1 año de diferencia)
      const timeDiff = Math.abs(apiDate.getTime() - now.getTime());
      const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
      
      if (timeDiff > oneYearInMs) {
        console.warn(`[getRealDate] API ${apiUrl} returned date too far from now: ${apiDate.toISOString()}`);
        continue; // Intentar con la siguiente API
      }
      
      // Validar que la fecha no sea futura (más de 1 día en el futuro)
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      if (apiDate > oneDayFromNow) {
        console.warn(`[getRealDate] API ${apiUrl} returned future date: ${apiDate.toISOString()}`);
        continue; // Intentar con la siguiente API
      }
      
      console.log(`[getRealDate] Successfully got date from ${apiUrl}: ${apiDate.toISOString()}`);
      return apiDate;
    } catch (error) {
      console.warn(`[getRealDate] Failed to get date from ${apiUrl}:`, error.message);
      continue; // Intentar con la siguiente API
    }
  }
  
  // Si todas las APIs fallan, usar una fecha hardcodeada como último recurso
  console.warn('[getRealDate] All APIs failed, using hardcoded fallback date');
  return new Date('2024-12-27T14:27:46.000Z'); // Fecha actual real
}

export async function getArgentinaDate(): Promise<Date> {
  try {
    return await getRealDate();
  } catch (error) {
    console.warn('[getArgentinaDate] Failed to get real date, using hardcoded fallback:', error);
    // Fallback a una fecha conocida válida
    return new Date('2024-12-27T14:27:46.000Z');
  }
}

// Función auxiliar para obtener una fecha válida para las consultas
export async function getValidDateForQueries(): Promise<Date> {
  const realDate = await getArgentinaDate();
  console.log(`[getValidDateForQueries] Using date: ${realDate.toISOString()}`);
  return realDate;
} 