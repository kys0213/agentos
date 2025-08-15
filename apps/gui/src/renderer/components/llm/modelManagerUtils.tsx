import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { JSX } from 'react';

export function getStatusColor(status: 'online' | 'offline' | 'error' | string): string {
  switch (status) {
    case 'online':
      return 'text-green-600';
    case 'offline':
      return 'text-gray-600';
    case 'error':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

export function getStatusIcon(status: 'online' | 'offline' | 'error' | string): JSX.Element {
  switch (status) {
    case 'online':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'offline':
      return <WifiOff className="w-4 h-4 text-gray-600" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    default:
      return <Wifi className="w-4 h-4 text-gray-600" />;
  }
}
