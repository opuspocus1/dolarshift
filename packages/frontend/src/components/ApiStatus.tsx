import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const ApiStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch('https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Maestros/Divisas');
        setIsOnline(response.ok);
      } catch (error) {
        setIsOnline(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkApiStatus();
    const interval = setInterval(checkApiStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm text-gray-600 dark:text-gray-300">
          API BCRA {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>
  );
};

export default ApiStatus; 