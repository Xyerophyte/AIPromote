import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { Plus, Trash2, MessageCircle, Shield, Volume2, AlertTriangle } from 'lucide-react'
import { CompleteIntake } from '@/lib/validations/intake'

const TONE_OPTIONS = [
  { 
    value: 'professional', 
    label: 'Professional', 
    description: 'Formal, authoritative, business-focused'
  },
  { 
    value: 'casual', 
    label: 'Casual', 
    description: 'Relaxed, approachable, conversational'
  },
  { 
    value: 'friendly', 
    label: 'Friendly', 
    description: 'Warm, welcoming, personable'
  },
  { 
    value: 'authoritative', 
    label: 'Authoritative', 
    description: 'Expert, confident, commanding'
  },
  { 
    value: 'playful', 
    label: 'Playful', 
    description: 'Fun, creative, light-hearted'
  },
  { 
    value: 'technical', 
    label: 'Technical', 
    description: 'Detailed, precise, industry-specific'
  }
]

const TONE_EXAMPLES = {
  professional: {
    do: 'We provide enterprise-grade solutions that deliver measurable ROI.',
    dont: 'Our stuff is pretty cool and will make you tons of money!'
  },
  casual: {
    do: 'Our platform makes it super easy to manage your team.',
    dont: 'The aforementioned technological infrastructure facilitates...'
  },
  friendly: {
    do: 'We\'d love to help you achieve your goals!',
    dont: 'Contact our representatives to initiate the process.'
  },
  authoritative: {
    do: 'Based on 10+ years of industry experience, we recommend...',
    dont: 'We think maybe you might want to consider...'
  },
  playful: {
    do: 'Ready to supercharge your workflow? Let\'s do this! 🚀',
    dont: 'Please proceed with the implementation of the solution.'
  },
  technical: {
    do: 'Our API supports REST endpoints with OAuth 2.0 authentication.',
    dont: 'We have some tech stuff that works with other tech stuff.'
  }
}

