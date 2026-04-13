import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

export function renderWithRouter(ui, { route = '/', ...opts } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>,
    opts
  );
}
