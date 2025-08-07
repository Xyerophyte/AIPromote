# Enhanced Form Components with Micro-Interactions

This guide covers the enhanced form components with micro-interactions, animations, and improved user experience features.

## Components Overview

### 1. Input Component (`input.tsx`)

Enhanced input field with focus animations, floating labels, and validation states.

#### Features
- **Focus animations** with border glow effects
- **Floating labels** that animate on focus/blur
- **Validation states** with success/error indicators
- **Loading states** with spinner animations
- **Hover effects** for better interactivity

#### Props
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string          // Error message to display
  label?: string          // Input label
  floatingLabel?: boolean // Enable floating label animation
  success?: boolean       // Show success state
  loading?: boolean       // Show loading spinner
}
```

#### Usage Examples
```jsx
// Standard input with validation
<Input
  label="Email"
  type="email"
  error={errors.email}
  success={isEmailValid}
/>

// Floating label input
<Input
  floatingLabel
  label="Company Name"
  placeholder="Enter your company name"
/>

// Loading state
<Input
  loading
  label="Processing..."
  disabled
/>
```

### 2. Textarea Component (`textarea.tsx`)

Enhanced textarea with character counting, floating labels, and validation feedback.

#### Features
- **Character count** with visual warnings
- **Floating label** animations
- **Auto-resize** functionality (optional)
- **Validation states** with animated feedback
- **Loading states**

#### Props
```typescript
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  label?: string
  floatingLabel?: boolean
  success?: boolean | string
  loading?: boolean
  showCharCount?: boolean  // Show character counter
  maxLength?: number       // Maximum character limit
}
```

#### Usage Examples
```jsx
// Textarea with character count
<Textarea
  label="Message"
  maxLength={500}
  showCharCount
  placeholder="Enter your message..."
/>

// Floating label textarea
<Textarea
  floatingLabel
  label="Description"
  rows={4}
/>
```

### 3. Button Component (`button.tsx`)

Enhanced button with loading states, micro-interactions, and multiple variants.

#### Features
- **Loading states** with spinner and text
- **Hover/active animations** with scale effects
- **Icon support** (left and right icons)
- **Multiple variants** including success
- **Smooth transitions**

#### Props
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success"
  size?: "default" | "sm" | "lg" | "icon"
  loading?: boolean
  loadingText?: string     // Text to show during loading
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}
```

#### Usage Examples
```jsx
// Loading button
<Button loading loadingText="Saving...">
  Save Changes
</Button>

// Button with icons
<Button leftIcon={<SaveIcon />} rightIcon={<ArrowIcon />}>
  Save and Continue
</Button>

// Different variants
<Button variant="success">Success</Button>
<Button variant="destructive">Delete</Button>
```

### 4. Select Component (`select.tsx`)

Enhanced select with validation states and smooth animations.

#### Features
- **Chevron rotation** animation on open/close
- **Validation states** with colored borders
- **Smooth dropdown** animations
- **Focus glow effects**

#### Props
```typescript
interface SelectTriggerProps {
  error?: boolean    // Show error state
  success?: boolean  // Show success state
}
```

#### Usage Examples
```jsx
<Select>
  <SelectTrigger error={hasError} success={isValid}>
    <SelectValue placeholder="Choose option..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### 5. Checkbox Component (`checkbox.tsx`)

Enhanced checkbox with micro-interactions and validation states.

#### Features
- **Scale animations** on hover and click
- **Smooth check** animation with zoom-in effect
- **Validation states** with colored borders
- **Enhanced focus** states

#### Props
```typescript
interface CheckboxProps {
  error?: boolean
  success?: boolean
}
```

#### Usage Examples
```jsx
<Checkbox 
  error={hasError}
  success={isValid}
  onCheckedChange={handleChange}
/>
```

## Loading States and Skeletons

### FormSkeleton Component (`form-skeleton.tsx`)

Comprehensive skeleton loading states for forms.

#### Available Components
- `FormSkeleton` - Complete form skeleton
- `InputSkeleton` - Individual input skeleton
- `TextareaSkeleton` - Textarea skeleton
- `SelectSkeleton` - Select dropdown skeleton
- `CheckboxSkeleton` - Checkbox group skeleton
- `StaggeredFormSkeleton` - Animated staggered loading

#### Usage Examples
```jsx
// Complete form skeleton
<FormSkeleton fields={5} variant="detailed" />

// Individual field skeletons
<InputSkeleton hasLabel hasError />
<TextareaSkeleton rows={4} hasLabel />
<CheckboxSkeleton count={3} hasLabel />
```

## Message Components

### FormMessage Component (`form-message.tsx`)

Animated message components for form feedback.

#### Available Components
- `FormMessage` - Base message component
- `FormSuccess` - Success message
- `FormError` - Error message
- `FormWarning` - Warning message
- `FormInfo` - Info message

#### Features
- **Slide-in animations**
- **Dismissible** with fade-out
- **Icon integration**
- **Multiple variants**

#### Usage Examples
```jsx
<FormSuccess dismissible>
  Form submitted successfully!
</FormSuccess>

<FormError title="Validation Error">
  Please fix the errors below.
</FormError>

<FormWarning title="Important">
  This action cannot be undone.
</FormWarning>
```

## Animations and Effects

### CSS Classes Available

#### Focus Effects
- `focus:shadow-glow` - Adds glowing border effect
- `focus:[--glow-color:rgba(59,130,246,0.25)]` - Custom glow color

#### Micro-interactions
- `hover:scale-[1.02]` - Subtle hover scale
- `active:scale-95` - Click scale down
- `animate-slide-up` - Slide up animation
- `animate-fade-in` - Fade in animation

#### Form-specific Animations
- `animate-label-float` - Floating label animation
- `animate-form-shake` - Error shake animation
- `animate-validation-slide-in` - Validation message slide-in

## Best Practices

### 1. Validation States
Always provide clear visual feedback for form states:
```jsx
<Input
  error={errors.email}
  success={!errors.email && email.length > 0}
/>
```

### 2. Loading States
Use loading states during async operations:
```jsx
<Button loading={isSubmitting} loadingText="Saving...">
  Submit Form
</Button>
```

### 3. Character Limits
Show character counts for long text inputs:
```jsx
<Textarea
  maxLength={500}
  showCharCount
  placeholder="Enter description..."
/>
```

### 4. Accessibility
Always provide proper labels and ARIA attributes:
```jsx
<Input
  label="Email Address *"
  type="email"
  required
  aria-describedby="email-error"
/>
```

### 5. Progressive Enhancement
Use skeleton screens for better perceived performance:
```jsx
{loading ? (
  <FormSkeleton fields={3} />
) : (
  <ActualForm />
)}
```

## Demo Component

Use the `FormDemo` component to see all features in action:

```jsx
import { FormDemo } from '@/components/ui/form-demo'

// Interactive demo with all states
<FormDemo />

// Skeleton loading demo
<FormDemo showSkeletonDemo />
```

## Performance Considerations

1. **CSS-in-JS**: All animations use CSS classes for better performance
2. **Transform animations**: Use transform instead of changing layout properties
3. **Will-change property**: Applied to frequently animated elements
4. **Debounced validation**: Implement debouncing for real-time validation

## Browser Support

All animations and effects are supported in:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Fallbacks are provided for older browsers using `@supports` queries.