export function StepBrand() {
  const { setValue, watch, register, formState: { errors } } = useFormContext<CompleteIntake>()
  const tone = watch('brand.tone') || 'professional'
  const allowedPhrases = watch('brand.allowed_phrases') || []
  const forbiddenPhrases = watch('brand.forbidden_phrases') || []

  const addAllowedPhrase = () => {
    setValue('brand.allowed_phrases', [...allowedPhrases, ''])
  }

  const updateAllowedPhrase = (index: number, value: string) => {
    const newPhrases = [...allowedPhrases]
    newPhrases[index] = value
    setValue('brand.allowed_phrases', newPhrases)
  }

  const removeAllowedPhrase = (index: number) => {
    setValue('brand.allowed_phrases', allowedPhrases.filter((_, i) => i !== index))
  }

  const addForbiddenPhrase = () => {
    setValue('brand.forbidden_phrases', [...forbiddenPhrases, ''])
  }

  const updateForbiddenPhrase = (index: number, value: string) => {
    const newPhrases = [...forbiddenPhrases]
    newPhrases[index] = value
    setValue('brand.forbidden_phrases', newPhrases)
  }

  const removeForbiddenPhrase = (index: number) => {
    setValue('brand.forbidden_phrases', forbiddenPhrases.filter((_, i) => i !== index))
  }

  const selectedToneExample = TONE_EXAMPLES[tone as keyof typeof TONE_EXAMPLES]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Brand Voice & Guidelines</h2>
        <p className="text-gray-600">Define how your brand communicates and establish messaging guidelines</p>
      </div>

      {/* Brand Tone */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-blue-600" />
          <Label className="text-lg font-medium">Brand Tone</Label>
        </div>
        <p className="text-sm text-gray-600">
          Select the primary tone that best represents your brand's communication style
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TONE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`
                cursor-pointer p-4 border rounded-lg transition-all
                ${tone === option.value 
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <input
                type="radio"
                name="tone"
                value={option.value}
                checked={tone === option.value}
                onChange={(e) => setValue('brand.tone', e.target.value as any)}
                className="sr-only"
              />
              <div className="font-medium mb-1">{option.label}</div>
              <div className="text-sm text-gray-600">{option.description}</div>
            </label>
          ))}
        </div>

        {/* Tone Examples */}
        {selectedToneExample && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-3">Examples for {TONE_OPTIONS.find(t => t.value === tone)?.label} tone:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">Do</span>
                </div>
                <p className="text-sm text-green-700">{selectedToneExample.do}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-red-800">Don't</span>
                </div>
                <p className="text-sm text-red-700">{selectedToneExample.dont}</p>
              </div>
            </div>
          </div>
        )}

        {errors.brand?.tone && (
          <p className="text-sm text-red-600">{errors.brand.tone.message}</p>
        )}
      </div>

      {/* Voice Description */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <Label htmlFor="voice_description" className="text-lg font-medium">Voice Description</Label>
        </div>
        <Textarea
          id="voice_description"
          {...register('brand.voice_description')}
          placeholder="Describe your brand's personality and communication style in more detail. How would you describe your brand if it were a person? What values and characteristics should come through in all communications?"
          rows={4}
        />
        <p className="text-sm text-gray-600">
          Provide additional context about your brand's personality beyond the tone selection.
        </p>
        {errors.brand?.voice_description && (
          <p className="text-sm text-red-600">{errors.brand.voice_description.message}</p>
        )}
      </div>

      {/* Allowed Phrases */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <Label className="text-lg font-medium">Preferred Phrases & Language</Label>
          </div>
          <Button type="button" onClick={addAllowedPhrase} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Phrase
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Add specific words, phrases, or terminology that should be used in your content. Include industry terms, branded language, or preferred expressions.
        </p>

        <div className="space-y-3">
          {allowedPhrases.map((phrase, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs flex-shrink-0">
                  ✓
                </div>
                <Input
                  value={phrase}
                  onChange={(e) => updateAllowedPhrase(index, e.target.value)}
                  placeholder="e.g., 'AI-powered', 'seamless integration', 'game-changer'"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeAllowedPhrase(index)}
                className="flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {allowedPhrases.length === 0 && (
            <div className="text-center py-6 bg-green-50 rounded-lg border-2 border-dashed border-green-300">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="text-green-700 mb-4">Add phrases and language you want to see in your content</p>
              <Button type="button" onClick={addAllowedPhrase} variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Preferred Phrase
              </Button>
            </div>
          )}
        </div>

        {errors.brand?.allowed_phrases && (
          <p className="text-sm text-red-600">{errors.brand.allowed_phrases.message}</p>
        )}
      </div>

      {/* Forbidden Phrases */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <Label className="text-lg font-medium">Forbidden Phrases & Language</Label>
          </div>
          <Button type="button" onClick={addForbiddenPhrase} className="flex items-center gap-2" variant="outline">
            <Plus className="w-4 h-4" />
            Add Forbidden Phrase
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          List words, phrases, or language that should never appear in your content. This could include competitor names, outdated terms, or language that conflicts with your brand values.
        </p>

        <div className="space-y-3">
          {forbiddenPhrases.map((phrase, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs flex-shrink-0">
                  ✗
                </div>
                <Input
                  value={phrase}
                  onChange={(e) => updateForbiddenPhrase(index, e.target.value)}
                  placeholder="e.g., 'cheap', 'simple solution', competitor names"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeForbiddenPhrase(index)}
                className="flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {forbiddenPhrases.length === 0 && (
            <div className="text-center py-6 bg-red-50 rounded-lg border-2 border-dashed border-red-300">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-400" />
              <p className="text-red-700 mb-4">Add words or phrases to avoid in your content (optional)</p>
              <Button type="button" onClick={addForbiddenPhrase} variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                <Plus className="w-4 h-4 mr-2" />
                Add Forbidden Phrase
              </Button>
            </div>
          )}
        </div>

        {errors.brand?.forbidden_phrases && (
          <p className="text-sm text-red-600">{errors.brand.forbidden_phrases.message}</p>
        )}
      </div>

      {/* Example Content */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <Label htmlFor="example_content" className="text-lg font-medium">Example Content</Label>
        </div>
        <Textarea
          id="example_content"
          {...register('brand.example_content')}
          placeholder="Paste examples of content that perfectly represents your brand voice. This could be from your website, previous social posts, email campaigns, or any other content that exemplifies how you want to communicate."
          rows={6}
        />
        <p className="text-sm text-gray-600">
          Providing examples helps our AI understand your specific style and tone better.
        </p>
        {errors.brand?.example_content && (
          <p className="text-sm text-red-600">{errors.brand.example_content.message}</p>
        )}
      </div>

      {/* Compliance Notes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <Label htmlFor="compliance_notes" className="text-lg font-medium">Compliance & Legal Notes</Label>
        </div>
        <Textarea
          id="compliance_notes"
          {...register('brand.compliance_notes')}
          placeholder="Any specific compliance requirements, legal disclaimers, or regulatory considerations that must be included in your content (e.g., GDPR notices, financial disclaimers, industry-specific requirements)."
          rows={4}
        />
        <p className="text-sm text-gray-600">
          Note any legal or compliance requirements that must be considered when creating content.
        </p>
        {errors.brand?.compliance_notes && (
          <p className="text-sm text-red-600">{errors.brand.compliance_notes.message}</p>
        )}
      </div>

      {/* Brand Guidelines Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <MessageCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">Brand Voice Best Practices</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be specific about your tone - avoid generic descriptions</li>
              <li>• Include examples of content that represents your brand well</li>
              <li>• Consider your audience's preferences and industry norms</li>
              <li>• Think about emotional impact - how do you want people to feel?</li>
              <li>• Consistency is key - maintain your voice across all channels</li>
              <li>• Review and update your guidelines as your brand evolves</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
