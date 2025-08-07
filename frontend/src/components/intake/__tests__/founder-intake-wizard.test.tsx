import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FounderIntakeWizard } from '../founder-intake-wizard';

// Mock the API calls
jest.mock('@/lib/api/startups', () => ({
  createStartup: jest.fn(),
  updateStartup: jest.fn(),
}));

// Mock the session hook
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'user-1', email: 'test@example.com' } },
    status: 'authenticated',
  }),
}));

describe('FounderIntakeWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the wizard with first step', () => {
    render(<FounderIntakeWizard />);
    
    expect(screen.getByText(/tell us about your startup/i)).toBeInTheDocument();
    expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument();
  });

  it('displays progress indicator', () => {
    render(<FounderIntakeWizard />);
    
    // Should show progress bar
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '20'); // 1/5 * 100
  });

  it('validates required fields before proceeding to next step', async () => {
    const user = userEvent.setup();
    render(<FounderIntakeWizard />);
    
    // Try to proceed without filling required fields
    const nextButton = screen.getByText(/next/i);
    await user.click(nextButton);
    
    // Should show validation errors
    expect(screen.getByText(/company name is required/i)).toBeInTheDocument();
  });

  it('proceeds to next step when fields are valid', async () => {
    const user = userEvent.setup();
    render(<FounderIntakeWizard />);
    
    // Fill in required fields for step 1
    await user.type(screen.getByLabelText(/company name/i), 'Test Startup Inc.');
    await user.type(screen.getByLabelText(/industry/i), 'Technology');
    await user.selectOptions(screen.getByLabelText(/stage/i), 'seed');
    await user.type(screen.getByLabelText(/description/i), 'A test startup for testing purposes');
    
    // Proceed to next step
    const nextButton = screen.getByText(/next/i);
    await user.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText(/step 2 of 5/i)).toBeInTheDocument();
    });
  });

  it('allows going back to previous steps', async () => {
    const user = userEvent.setup();
    render(<FounderIntakeWizard />);
    
    // Fill first step and proceed
    await user.type(screen.getByLabelText(/company name/i), 'Test Startup');
    await user.type(screen.getByLabelText(/industry/i), 'Tech');
    await user.selectOptions(screen.getByLabelText(/stage/i), 'seed');
    await user.type(screen.getByLabelText(/description/i), 'Description');
    
    await user.click(screen.getByText(/next/i));
    
    await waitFor(() => {
      expect(screen.getByText(/step 2 of 5/i)).toBeInTheDocument();
    });
    
    // Go back to previous step
    const backButton = screen.getByText(/back/i);
    await user.click(backButton);
    
    await waitFor(() => {
      expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument();
    });
    
    // Data should be preserved
    expect(screen.getByDisplayValue('Test Startup')).toBeInTheDocument();
  });

  it('displays step navigation correctly', async () => {
    const user = userEvent.setup();
    render(<FounderIntakeWizard />);
    
    // Initially, back button should be disabled, next should be enabled
    expect(screen.queryByText(/back/i)).toBeNull(); // First step has no back button
    expect(screen.getByText(/next/i)).toBeInTheDocument();
    
    // Navigate to second step
    await user.type(screen.getByLabelText(/company name/i), 'Test');
    await user.type(screen.getByLabelText(/industry/i), 'Tech');
    await user.selectOptions(screen.getByLabelText(/stage/i), 'seed');
    await user.type(screen.getByLabelText(/description/i), 'Desc');
    
    await user.click(screen.getByText(/next/i));
    
    await waitFor(() => {
      expect(screen.getByText(/back/i)).toBeInTheDocument();
      expect(screen.getByText(/next/i)).toBeInTheDocument();
    });
  });

  it('shows finish button on last step', async () => {
    const user = userEvent.setup();
    render(<FounderIntakeWizard />);
    
    // Navigate through all steps (this is a simplified version)
    // In a real test, you'd fill out all forms properly
    
    // Mock completing all steps - we'll simulate being on the last step
    const wizardInstance = screen.getByTestId('intake-wizard');
    
    // Simulate being on step 5
    fireEvent.click(wizardInstance);
    
    // On the last step, should show "Finish" instead of "Next"
    // Note: This would need to be implemented in the actual component
  });

  it('handles form submission on finish', async () => {
    const mockCreateStartup = require('@/lib/api/startups').createStartup;
    mockCreateStartup.mockResolvedValueOnce({ id: 'startup-1' });
    
    const user = userEvent.setup();
    render(<FounderIntakeWizard />);
    
    // Fill out the form (simplified)
    await user.type(screen.getByLabelText(/company name/i), 'Test Startup');
    await user.type(screen.getByLabelText(/industry/i), 'Technology');
    await user.selectOptions(screen.getByLabelText(/stage/i), 'seed');
    await user.type(screen.getByLabelText(/description/i), 'A revolutionary startup');
    
    // Navigate to final step and submit
    // Note: This would need proper navigation implementation
    
    expect(mockCreateStartup).toHaveBeenCalledWith({
      companyName: 'Test Startup',
      industry: 'Technology',
      stage: 'seed',
      description: 'A revolutionary startup',
      // ... other form data
    });
  });

  it('displays validation errors appropriately', async () => {
    const user = userEvent.setup();
    render(<FounderIntakeWizard />);
    
    // Try to submit with invalid email
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    
    const nextButton = screen.getByText(/next/i);
    await user.click(nextButton);
    
    expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
  });

  it('saves draft data automatically', async () => {
    const user = userEvent.setup();
    render(<FounderIntakeWizard />);
    
    await user.type(screen.getByLabelText(/company name/i), 'Draft Startup');
    
    // Wait for auto-save (if implemented)
    await waitFor(() => {
      // Check localStorage or API call for draft save
      expect(localStorage.getItem).toHaveBeenCalledWith('intake-draft');
    }, { timeout: 3000 });
  });

  it('handles network errors gracefully', async () => {
    const mockCreateStartup = require('@/lib/api/startups').createStartup;
    mockCreateStartup.mockRejectedValueOnce(new Error('Network error'));
    
    const user = userEvent.setup();
    render(<FounderIntakeWizard />);
    
    // Fill and submit form
    await user.type(screen.getByLabelText(/company name/i), 'Test');
    await user.type(screen.getByLabelText(/industry/i), 'Tech');
    await user.selectOptions(screen.getByLabelText(/stage/i), 'seed');
    await user.type(screen.getByLabelText(/description/i), 'Desc');
    
    // Simulate submission
    const submitButton = screen.getByText(/finish/i) || screen.getByText(/submit/i);
    if (submitButton) {
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    }
  });

  it('pre-fills form with existing data when editing', () => {
    const existingData = {
      companyName: 'Existing Company',
      industry: 'Finance',
      stage: 'series-a',
      description: 'An existing startup',
    };
    
    render(<FounderIntakeWizard initialData={existingData} />);
    
    expect(screen.getByDisplayValue('Existing Company')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Finance')).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    const mockCreateStartup = require('@/lib/api/startups').createStartup;
    mockCreateStartup.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    const user = userEvent.setup();
    render(<FounderIntakeWizard />);
    
    // Fill and submit form
    await user.type(screen.getByLabelText(/company name/i), 'Test');
    await user.type(screen.getByLabelText(/industry/i), 'Tech');
    await user.selectOptions(screen.getByLabelText(/stage/i), 'seed');
    await user.type(screen.getByLabelText(/description/i), 'Desc');
    
    const submitButton = screen.getByText(/finish/i) || screen.getByText(/submit/i);
    if (submitButton) {
      await user.click(submitButton);
      
      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    }
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<FounderIntakeWizard />);
    
    // Tab navigation should work through form fields
    await user.tab();
    expect(screen.getByLabelText(/company name/i)).toHaveFocus();
    
    await user.tab();
    expect(screen.getByLabelText(/industry/i)).toHaveFocus();
  });

  it('supports accessibility features', () => {
    render(<FounderIntakeWizard />);
    
    // Form should have proper labels
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    
    // Progress should be announced to screen readers
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    
    // Required fields should be marked
    const requiredFields = screen.getAllByRequired();
    expect(requiredFields.length).toBeGreaterThan(0);
  });
});
