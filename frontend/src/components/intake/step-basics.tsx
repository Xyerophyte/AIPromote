import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { CompleteIntake } from '@/lib/validations/intake'

const STARTUP_CATEGORIES = [
  'AI/ML', 'SaaS', 'Fintech', 'Healthcare', 'E-commerce', 'Education',
  'Marketing', 'Developer Tools', 'Productivity', 'Security', 'Other'
]

const MARKETS = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 
  'Australia', 'Japan', 'India', 'Singapore', 'Brazil', 'Other'
]

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Portuguese', 
  'Japanese', 'Chinese', 'Hindi', 'Other'
]

export function StepBasics() {
  const { register, formState: { errors }, watch, setValue } = useFormContext<CompleteIntake>()
  const selectedMarkets = watch('startupBasics.markets') || []
  const selectedLanguages = watch('startupBasics.languages') || []
  const category = watch('startupBasics.category')
  const stage = watch('startupBasics.stage')

  const toggleMarket = (market: string, checked: boolean) => {
    if (checked) {
      setValue('startupBasics.markets', [...selectedMarkets, market])
    } else {
      setValue('startupBasics.markets', selectedMarkets.filter(m => m !== market))
    }
  }

  const toggleLanguage = (language: string, checked: boolean) => {
    if (checked) {
      setValue('startupBasics.languages', [...selectedLanguages, language])
    } else {
      setValue('startupBasics.languages', selectedLanguages.filter(l => l !== language))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Startup Basics</h2>
        <p className="text-gray-600">Tell us about your company and what you do</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Input
            id="name"
            label="Company Name *"
            {...register('startupBasics.name')}
            placeholder="e.g., Acme AI"
            error={errors.startupBasics?.name?.message}
            success={!errors.startupBasics?.name && watch('startupBasics.name')?.length > 0}
          />
        </div>

        <div className="space-y-2">
          <Input
            id="url"
            label="Website URL"
            {...register('startupBasics.url')}
            placeholder="https://yourcompany.com"
            error={errors.startupBasics?.url?.message}
            success={!errors.startupBasics?.url && watch('startupBasics.url')?.length > 0}
          />
        </div>
      </div>

      <Input
        id="tagline"
        label="Tagline *"
        {...register('startupBasics.tagline')}
        placeholder="e.g., AI-powered sales automation for startups"
        error={errors.startupBasics?.tagline?.message}
        success={!errors.startupBasics?.tagline && watch('startupBasics.tagline')?.length > 0}
      />

      <Textarea
        id="description"
        label="Company Description *"
        {...register('startupBasics.description')}
        placeholder="Describe what your company does, the problem you solve, and your solution..."
        rows={4}
        maxLength={1000}
        showCharCount
        error={errors.startupBasics?.description?.message}
        success={!errors.startupBasics?.description && watch('startupBasics.description')?.length >= 50}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select onValueChange={(value) => setValue('startupBasics.category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {STARTUP_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.startupBasics?.category && (
            <p className="text-sm text-red-600">{errors.startupBasics.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stage">Funding Stage *</Label>
          <Select onValueChange={(value) => setValue('startupBasics.stage', value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="idea">Idea</SelectItem>
              <SelectItem value="pre-seed">Pre-seed</SelectItem>
              <SelectItem value="seed">Seed</SelectItem>
              <SelectItem value="series-a">Series A</SelectItem>
              <SelectItem value="series-b">Series B</SelectItem>
              <SelectItem value="growth">Growth</SelectItem>
            </SelectContent>
          </Select>
          {errors.startupBasics?.stage && (
            <p className="text-sm text-red-600">{errors.startupBasics.stage.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pricing">Pricing Model</Label>
          <Input
            id="pricing"
            {...register('startupBasics.pricing')}
            placeholder="e.g., $99/month"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Target Markets *</Label>
          <p className="text-sm text-gray-600 mb-3">Select all markets you're targeting</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {MARKETS.map((market) => (
              <div key={market} className="flex items-center space-x-2">
                <Checkbox
                  id={market}
                  checked={selectedMarkets.includes(market)}
                  onCheckedChange={(checked) => toggleMarket(market, !!checked)}
                />
                <Label htmlFor={market} className="text-sm">{market}</Label>
              </div>
            ))}
          </div>
          {errors.startupBasics?.markets && (
            <p className="text-sm text-red-600 mt-2">{errors.startupBasics.markets.message}</p>
          )}
        </div>

        <div>
          <Label>Languages *</Label>
          <p className="text-sm text-gray-600 mb-3">Select all languages you'll market in</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {LANGUAGES.map((language) => (
              <div key={language} className="flex items-center space-x-2">
                <Checkbox
                  id={language}
                  checked={selectedLanguages.includes(language)}
                  onCheckedChange={(checked) => toggleLanguage(language, !!checked)}
                />
                <Label htmlFor={language} className="text-sm">{language}</Label>
              </div>
            ))}
          </div>
          {errors.startupBasics?.languages && (
            <p className="text-sm text-red-600 mt-2">{errors.startupBasics.languages.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
