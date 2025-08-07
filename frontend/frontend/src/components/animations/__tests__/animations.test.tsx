import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { 
  FadeIn, 
  SlideIn, 
  StaggerChildren, 
  AnimatedCard, 
  AnimatedCardContent,
  GlassContainer 
} from '../index'

// Mock framer-motion to avoid issues with animations in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}))

describe('Animation Components', () => {
  describe('FadeIn', () => {
    it('renders children correctly', () => {
      render(
        <FadeIn>
          <div>Fade in content</div>
        </FadeIn>
      )
      expect(screen.getByText('Fade in content')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <FadeIn className="custom-class">
          <div>Content</div>
        </FadeIn>
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('SlideIn', () => {
    it('renders with required direction prop', () => {
      render(
        <SlideIn direction="left">
          <div>Slide content</div>
        </SlideIn>
      )
      expect(screen.getByText('Slide content')).toBeInTheDocument()
    })

    it('handles all direction options', () => {
      const directions = ['left', 'right', 'up', 'down'] as const
      
      directions.forEach((direction) => {
        render(
          <SlideIn direction={direction}>
            <div>{direction} content</div>
          </SlideIn>
        )
        expect(screen.getByText(`${direction} content`)).toBeInTheDocument()
      })
    })
  })

  describe('StaggerChildren', () => {
    it('renders multiple children', () => {
      render(
        <StaggerChildren>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </StaggerChildren>
      )
      
      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child 2')).toBeInTheDocument()
      expect(screen.getByText('Child 3')).toBeInTheDocument()
    })

    it('handles different animation directions', () => {
      const directions = ['up', 'down', 'left', 'right', 'scale', 'fade'] as const
      
      directions.forEach((direction) => {
        render(
          <StaggerChildren direction={direction}>
            <div>Staggered content</div>
          </StaggerChildren>
        )
        expect(screen.getByText('Staggered content')).toBeInTheDocument()
      })
    })
  })

  describe('AnimatedCard', () => {
    it('renders card content correctly', () => {
      render(
        <AnimatedCard>
          <AnimatedCardContent>
            Card content here
          </AnimatedCardContent>
        </AnimatedCard>
      )
      expect(screen.getByText('Card content here')).toBeInTheDocument()
    })

    it('applies shadow intensity classes', () => {
      const { container } = render(
        <AnimatedCard shadowIntensity="xl">
          <div>Content</div>
        </AnimatedCard>
      )
      expect(container.firstChild).toHaveClass('shadow-xl')
    })
  })

  describe('GlassContainer', () => {
    it('renders glass container with content', () => {
      render(
        <GlassContainer>
          <div>Glass content</div>
        </GlassContainer>
      )
      expect(screen.getByText('Glass content')).toBeInTheDocument()
    })

    it('applies blur intensity classes', () => {
      const { container } = render(
        <GlassContainer blurIntensity="lg">
          <div>Content</div>
        </GlassContainer>
      )
      expect(container.firstChild).toHaveClass('backdrop-blur-lg')
    })

    it('applies border intensity classes', () => {
      const { container } = render(
        <GlassContainer borderIntensity="medium">
          <div>Content</div>
        </GlassContainer>
      )
      expect(container.firstChild).toHaveClass('border-white/20')
    })
  })

  describe('Component Integration', () => {
    it('allows nesting of animation components', () => {
      render(
        <FadeIn>
          <GlassContainer>
            <StaggerChildren>
              <AnimatedCard>
                <AnimatedCardContent>
                  Nested animation content
                </AnimatedCardContent>
              </AnimatedCard>
            </StaggerChildren>
          </GlassContainer>
        </FadeIn>
      )
      
      expect(screen.getByText('Nested animation content')).toBeInTheDocument()
    })
  })
})
