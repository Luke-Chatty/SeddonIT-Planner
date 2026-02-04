import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmModal } from '@/components/UI/ConfirmModal';

describe('ConfirmModal', () => {
  test('renders nothing when open is false', () => {
    const { container } = render(
      <ConfirmModal
        open={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm?"
        message="Are you sure?"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders title and message when open', () => {
    render(
      <ConfirmModal
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete plan?"
        message="This cannot be undone."
      />
    );
    expect(screen.getByRole('heading', { name: /delete plan\?/i })).toBeInTheDocument();
    expect(screen.getByText(/this cannot be undone\./i)).toBeInTheDocument();
  });

  test('calls onConfirm when Confirm is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmModal
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Confirm?"
        message="Sure?"
        confirmLabel="Yes"
      />
    );
    await user.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Confirm?"
        message="Sure?"
        cancelLabel="No"
      />
    );
    await user.click(screen.getByRole('button', { name: /^no$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
