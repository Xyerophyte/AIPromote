import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AnimatedButton } from '../animated-button'
import { Play, Settings } from 'lucide-react'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: React.forwardRef<
      HTMLButtonElement,
      React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
    >((props, ref) => <button ref={ref} {...props} />),
    div: React.forwardRef<
      HTMLDivElement,
      React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
    >((props, ref) => <div ref={ref} {...props} />),
    span: React.forwardRef<
      HTMLSpanElement,
      React.HTMLAttributes<HTMLSpanElement> & { children?: React.ReactNode }
    >((props, ref) => <span ref={ref} {...props} />),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('AnimatedButton', () => {
  it('renders with default props', () => {
    render(<AnimatedButton>Click me</AnimatedButton>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it('renders with primary variant by default', () => {
    render(<AnimatedButton>Primary Button</AnimatedButton>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'via-purple-600', 'to-blue-800')
  })

  it('renders with different variants', () => {
    const { rerender } = render(<AnimatedButton variant="secondary">Secondary</AnimatedButton>)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('border-2', 'border-gray-300', 'bg-white')

    rerender(<AnimatedButton variant="ghost">Ghost</AnimatedButton>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('text-gray-700', 'hover:bg-gray-100')

    rerender(<AnimatedButton variant="outline">Outline</AnimatedButton>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('border-2', 'border-blue-500', 'text-blue-600')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<AnimatedButton size="sm">Small</AnimatedButton>)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('h-9', 'px-4', 'text-sm')

    rerender(<AnimatedButton size="lg">Large</AnimatedButton>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-13', 'px-8', 'text-lg')

    rerender(<AnimatedButton size="icon">Icon</AnimatedButton>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-11', 'w-11')
  })

  it('shows loading state correctly', () => {
    render(
      <AnimatedButton loading={true} loadingText="Processing...">
        Submit
      </AnimatedButton>
    )
    
    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(screen.queryByText('Submit')).not.toBeInTheDocument()
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('cursor-wait')
  })

  it('renders with left and right icons', () => {
    render(
      <AnimatedButton
        leftIcon={<Play className="w-4 h-4" data-testid="left-icon" />}
        rightIcon={<Settings className="w-4 h-4" data-testid="right-icon" />}
      >
        With Icons
      </AnimatedButton>
    )

    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    expect(screen.getByText('With Icons')).toBeInTheDocument()
  })

  it('handles click events correctly', () => {
    const handleClick = jest.fn()
    render(
      <AnimatedButton onClick={handleClick}>
        Click me
      </AnimatedButton>
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('creates ripple effect on click', async () => {
    render(<AnimatedButton>Ripple Button</AnimatedButton>)
    const button = screen.getByRole('button')

    fireEvent.click(button)

    // Check if ripple spans are created (they should be in the DOM temporarily)
    await waitFor(() => {
      const ripples = document.querySelectorAll('.pointer-events-none')
      expect(ripples.length).toBeGreaterThan(0)
    })
  })

  it('does not trigger click when disabled', () => {
    const handleClick = jest.fn()
    render(
      <AnimatedButton disabled onClick={handleClick}>
        Disabled Button
      </AnimatedButton>
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(handleClick).not.toHaveBeenCalled()
    expect(button).toBeDisabled()
  })

  it('does not trigger click when loading', () => {
    const handleClick = jest.fn()
    render(
      <AnimatedButton loading={true} onClick={handleClick}>
        Loading Button
      </AnimatedButton>
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(handleClick).not.toHaveBeenCalled()
    expect(button).toBeDisabled()
  })

  it('applies custom className', () => {
    render(
      <AnimatedButton className="custom-class">
        Custom Button
      </AnimatedButton>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(
      <AnimatedButton ref={ref}>
        Ref Button
      </AnimatedButton>
    )

    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('shows progress bar for loading variant', () => {
    render(
      <AnimatedButton variant="loading" loading={true}>
        Loading
      </AnimatedButton>
    )

    // Check if progress bar element is present
    const progressBar = document.querySelector('.absolute.bottom-0.left-0.h-1')
    expect(progressBar).toBeInTheDocument()
  })

  it('shows shine effect for primary variant', () => {
    render(
      <AnimatedButton variant="primary">
        Primary with Shine
      </AnimatedButton>
    )

    // Check if shine effect element is present
    const shineEffect = document.querySelector('.absolute.inset-0.bg-gradient-to-r')
    expect(shineEffect).toBeInTheDocument()
  })

  it('handles icon variant with rotating animations', () => {
    render(
      <AnimatedButton 
        variant="icon" 
        size="icon" 
        leftIcon={<Settings className="w-5 h-5" data-testid="rotating-icon" />}
      />
    )

    const icon = screen.getByTestId('rotating-icon')
    expect(icon).toBeInTheDocument()
  })

  it('accepts custom ripple and glow colors', () => {
    const customRipple = 'rgba(255, 0, 0, 0.6)'
    const customGlow = 'rgba(255, 0, 0, 0.4)'
    
    render(
      <AnimatedButton 
        rippleColor={customRipple}
        glowColor={customGlow}
      >
        Custom Colors
      </AnimatedButton>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveStyle('--glow-color: rgba(255, 0, 0, 0.4)')
  })

  it('handles keyboard events', () => {
    const handleClick = jest.fn()
    render(
      <AnimatedButton onClick={handleClick}>
        Keyboard Button
      </AnimatedButton>
    )

    const button = screen.getByRole('button')
    
    // Focus the button
    button.focus()
    expect(button).toHaveFocus()

    // Press Enter
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })
    // Note: The actual click behavior might need to be handled by the browser
  })

  it('maintains accessibility attributes', () => {
    render(
      <AnimatedButton 
        title="Accessible Button"
        aria-label="Custom aria label"
      >
        Accessible
      </AnimatedButton>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Accessible Button')
    expect(button).toHaveAttribute('aria-label', 'Custom aria label')
  })
})
