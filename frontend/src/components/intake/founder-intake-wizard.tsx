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
import { StepAssets } from './step-assets'

// We'll create other steps in subsequent files
const StepICP = () => <div>ICP step coming soon...</div>
const StepPositioning = () => <div>Positioning step coming soon...</div>
const StepBrand = () => <div>Brand step coming soon...</div>
const StepGoals = () => <div>Goals step coming soon...</div>

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

export function FounderIntakeWizard({ 
  onComplete, 
  startupId, 
  initialData 
}: FounderIntakeWizardProps) {
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
      const response = await fetch(`/api/startups/${startupId}/intake-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        setLastSaved(new Date())
      }
    } catch (error) {
      console.error('Failed to save draft:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const loadDraft = async () => {
    if (!startupId) return

    try {
      const response = await fetch(`/api/startups/${startupId}/intake-draft`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const draft = await response.json()
        methods.reset(draft)
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    }
  }

  const validateCurrentStep = async (): Promise<boolean> => {
    const stepData = getStepData(currentStep)
    const schema = stepSchemas[currentStep]
    
    try {
      schema.parse(stepData)
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      return true
    } catch (error) {
      console.error('Step validation failed:', error)
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
    const isValid = await validateCurrentStep()
    if (isValid && currentStep < INTAKE_STEPS.length - 1) {
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
      // Final validation
      completeIntakeSchema.parse(data)
      
      // Submit to backend
      const response = await fetch(`/api/startups${startupId ? `/${startupId}` : ''}`, {
        method: startupId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const result = await response.json()
        onComplete?.(data)
      } else {
        throw new Error('Failed to submit intake')
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('Failed to submit intake. Please try again.')
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
