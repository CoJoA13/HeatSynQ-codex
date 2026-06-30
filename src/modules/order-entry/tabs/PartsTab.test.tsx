import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { sampleOrder } from '../../../data/seed';
import type { Order } from '../../../domain/types';
import { PartsTab } from './PartsTab';

function draftOrder(): Order {
  return {
    ...sampleOrder,
    containers: [
      {
        id: 'container-edit',
        type: 'Skid',
        count: 1,
        quantity: 0,
        grossWeight: 12.5,
        tareWeight: 0,
        containerId: '',
      },
    ],
    parts: [],
  };
}

describe('PartsTab', () => {
  it('allows users to clear numeric weight fields while editing', async () => {
    const user = userEvent.setup();
    const onOrderChange = vi.fn();

    function StatefulPartsTab() {
      const [order, setOrder] = useState<Order>(() => draftOrder());

      function handleOrderChange(nextOrder: Order) {
        onOrderChange(nextOrder);
        setOrder(nextOrder);
      }

      return <PartsTab order={order} onOrderChange={handleOrderChange} />;
    }

    render(<StatefulPartsTab />);

    await user.clear(screen.getByLabelText('Container 1 gross weight'));

    expect(screen.getByLabelText('Container 1 gross weight')).toHaveDisplayValue('');
    expect(onOrderChange).toHaveBeenCalledWith(expect.objectContaining({
      containers: [expect.objectContaining({ grossWeight: 0 })],
    }));
  });
});
