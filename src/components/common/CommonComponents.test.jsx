import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Accordion } from './Accordion';
import Badge from './Badge';
import Modal from './Modal';
import Card from './Card';
import Input from './Input';
import Breadcrumb from '../layout/Breadcrumb';

describe('Common components', () => {
  it('Accordion opens first item and toggles others', () => {
    render(
      <Accordion
        items={[
          { title: 'A', content: 'Content A' },
          { title: 'B', content: 'Content B' },
        ]}
      />,
    );

    expect(screen.getByText('Content A')).toBeInTheDocument();
    expect(screen.queryByText('Content B')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(screen.getByText('Content B')).toBeInTheDocument();
  });

  it('Badge renders variants', () => {
    const { rerender } = render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toHaveClass('bg-[#E8F0E8]');

    rerender(<Badge variant="outline">New</Badge>);
    expect(screen.getByText('New')).toHaveClass('border');
  });

  it('Card supports disabling padding', () => {
    const { rerender, container } = render(<Card>Body</Card>);
    expect(container.firstChild).toHaveClass('p-6');

    rerender(<Card padding={false}>Body</Card>);
    expect(container.firstChild).not.toHaveClass('p-6');
  });

  it('Input renders with and without optional props', () => {
    const { rerender } = render(<Input label="Email" error="Required" value="" onChange={() => {}} />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();

    rerender(<Input placeholder="No label" value="" onChange={() => {}} />);
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
    expect(screen.queryByText('Required')).not.toBeInTheDocument();
  });

  it('Modal closes on escape and backdrop click', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen={false} onClose={onClose} title="T">
        Body
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(
      <Modal isOpen onClose={onClose} title="Title">
        Body
      </Modal>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    // Backdrop click
    const backdrop = screen.getByRole('dialog').parentElement.querySelector('[aria-hidden="true"]');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('Modal renders footer content when provided', () => {
    render(
      <Modal isOpen onClose={() => {}} title="Title" footer={<button type="button">Save</button>}>
        Body
      </Modal>,
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('Breadcrumb renders links and current item', () => {
    render(
      <MemoryRouter>
        <Breadcrumb items={[{ to: '/', label: 'Home' }, { label: 'Checkout' }]} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByText('Checkout')).toBeInTheDocument();
  });
});

