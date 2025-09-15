import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardCard } from '../DashboardCard';

function DummyIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg data-testid="icon" {...props} />;
}

describe('DashboardCard (more cases)', () => {
  it('does not show retry when change has no Retry text', () => {
    render(<DashboardCard title="Presets" value={5} change={'2 in use'} icon={DummyIcon} />);
    expect(screen.queryByRole('button', { name: /retry/i })).toBeNull();
  });

  it('applies icon color class when provided', () => {
    render(
      <DashboardCard
        title="Models"
        value={2}
        change={''}
        icon={DummyIcon}
        color="text-purple-600"
      />
    );
    const icon = screen.getByTestId('icon');
    expect(icon.getAttribute('class') ?? '').toContain('text-purple-600');
  });
});
