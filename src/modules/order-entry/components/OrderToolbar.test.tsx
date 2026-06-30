import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OrderToolbar } from './OrderToolbar';

const noop = () => undefined;

describe('OrderToolbar', () => {
  it('calls the print action when the ready order print button is clicked', async () => {
    const user = userEvent.setup();
    const onPrint = vi.fn();

    render(
      <OrderToolbar
        orderId="71951"
        readyToRelease
        onNew={noop}
        onSearch={noop}
        onCheck={noop}
        onSave={noop}
        onCancel={noop}
        onErase={noop}
        onAddNote={noop}
        onAddComment={noop}
        onPrint={onPrint}
      />,
    );

    await user.click(screen.getByRole('button', { name: /print traveler/i }));

    expect(onPrint).toHaveBeenCalledTimes(1);
  });
});
