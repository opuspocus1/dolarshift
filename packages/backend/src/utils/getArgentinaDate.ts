import axios from 'axios';

export async function getArgentinaDate(): Promise<Date> {
  try {
    const response = await axios.get('https://worldtimeapi.org/api/timezone/America/Argentina/Buenos_Aires');
    return new Date(response.data.datetime);
  } catch (error) {
    // Si falla, usar la fecha local del sistema como fallback
    return new Date();
  }
} 