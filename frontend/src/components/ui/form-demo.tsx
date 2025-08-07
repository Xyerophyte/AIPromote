'use client'

import React, { useState } from 'react'
import { Input } from './input'
import { Textarea } from './textarea'
import { Button } from './button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Checkbox } from './checkbox'
import { Label } from './label'
import { FormMessage, FormSuccess, FormError, FormWarning, FormInfo } from './form-message'
import { FormSkeleton, InputSkeleton, TextareaSkeleton, CheckboxSkeleton } from './form-skeleton'
import { cn } from '@/lib/utils'

interface FormDemoProps {
  className?: string
  showSkeletonDemo?: boolean
}

export function FormDemo({ className, showSkeletonDemo = false }: FormDemoProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    category: '',
    terms: false
  })
  
  const [formState, setFormState] = useState<{
    loading: boolean
    errors: Record<string, string>
    success: boolean
    showMessages: boolean
  }>({
    loading: false,
    errors: {},
    success: false,
    showMessages: false
  })

  const [demoMode, setDemoMode] = useState<'normal' | 'error' | 'success' | 'loading'>('normal')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simulate form submission
    setFormState(prev => ({ ...prev, loading: true, errors: {}, success: false }))
    
    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address'
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message is required'
    } else if (formData.message.length < 10) {
      errors.message = 'Message must be at least 10 characters'
    }
    
    if (!formData.terms) {
      errors.terms = 'You must accept the terms and conditions'
    }

    if (Object.keys(errors).length > 0) {
      setFormState({
        loading: false,
        errors,
        success: false,
        showMessages: true
      })
    } else {
      setFormState({
        loading: false,
        errors: {},
        success: true,
        showMessages: true
      })
    }
  }

  const triggerDemo = (mode: 'normal' | 'error' | 'success' | 'loading') => {
    setDemoMode(mode)
    setFormState({
      loading: mode === 'loading',
      errors: mode === 'error' ? { 
        name: 'This field has an error',
        email: 'Invalid email format'
      } : {},
      success: mode === 'success',
      showMessages: mode !== 'normal'
    })
  }

  if (showSkeletonDemo) {
    return (
      <div className={cn("max-w-lg mx-auto p-6", className)}>
        <h2 className="text-2xl font-bold mb-6">Loading State Demo</h2>
        <FormSkeleton fields={4} variant="detailed" />
      </div>
    )
  }

  return (
    <div className={cn("max-w-lg mx-auto p-6", className)}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Enhanced Form Demo</h2>
        <p className="text-gray-600">Showcase of all form micro-interactions</p>
      </div>

      {/* Demo Controls */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="font-medium mb-3">Demo States:</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={demoMode === 'normal' ? 'default' : 'outline'}
            onClick={() => triggerDemo('normal')}
          >
            Normal
          </Button>
          <Button
            size="sm"
            variant={demoMode === 'error' ? 'destructive' : 'outline'}
            onClick={() => triggerDemo('error')}
          >
            Error State
          </Button>
          <Button
            size="sm"
            variant={demoMode === 'success' ? 'success' : 'outline'}
            onClick={() => triggerDemo('success')}
          >
            Success State
          </Button>
          <Button
            size="sm"
            variant={demoMode === 'loading' ? 'default' : 'outline'}
            onClick={() => triggerDemo('loading')}
            loading={demoMode === 'loading'}
          >
            Loading State
          </Button>
        </div>
      </div>

      {/* Global Messages */}
      {formState.showMessages && (
        <div className="mb-6 space-y-3">
          {formState.success && (
            <FormSuccess dismissible onDismiss={() => setFormState(prev => ({ ...prev, success: false }))}>
              Form submitted successfully! Thank you for your message.
            </FormSuccess>
          )}
          
          {Object.keys(formState.errors).length > 0 && (
            <FormError dismissible onDismiss={() => setFormState(prev => ({ ...prev, errors: {}, showMessages: false }))}>
              Please fix the errors below and try again.
            </FormError>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Standard Input */}
        <Input
          label="Full Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          error={formState.errors.name}
          success={!formState.errors.name && formData.name.length > 0}
          loading={formState.loading}
          placeholder="Enter your full name"
        />

        {/* Floating Label Input */}
        <Input
          floatingLabel
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          error={formState.errors.email}
          success={!formState.errors.email && formData.email.includes('@')}
          loading={formState.loading}
          placeholder="your@email.com"
        />

        {/* Enhanced Select */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger 
              error={!!formState.errors.category}
              success={formData.category.length > 0}
            >
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Inquiry</SelectItem>
              <SelectItem value="support">Support</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="partnership">Partnership</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Enhanced Textarea with Character Count */}
        <Textarea
          label="Message"
          floatingLabel
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          error={formState.errors.message}
          success={!formState.errors.message && formData.message.length >= 10}
          loading={formState.loading}
          placeholder="Tell us how we can help..."
          rows={4}
          maxLength={500}
          showCharCount
        />

        {/* Enhanced Checkbox */}
        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms"
            checked={formData.terms}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, terms: !!checked }))}
            error={!!formState.errors.terms}
            success={formData.terms}
          />
          <div className="grid gap-1.5 leading-none">
            <Label 
              htmlFor="terms" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Accept terms and conditions
            </Label>
            <p className="text-xs text-gray-500">
              You agree to our Terms of Service and Privacy Policy.
            </p>
            {formState.errors.terms && (
              <p className="text-xs text-red-600 animate-slide-up">
                {formState.errors.terms}
              </p>
            )}
          </div>
        </div>

        {/* Enhanced Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            loading={formState.loading}
            loadingText="Submitting..."
            className="flex-1"
          >
            Submit Form
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({ name: '', email: '', message: '', category: '', terms: false })
              setFormState({ loading: false, errors: {}, success: false, showMessages: false })
              setDemoMode('normal')
            }}
          >
            Reset
          </Button>
        </div>
      </form>

      {/* Additional Info Messages */}
      <div className="mt-8 space-y-3">
        <FormInfo title="Pro Tip" dismissible>
          Try focusing on the floating label inputs to see the smooth label animation.
        </FormInfo>
        
        <FormWarning title="Demo Notice" dismissible>
          This is a demonstration form. No data is actually submitted.
        </FormWarning>
      </div>
    </div>
  )
}
