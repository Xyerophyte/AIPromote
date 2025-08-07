'use client'

import React, { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight, Save, CheckCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { cn } from '@/lib/utils'

import { 
  CompleteIntake, 
  completeIntakeSchema, 
  IntakeStep, 
  INTAKE_STEPS,
  startupBasicsSchema,
  icpSchema,
  positioningSchema,
  brandSchema,
  goalsSchema,
  assetsSchema
} from '@/lib/validations/intake'

import { StepBasics } from './step-basics'
import { StepICP } from './step-icp'
import { StepPositioning } from './step-positioning'
import { StepBrand } from './step-brand'
import { StepGoals } from './step-goals'
import { StepAssets } from './step-assets'
import { startupsService } from '@/lib/api'
import { useSupabaseSession, insertWithRealtime, updateWithRealtime } from '@/lib/supabase-client'
import LoadingSpinner from '@/components/ui/loading-spinner'
import ErrorBoundary from '@/components/error-boundary'

const stepSchemas = [
  startupBasicsSchema,
  icpSchema, 
  positioningSchema,
  brandSchema,
  goalsSchema,
  assetsSchema
]

interface FounderIntakeWizardProps {
  onComplete?: (data: CompleteIntake) => void
  startupId?: string
  initialData?: Partial<CompleteIntake>
}

function FounderIntakeWizardInner({ 
  onComplete, 
  startupId, 
  initialData 
}: FounderIntakeWizardProps) {
  const { isConnected } = useSupabaseSession()
  const [currentStep, setCurrentStep] = useState(IntakeStep.BASICS)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const methods = useForm<CompleteIntake>({
    resolver: zodResolver(completeIntakeSchema),
    defaultValues: initialData || {
      startupBasics: {
        name: '',
        url: '',
        tagline: '',
        description: '',
        category: '',
        stage: 'idea',
        pricing: '',
        markets: [],
        languages: []
      },
      icp: {
        personas: [],
        priority_segments: []
      },
      positioning: {
        usp: '',
        differentiators: [],
        proof_points: [],
        competitors: []
      },
      brand: {
        tone: 'professional',
        voice_description: '',
        allowed_phrases: [],
        forbidden_phrases: [],
        example_content: '',
        compliance_notes: ''
      },
      goals: {
        primary_goal: 'awareness',
        target_platforms: [],
        posting_frequency: 'weekly',
        kpis: []
      },
      assets: {
        logo: [],
        screenshots: [],
        demo_videos: [],
        case_studies: [],
        pitch_deck: [],
        blog_links: []
      }
    },
    mode: 'onChange'
  })

  const { handleSubmit, trigger, getValues, formState: { errors, isValid } } = methods

  // Auto-save functionality
  useEffect(() => {
    const interval = setInterval(async () => {
      const formData = getValues()
      await saveDraft(formData)
    }, 30000) // Save every 30 seconds

    return () => clearInterval(interval)
  }, [getValues])

  // Load saved draft on mount
  useEffect(() => {
    if (!initialData && startupId) {
      loadDraft()
    }
  }, [startupId, initialData])

  const saveDraft = async (data: Partial<CompleteIntake>) => {
    if (!startupId) return

    setIsSaving(true)
    try {
      const response = await startupsService.saveIntakeDraft(startupId, data)
      
      if (response.success) {
        setLastSaved(new Date())
        console.log('✅ Draft saved successfully')
      } else {
        console.error('❌ Failed to save draft:', response.error)
      }
    } catch (error) {
      console.error('❌ Draft save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const loadDraft = async () => {
    if (!startupId) return

    try {
      const response = await startupsService.loadIntakeDraft(startupId)
      
      if (response.success && response.data) {
        methods.reset(response.data)
        console.log('✅ Draft loaded successfully')
      } else {
        console.log('ℹ️  No draft found or failed to load:', response.error)
      }
    } catch (error) {
      console.error('❌ Draft load error:', error)
    }
  }

  const validateCurrentStep = async (): Promise<boolean> => {
    const stepData = getStepData(currentStep)
    const schema = stepSchemas[currentStep]
    
    try {
      // Log the data being validated for debugging
      console.log('=== VALIDATION DEBUG ===')
      console.log('Current Step:', currentStep)
      console.log('Step Data:', JSON.stringify(stepData, null, 2))
      console.log('Schema:', schema)
      
      // Try to parse the data
      const result = schema.safeParse(stepData)
      
      if (result.success) {
        console.log('✅ Validation passed')
        setCompletedSteps(prev => new Set([...prev, currentStep]))
        return true
      } else {
        console.log('❌ Validation failed')
        console.log('Errors:', result.error.issues)
        
        // Create detailed error message
        const errorMessages = result.error.issues.map(issue => {
          const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
          return `${path}: ${issue.message}`
        })
        
        console.log('Error Messages:', errorMessages)
        
        // Show user-friendly alert with specific errors
        const errorText = errorMessages.join('\n• ')
        alert(`Validation errors found:\n\n• ${errorText}\n\nPlease fix these issues or click OK and then choose to skip validation.`)
        
        return false
      }
    } catch (error) {
      console.error('Unexpected validation error:', error)
      return false
    }
  }

  const getStepData = (step: IntakeStep) => {
    const data = getValues()
    switch (step) {
      case IntakeStep.BASICS:
        return data.startupBasics
      case IntakeStep.ICP:
        return data.icp
      case IntakeStep.POSITIONING:
        return data.positioning
      case IntakeStep.BRAND:
        return data.brand
      case IntakeStep.GOALS:
        return data.goals
      case IntakeStep.ASSETS:
        return data.assets
      default:
        return {}
    }
  }

  const nextStep = async () => {
    // For development, allow skipping validation with confirmation
    const isValid = await validateCurrentStep()
    if (!isValid) {
      const skipValidation = confirm(
        'Some fields are not filled correctly. Would you like to skip validation and continue anyway? (For development only)'
      )
      if (!skipValidation) {
        return
      }
    }
    
    if (currentStep < INTAKE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
      await saveDraft(getValues())
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = async (step: IntakeStep) => {
    if (step < currentStep || completedSteps.has(step)) {
      setCurrentStep(step)
    }
  }

  const onSubmit = async (data: CompleteIntake) => {
    setIsSaving(true)
    try {
      console.log('=== SUBMITTING INTAKE ===')
      console.log('Form data:', JSON.stringify(data, null, 2))
      
      // Skip final validation in development mode
      const shouldValidate = process.env.NODE_ENV === 'production'
      
      if (shouldValidate) {
        console.log('Running final validation...')
        completeIntakeSchema.parse(data)
        console.log('✅ Final validation passed')
      } else {
        console.log('⚠️  Skipping final validation (development mode)')
      }
      
      // Submit to backend using API service
      console.log('Submitting to API...')
      const response = await startupsService.submitIntake(data, startupId)
      
      if (response.success && response.data) {
        console.log('✅ Submission successful:', response.data)
        
        // Show success message
        alert(`🎉 Intake submitted successfully!\n\nID: ${response.data.id}\nStatus: ${response.data.status}\n\nThank you for completing the intake form.`)
        
        // Call completion callback
        onComplete?.(data)
      } else {
        console.error('❌ API Error:', response.error)
        throw new Error(response.error || 'Failed to submit intake')
      }
    } catch (error) {
      console.error('❌ Submit error:', error)
      
      let errorMessage = 'Failed to submit intake. '
      const err = error as Error
      if (err.name === 'ZodError') {
        errorMessage += 'Please fill in all required fields properly.'
      } else if (err.message && err.message.includes('fetch')) {
        errorMessage += 'Network error. Please check your connection and try again.'
      } else {
        errorMessage += err.message || 'Please try again.'
      }
      
      alert(`❌ Submission Error\n\n${errorMessage}\n\nCheck the console for detailed error information.`)
    } finally {
      setIsSaving(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case IntakeStep.BASICS:
        return <StepBasics />
      case IntakeStep.ICP:
        return <StepICP />
      case IntakeStep.POSITIONING:
        return <StepPositioning />
      case IntakeStep.BRAND:
        return <StepBrand />
      case IntakeStep.GOALS:
        return <StepGoals />
      case IntakeStep.ASSETS:
        return <StepAssets />
      default:
        return <StepBasics />
    }
  }

  const progressPercentage = ((currentStep + 1) / INTAKE_STEPS.length) * 100

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Founder Intake</h1>
          <div className="flex items-center gap-3">
            {isSaving && (
              <div className="flex items-center text-sm text-gray-600">
                <Save className="w-4 h-4 mr-1 animate-spin" />
                Saving...
              </div>
            )}
            {lastSaved && !isSaving && (
              <div className="text-sm text-gray-600">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Step {currentStep + 1} of {INTAKE_STEPS.length}</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-4 overflow-x-auto pb-2">
          {INTAKE_STEPS.map((step, index) => (
            <button
              key={step.key}
              onClick={() => goToStep(step.key)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                "flex items-center gap-2 whitespace-nowrap",
                currentStep === step.key
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : completedSteps.has(step.key)
                  ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                  : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
              )}
              disabled={index > currentStep && !completedSteps.has(step.key)}
            >
              {completedSteps.has(step.key) && (
                <CheckCircle className="w-4 h-4" />
              )}
              <div>
                <div className="font-medium">{step.title}</div>
                <div className="text-xs opacity-75">{step.description}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Form */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => saveDraft(getValues())}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </Button>

              {currentStep === INTAKE_STEPS.length - 1 ? (
                <Button
                  type="submit"
                  disabled={isSaving || !isValid}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <Save className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Complete Intake
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </FormProvider>

      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-medium text-red-800 mb-2">Please fix the following errors:</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {Object.entries(errors).map(([key, error]) => (
              <li key={key}>• {error?.message || 'Invalid input'}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Export wrapped component with ErrorBoundary
export function FounderIntakeWizard(props: FounderIntakeWizardProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-red-800 mb-4">Intake Form Error</h2>
            <p className="text-red-700 mb-4">
              Sorry, there was an error loading the intake form. Please refresh the page and try again.
            </p>
            <LoadingSpinner 
              color="danger" 
              text="If the problem persists, please contact support" 
              variant="pulse" 
            />
          </div>
        </div>
      }
    >
      <FounderIntakeWizardInner {...props} />
    </ErrorBoundary>
  )
}
