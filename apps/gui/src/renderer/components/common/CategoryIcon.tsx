import { Bot, Database, Search, Zap } from 'lucide-react';

export const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'research':
      return <Search className="w-4 h-4" />;
    case 'development':
      return <Bot className="w-4 h-4" />;
    case 'creative':
      return <Zap className="w-4 h-4" />;
    case 'analytics':
      return <Database className="w-4 h-4" />;
    default:
      return <Bot className="w-4 h-4" />;
  }
};
