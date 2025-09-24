import type { ComponentProps } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { CheckCircle, ArrowLeft } from 'lucide-react';

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
  isStepEnabled?: (stepId: string) => boolean;
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
  isStepEnabled,
  actionProps,
}: StepperTabsProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  const isStepCompleted = (stepId: string) => {
    const stepIndex = steps.findIndex((step) => step.id === stepId);
    return stepIndex < currentIndex;
  };

  const isStepActive = (stepId: string) => stepId === currentStep;

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
              <TabsTrigger
                key={step.id}
                value={step.id}
                className="relative"
                disabled={isStepEnabled ? !isStepEnabled(step.id) : false}
              >
                <div className="flex items-center gap-2">
                  {isStepCompleted(step.id) ? (
                    <CheckCircle className="w-4 h-4 text-status-success" />
                  ) : isStepActive(step.id) ? (
                    <div className="w-4 h-4 rounded-full bg-current" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                  )}
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

export function StepperTabContent({ stepId, children }: { stepId: string; children: ReactNode }) {
  return (
    <TabsContent value={stepId} className="h-full">
      {children}
    </TabsContent>
  );
}

export default StepperTabs;
