import type { ComponentProps, ReactNode } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { CheckCircle, ArrowLeft } from 'lucide-react';

/**
 * Shared stepper layout used by creation flows (agents, MCP tools, custom tools).
 *
 * The component renders a header with optional back button, badge, and primary action,
 * followed by a tabs-based step navigation. Consumers pass the individual step panes as
 * children wrapped in {@link StepperTabContent}. Step state is controlled via the
 * `currentStep` and `onStepChange` props – typically sourced from navigation hooks such as
 * `useAppNavigation`.
 */

export interface StepConfig {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface StepperTabsProps {
  steps: StepConfig[];
  currentStep: string;
  onStepChange: (stepId: string) => void;
  children: ReactNode;
  title?: string;
  description?: string;
  backLabel?: string;
  onBack?: () => void;
  actionLabel?: ReactNode;
  onAction?: () => void;
  actionDisabled?: boolean;
  badge?: {
    label: string;
    icon?: ReactNode;
  };
  actionProps?: Omit<ComponentProps<typeof Button>, 'children' | 'onClick' | 'disabled'>;
}

export function StepperTabs({
  steps,
  currentStep,
  onStepChange,
  children,
  title,
  description,
  backLabel = 'Back',
  onBack,
  actionLabel,
  onAction,
  actionDisabled = false,
  badge,
  actionProps,
}: StepperTabsProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  const isStepCompleted = (stepId: string) => {
    const stepIndex = steps.findIndex((step) => step.id === stepId);
    return stepIndex < currentIndex;
  };

  const isStepActive = (stepId: string) => stepId === currentStep;

  const renderIndicator = (stepId: string) => {
    if (isStepCompleted(stepId)) {
      return <CheckCircle className="w-4 h-4 text-status-success" />;
    }
    if (isStepActive(stepId)) {
      return <div className="w-4 h-4 rounded-full bg-current" />;
    }
    return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />;
  };

  return (
    <div className="h-full flex flex-col">
      {(title || onBack || onAction || badge) && (
        <div className="flex-shrink-0 p-6 border-b bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {backLabel}
                </Button>
              )}

              {title && (
                <>
                  <div className="w-px h-6 bg-border" />
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">{title}</h1>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {badge && (
                <Badge variant="outline" className="gap-2">
                  {badge.icon}
                  {badge.label}
                </Badge>
              )}
              {onAction && (
                <Button
                  onClick={onAction}
                  disabled={actionDisabled}
                  className="gap-2"
                  {...actionProps}
                >
                  {actionLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 p-6">
        <Tabs value={currentStep} onValueChange={onStepChange} className="h-full flex flex-col">
          <TabsList className="mb-6">
            {steps.map((step) => (
              <TabsTrigger key={step.id} value={step.id} className="relative">
                <div className="flex items-center gap-2">
                  {renderIndicator(step.id)}
                  {step.label}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 min-h-0">{children}</div>
        </Tabs>
      </div>
    </div>
  );
}

/**
 * Convenience wrapper that maps a step identifier to the underlying tab content.
 * Always wrap step panes rendered inside {@link StepperTabs} with this component.
 */
export function StepperTabContent({ stepId, children }: { stepId: string; children: ReactNode }) {
  return (
    <TabsContent value={stepId} className="h-full">
      {children}
    </TabsContent>
  );
}

export default StepperTabs;
