import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

/**
 * @jest-environment jsdom
 * @testenv-browser
 */

/**
 * Test suite for the main App component.
 * This is a placeholder test from Create React App.
 */
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
