import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  Bot,
  Plus,
  Users,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Settings,
  BookOpen,
  Brain,
} from 'lucide-react';

interface EmptyStateProps {
  type: 'agents' | 'presets' | 'models' | 'tools' | 'chat';
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  onAction,
  secondaryAction,
}: EmptyStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'agents':
        return <Bot className="w-12 h-12 text-muted-foreground" />;
      case 'presets':
        return <Brain className="w-12 h-12 text-muted-foreground" />;
      case 'models':
        return <Sparkles className="w-12 h-12 text-muted-foreground" />;
      case 'tools':
        return <Settings className="w-12 h-12 text-muted-foreground" />;
      case 'chat':
        return <MessageSquare className="w-12 h-12 text-muted-foreground" />;
      default:
        return <Plus className="w-12 h-12 text-muted-foreground" />;
    }
  };

  const getIllustration = () => {
    switch (type) {
      case 'agents':
        return (
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
        );
      case 'presets':
        return (
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
        );
      case 'chat':
        return (
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center">
              <Bot className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
            {getIcon()}
          </div>
        );
    }
  };

  return (
    <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50 hover:bg-gray-50/80 transition-colors duration-200">
      <div className="p-12 text-center">
        {getIllustration()}

        <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>

        <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={onAction} size="lg" className="gap-2 px-6">
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Button>

          {secondaryAction && (
            <Button
              variant="outline"
              size="lg"
              onClick={secondaryAction.onClick}
              className="gap-2 px-6"
            >
              <ArrowRight className="w-4 h-4" />
              {secondaryAction.label}
            </Button>
          )}
        </div>

        {/* Additional help text for agents */}
        {type === 'agents' && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Quick Start:</strong> Create your first agent to enable AI-powered
              conversations and automation
            </p>
          </div>
        )}

        {/* Additional help text for presets */}
        {type === 'presets' && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-muted-foreground">
              🧠 <strong>Tip:</strong> Presets define your AI agent's behavior, knowledge, and
              capabilities
            </p>
          </div>
        )}

        {/* Chat-specific onboarding */}
        {type === 'chat' && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Active agents respond automatically</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-blue-600 font-mono">@</span>
                <span>Mention to call specific agents</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
