# Mercado Argy

Aplicación para seguimiento de cotizaciones del dólar y otras monedas utilizando datos del BCRA.

## Estructura del Proyecto

```
dolarshift/
├── packages/
│   ├── frontend/     # Aplicación React
│   └── backend/      # API Express
```

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/dolarshift.git
cd dolarshift
```

2. Instalar dependencias del frontend:
```bash
cd packages/frontend
npm install
```

3. Instalar dependencias del backend:
```bash
cd ../backend
npm install
```

## Desarrollo

### Frontend
```bash
cd packages/frontend
npm run dev
```

### Backend
```bash
cd packages/backend
npm run dev
```

## Despliegue

### Frontend (Netlify)
El frontend se despliega automáticamente en Netlify cuando se hace push a la rama main.

### Backend (Render)
El backend se despliega en Render. Los cambios en la rama main se despliegan automáticamente.

## Tecnologías Utilizadas

### Frontend
- React
- TypeScript
- Vite
- TailwindCSS
- Recharts

### Backend
- Node.js
- Express
- TypeScript
- Axios
- Node-Cache

## API Endpoints

### Monedas
- GET `/api/exchange/currencies` - Lista todas las monedas disponibles

### Cotizaciones
- GET `/api/exchange/rates/:date` - Obtiene cotizaciones para una fecha específica
- GET `/api/exchange/rates/:currency/:startDate/:endDate` - Obtiene cotizaciones para una moneda en un rango de fechas

## Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request 