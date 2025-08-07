import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Plus, Trash2, Users, Building, Target } from 'lucide-react'
import { CompleteIntake } from '@/lib/validations/intake'

const COMPANY_SIZES = [
  '1-10 employees',
  '11-50 employees', 
  '51-200 employees',
  '201-1000 employees',
  '1000+ employees'
]

const INDUSTRIES = [
  'Technology',
  'Financial Services',
  'Healthcare',
  'Education',
  'Retail',
  'Manufacturing',
  'Professional Services',
  'Real Estate',
  'Media & Entertainment',
  'Non-profit',
  'Government',
  'Other'
]

const COMMON_SEGMENTS = [
  'SMB Decision Makers',
  'Enterprise CTOs',
  'Marketing Professionals',
  'Sales Teams',
  'Developers',
  'Product Managers',
  'Founders & CEOs',
  'HR Leaders',
  'Finance Teams',
  'Operations Managers'
]

export function StepICP() {
  const { setValue, watch, formState: { errors } } = useFormContext<CompleteIntake>()
  const personas = watch('icp.personas') || []
  const prioritySegments = watch('icp.priority_segments') || []

  const addPersona = () => {
    setValue('icp.personas', [
      ...personas,
      {
        name: '',
        title: '',
        company_size: '',
        industry: '',
        pain_points: [],
        jobs_to_be_done: []
      }
    ])
  }

  const updatePersona = (index: number, field: string, value: any) => {
    const newPersonas = [...personas]
    newPersonas[index] = { ...newPersonas[index], [field]: value }
    setValue('icp.personas', newPersonas)
  }

  const removePersona = (index: number) => {
    setValue('icp.personas', personas.filter((_, i) => i !== index))
  }

  const addPainPoint = (personaIndex: number) => {
    const newPersonas = [...personas]
    const currentPainPoints = newPersonas[personaIndex].pain_points || []
    newPersonas[personaIndex].pain_points = [...currentPainPoints, '']
    setValue('icp.personas', newPersonas)
  }

  const updatePainPoint = (personaIndex: number, pointIndex: number, value: string) => {
    const newPersonas = [...personas]
    if (newPersonas[personaIndex] && newPersonas[personaIndex].pain_points) {
      newPersonas[personaIndex].pain_points![pointIndex] = value
      setValue('icp.personas', newPersonas)
    }
  }

  const removePainPoint = (personaIndex: number, pointIndex: number) => {
    const newPersonas = [...personas]
    if (newPersonas[personaIndex] && newPersonas[personaIndex].pain_points) {
      newPersonas[personaIndex].pain_points = newPersonas[personaIndex].pain_points!.filter((_, i) => i !== pointIndex)
      setValue('icp.personas', newPersonas)
    }
  }

  const addJobToBeDone = (personaIndex: number) => {
    const newPersonas = [...personas]
    const currentJobs = newPersonas[personaIndex].jobs_to_be_done || []
    newPersonas[personaIndex].jobs_to_be_done = [...currentJobs, '']
    setValue('icp.personas', newPersonas)
  }

  const updateJobToBeDone = (personaIndex: number, jobIndex: number, value: string) => {
    const newPersonas = [...personas]
    if (newPersonas[personaIndex] && newPersonas[personaIndex].jobs_to_be_done) {
      newPersonas[personaIndex].jobs_to_be_done![jobIndex] = value
      setValue('icp.personas', newPersonas)
    }
  }

  const removeJobToBeDone = (personaIndex: number, jobIndex: number) => {
    const newPersonas = [...personas]
    if (newPersonas[personaIndex] && newPersonas[personaIndex].jobs_to_be_done) {
      newPersonas[personaIndex].jobs_to_be_done = newPersonas[personaIndex].jobs_to_be_done!.filter((_, i) => i !== jobIndex)
      setValue('icp.personas', newPersonas)
    }
  }

  const togglePrioritySegment = (segment: string, checked: boolean) => {
    if (checked) {
      setValue('icp.priority_segments', [...prioritySegments, segment])
    } else {
      setValue('icp.priority_segments', prioritySegments.filter(s => s !== segment))
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Ideal Customer Profile</h2>
        <p className="text-gray-600">Define your target audience and create detailed buyer personas</p>
      </div>

      {/* Priority Segments */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <Label className="text-lg font-medium">Priority Customer Segments</Label>
        </div>
        <p className="text-sm text-gray-600">Select the customer segments you want to prioritize</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {COMMON_SEGMENTS.map((segment) => (
            <div key={segment} className="flex items-center space-x-2">
              <Checkbox
                id={segment}
                checked={prioritySegments.includes(segment)}
                onCheckedChange={(checked) => togglePrioritySegment(segment, !!checked)}
              />
              <Label htmlFor={segment} className="text-sm">{segment}</Label>
            </div>
          ))}
        </div>
        {errors.icp?.priority_segments && (
          <p className="text-sm text-red-600">{errors.icp.priority_segments.message}</p>
        )}
      </div>

      {/* Personas Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <Label className="text-lg font-medium">Customer Personas</Label>
          </div>
          <Button type="button" onClick={addPersona} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Persona
          </Button>
        </div>

        {personas.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No personas created yet</h3>
            <p className="text-gray-600 mb-4">Create detailed buyer personas to better understand your target customers</p>
            <Button type="button" onClick={addPersona} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Persona
            </Button>
          </div>
        )}

        {personas.map((persona, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Persona #{index + 1}</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removePersona(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`persona-name-${index}`}>Persona Name</Label>
                  <Input
                    id={`persona-name-${index}`}
                    value={persona.name || ''}
                    onChange={(e) => updatePersona(index, 'name', e.target.value)}
                    placeholder="e.g., Marketing Manager Mike"
                  />
                </div>

                <div>
                  <Label htmlFor={`persona-title-${index}`}>Job Title</Label>
                  <Input
                    id={`persona-title-${index}`}
                    value={persona.title || ''}
                    onChange={(e) => updatePersona(index, 'title', e.target.value)}
                    placeholder="e.g., Marketing Manager, VP of Sales"
                  />
                </div>

                <div>
                  <Label htmlFor={`persona-company-size-${index}`}>Company Size</Label>
                  <select
                    id={`persona-company-size-${index}`}
                    value={persona.company_size || ''}
                    onChange={(e) => updatePersona(index, 'company_size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select company size...</option>
                    {COMPANY_SIZES.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor={`persona-industry-${index}`}>Industry</Label>
                  <select
                    id={`persona-industry-${index}`}
                    value={persona.industry || ''}
                    onChange={(e) => updatePersona(index, 'industry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map((industry) => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pain Points & Jobs to be Done */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Pain Points</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addPainPoint(index)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(persona.pain_points || []).map((painPoint, pointIndex) => (
                      <div key={pointIndex} className="flex gap-2">
                        <Input
                          value={painPoint}
                          onChange={(e) => updatePainPoint(index, pointIndex, e.target.value)}
                          placeholder="What problems does this persona face?"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePainPoint(index, pointIndex)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    {(!persona.pain_points || persona.pain_points.length === 0) && (
                      <p className="text-sm text-gray-500 italic">No pain points added yet</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Jobs to be Done</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addJobToBeDone(index)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(persona.jobs_to_be_done || []).map((job, jobIndex) => (
                      <div key={jobIndex} className="flex gap-2">
                        <Input
                          value={job}
                          onChange={(e) => updateJobToBeDone(index, jobIndex, e.target.value)}
                          placeholder="What are they trying to accomplish?"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeJobToBeDone(index, jobIndex)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    {(!persona.jobs_to_be_done || persona.jobs_to_be_done.length === 0) && (
                      <p className="text-sm text-gray-500 italic">No jobs to be done added yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {errors.icp?.personas && (
          <p className="text-sm text-red-600">{errors.icp.personas.message}</p>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Building className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">Tips for Creating Great Personas</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Base personas on real customer data and interviews when possible</li>
              <li>• Focus on goals, motivations, and challenges rather than demographics alone</li>
              <li>• Keep it specific - avoid generic descriptions</li>
              <li>• Consider the decision-making process and buying journey</li>
              <li>• Update personas regularly as you learn more about your customers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
