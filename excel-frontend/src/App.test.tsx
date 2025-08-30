import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Excel Data Manipulator title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Excel Data Manipulator/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders upload section', () => {
  render(<App />);
  const uploadElement = screen.getByText(/Upload Excel File/i);
  expect(uploadElement).toBeInTheDocument();
});

test('renders feature highlights', () => {
  render(<App />);
  const textOpsElement = screen.getByText(/Text Operations/i);
  const mathOpsElement = screen.getByText(/Mathematical Functions/i);
  const advancedOpsElement = screen.getByText(/Advanced Analysis/i);
  
  expect(textOpsElement).toBeInTheDocument();
  expect(mathOpsElement).toBeInTheDocument();
  expect(advancedOpsElement).toBeInTheDocument();
});
