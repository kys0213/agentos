import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardCard } from '../DashboardCard';

function DummyIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg data-testid="icon" {...props} />;
}

describe('DashboardCard', () => {
  it('renders title and value', () => {
    render(
      <DashboardCard
        title="Agents"
        value={3}
        change="1 active"
        icon={DummyIcon}
        color="text-green-600"
      />
    );
    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1 active')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('shows retry and calls handler', () => {
    const onRetry = vi.fn();
    render(
      <DashboardCard
        title="Models"
        value={'—'}
        change={'Error • Retry'}
        icon={DummyIcon}
        onRetry={onRetry}
      />
    );
    const btn = screen.getByRole('button', { name: /retry-models/i });
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
