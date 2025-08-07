import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { Plus, Trash2, Target, Award, Zap, Users } from 'lucide-react'
import { CompleteIntake } from '@/lib/validations/intake'

const PROOF_POINT_TYPES = [
  { value: 'metric', label: 'Metric', description: 'Performance numbers, KPIs' },
  { value: 'customer', label: 'Customer', description: 'Testimonials, case studies' },
  { value: 'award', label: 'Award', description: 'Industry recognition' },
  { value: 'press', label: 'Press', description: 'Media coverage' },
  { value: 'other', label: 'Other', description: 'Other proof points' }
]

export function StepPositioning() {
  const { setValue, watch, register, formState: { errors } } = useFormContext<CompleteIntake>()
  const differentiators = watch('positioning.differentiators') || []
  const proofPoints = watch('positioning.proof_points') || []
  const competitors = watch('positioning.competitors') || []

  const addDifferentiator = () => {
    setValue('positioning.differentiators', [...differentiators, ''])
  }

  const updateDifferentiator = (index: number, value: string) => {
    const newDifferentiators = [...differentiators]
    newDifferentiators[index] = value
    setValue('positioning.differentiators', newDifferentiators)
  }

  const removeDifferentiator = (index: number) => {
    setValue('positioning.differentiators', differentiators.filter((_, i) => i !== index))
  }

  const addProofPoint = () => {
    setValue('positioning.proof_points', [
      ...proofPoints,
      {
        type: 'metric',
        description: '',
        value: ''
      }
    ])
  }

  const updateProofPoint = (index: number, field: string, value: string) => {
    const newProofPoints = [...proofPoints]
    newProofPoints[index] = { ...newProofPoints[index], [field]: value }
    setValue('positioning.proof_points', newProofPoints)
  }

  const removeProofPoint = (index: number) => {
    setValue('positioning.proof_points', proofPoints.filter((_, i) => i !== index))
  }

  const addCompetitor = () => {
    setValue('positioning.competitors', [
      ...competitors,
      {
        name: '',
        positioning: ''
      }
    ])
  }

  const updateCompetitor = (index: number, field: string, value: string) => {
    const newCompetitors = [...competitors]
    newCompetitors[index] = { ...newCompetitors[index], [field]: value }
    setValue('positioning.competitors', newCompetitors)
  }

  const removeCompetitor = (index: number) => {
    setValue('positioning.competitors', competitors.filter((_, i) => i !== index))
  }

  const getProofPointIcon = (type: string) => {
    switch (type) {
      case 'metric': return <Zap className="w-4 h-4" />
      case 'customer': return <Users className="w-4 h-4" />
      case 'award': return <Award className="w-4 h-4" />
      case 'press': return <Target className="w-4 h-4" />
      default: return <Target className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Positioning & Differentiation</h2>
        <p className="text-gray-600">Define what makes you unique and how you position yourself in the market</p>
      </div>

      {/* Unique Selling Proposition */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <Label htmlFor="usp" className="text-lg font-medium">Unique Selling Proposition (USP)</Label>
        </div>
        <Textarea
          id="usp"
          {...register('positioning.usp')}
          placeholder="What is your unique value proposition? What makes you different from competitors? (e.g., 'The only AI-powered sales tool that integrates directly with your CRM and increases close rates by 40%')"
          rows={4}
        />
        <p className="text-sm text-gray-600">
          Clearly articulate what makes your product or service unique and valuable to customers.
        </p>
        {errors.positioning?.usp && (
          <p className="text-sm text-red-600">{errors.positioning.usp.message}</p>
        )}
      </div>

      {/* Key Differentiators */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <Label className="text-lg font-medium">Key Differentiators</Label>
          </div>
          <Button type="button" onClick={addDifferentiator} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Differentiator
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          List the key features, capabilities, or advantages that set you apart from competitors.
        </p>

        <div className="space-y-3">
          {differentiators.map((differentiator, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm flex-shrink-0">
                  {index + 1}
                </div>
                <Input
                  value={differentiator}
                  onChange={(e) => updateDifferentiator(index, e.target.value)}
                  placeholder="What makes you different? (e.g., 'Real-time AI insights', 'Native integrations')"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeDifferentiator(index)}
                className="flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          {differentiators.length === 0 && (
            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Zap className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600 mb-4">Add your key differentiators to highlight what sets you apart</p>
              <Button type="button" onClick={addDifferentiator} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Differentiator
              </Button>
            </div>
          )}
        </div>

        {errors.positioning?.differentiators && (
          <p className="text-sm text-red-600">{errors.positioning.differentiators.message}</p>
        )}
      </div>

      {/* Proof Points */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            <Label className="text-lg font-medium">Proof Points</Label>
          </div>
          <Button type="button" onClick={addProofPoint} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Proof Point
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Provide evidence that supports your claims - metrics, testimonials, awards, press coverage, etc.
        </p>

        <div className="space-y-4">
          {proofPoints.map((proofPoint, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {getProofPointIcon(proofPoint.type || 'metric')}
                  <span className="font-medium">Proof Point #{index + 1}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeProofPoint(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`proof-type-${index}`}>Type</Label>
                  <select
                    id={`proof-type-${index}`}
                    value={proofPoint.type || 'metric'}
                    onChange={(e) => updateProofPoint(index, 'type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {PROOF_POINT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {PROOF_POINT_TYPES.find(t => t.value === proofPoint.type)?.description}
                  </p>
                </div>

                <div>
                  <Label htmlFor={`proof-value-${index}`}>Value/Number</Label>
                  <Input
                    id={`proof-value-${index}`}
                    value={proofPoint.value || ''}
                    onChange={(e) => updateProofPoint(index, 'value', e.target.value)}
                    placeholder="e.g., '40%', '1M+', 'TechCrunch'"
                  />
                </div>

                <div>
                  <Label htmlFor={`proof-description-${index}`}>Description</Label>
                  <Input
                    id={`proof-description-${index}`}
                    value={proofPoint.description || ''}
                    onChange={(e) => updateProofPoint(index, 'description', e.target.value)}
                    placeholder="e.g., 'increase in conversion rate'"
                  />
                </div>
              </div>
            </div>
          ))}

          {proofPoints.length === 0 && (
            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Award className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600 mb-4">Add proof points to support your positioning claims</p>
              <Button type="button" onClick={addProofPoint} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Proof Point
              </Button>
            </div>
          )}
        </div>

        {errors.positioning?.proof_points && (
          <p className="text-sm text-red-600">{errors.positioning.proof_points.message}</p>
        )}
      </div>

      {/* Competitor Analysis */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <Label className="text-lg font-medium">Competitor Analysis</Label>
          </div>
          <Button type="button" onClick={addCompetitor} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Competitor
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Identify your main competitors and how they position themselves. This helps us create content that differentiates you.
        </p>

        <div className="space-y-4">
          {competitors.map((competitor, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Competitor #{index + 1}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeCompetitor(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`competitor-name-${index}`}>Competitor Name</Label>
                  <Input
                    id={`competitor-name-${index}`}
                    value={competitor.name || ''}
                    onChange={(e) => updateCompetitor(index, 'name', e.target.value)}
                    placeholder="e.g., Salesforce, HubSpot"
                  />
                </div>

                <div>
                  <Label htmlFor={`competitor-positioning-${index}`}>Their Positioning</Label>
                  <Textarea
                    id={`competitor-positioning-${index}`}
                    value={competitor.positioning || ''}
                    onChange={(e) => updateCompetitor(index, 'positioning', e.target.value)}
                    placeholder="How do they position themselves? What do they emphasize?"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ))}

          {competitors.length === 0 && (
            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600 mb-4">Add competitors to help us understand your competitive landscape</p>
              <Button type="button" onClick={addCompetitor} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Competitor
              </Button>
            </div>
          )}
        </div>

        {errors.positioning?.competitors && (
          <p className="text-sm text-red-600">{errors.positioning.competitors.message}</p>
        )}
      </div>

      {/* Positioning Framework Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">Positioning Framework Tips</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>USP Formula:</strong> "For [target audience], we are the only [category] that [unique benefit] because [proof/reason why]"</p>
              <p><strong>Differentiators:</strong> Focus on meaningful differences that customers care about, not just features</p>
              <p><strong>Proof Points:</strong> Use specific numbers and concrete examples whenever possible</p>
              <p><strong>Competition:</strong> Understanding competitors helps identify gaps and opportunities in the market</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
