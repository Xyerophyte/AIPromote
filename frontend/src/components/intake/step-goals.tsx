import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Plus, Trash2, Target, Calendar, BarChart3, Zap } from 'lucide-react'
import { CompleteIntake } from '@/lib/validations/intake'

const PRIMARY_GOALS = [
  { 
    value: 'awareness', 
    label: 'Brand Awareness', 
    description: 'Increase visibility and recognition of your brand',
    icon: <Zap className="w-5 h-5" />
  },
  { 
    value: 'leads', 
    label: 'Lead Generation', 
    description: 'Generate qualified prospects for your sales team',
    icon: <Target className="w-5 h-5" />
  },
  { 
    value: 'signups', 
    label: 'Sign-ups & Trials', 
    description: 'Drive registrations and trial activations',
    icon: <BarChart3 className="w-5 h-5" />
  },
  { 
    value: 'demos', 
    label: 'Demo Requests', 
    description: 'Generate interest in product demonstrations',
    icon: <Target className="w-5 h-5" />
  },
  { 
    value: 'sales', 
    label: 'Direct Sales', 
    description: 'Drive immediate purchase decisions and revenue',
    icon: <BarChart3 className="w-5 h-5" />
  }
]

const PLATFORMS = [
  { 
    value: 'x', 
    label: 'X (Twitter)', 
    description: 'Real-time updates, industry discussions',
    audience: 'Tech-savvy professionals, thought leaders'
  },
  { 
    value: 'linkedin', 
    label: 'LinkedIn', 
    description: 'Professional networking, B2B content',
    audience: 'Business professionals, decision makers'
  },
  { 
    value: 'instagram', 
    label: 'Instagram', 
    description: 'Visual storytelling, brand personality',
    audience: 'Younger demographics, visual-focused users'
  },
  { 
    value: 'tiktok', 
    label: 'TikTok', 
    description: 'Short-form video, trending content',
    audience: 'Gen Z, millennial consumers'
  },
  { 
    value: 'youtube', 
    label: 'YouTube', 
    description: 'Long-form content, tutorials, demos',
    audience: 'All demographics, educational content seekers'
  },
  { 
    value: 'reddit', 
    label: 'Reddit', 
    description: 'Community discussions, niche audiences',
    audience: 'Engaged communities, technical users'
  }
]

const POSTING_FREQUENCIES = [
  { 
    value: 'daily', 
    label: 'Daily', 
    description: '7 posts per week - High engagement',
    commitment: 'High'
  },
  { 
    value: '3x-week', 
    label: '3x per Week', 
    description: '3 posts per week - Balanced approach',
    commitment: 'Medium'
  },
  { 
    value: 'weekly', 
    label: 'Weekly', 
    description: '1 post per week - Quality focused',
    commitment: 'Low'
  },
  { 
    value: 'biweekly', 
    label: 'Bi-weekly', 
    description: '1 post every 2 weeks - Minimal presence',
    commitment: 'Very Low'
  }
]

export function StepGoals() {
  const { setValue, watch, formState: { errors } } = useFormContext<CompleteIntake>()
  const primaryGoal = watch('goals.primary_goal') || 'awareness'
  const targetPlatforms = watch('goals.target_platforms') || []
  const postingFrequency = watch('goals.posting_frequency') || 'weekly'
  const kpis = watch('goals.kpis') || []

  const togglePlatform = (platform: string, checked: boolean) => {
    const platformValue = platform as "x" | "linkedin" | "instagram" | "tiktok" | "youtube" | "reddit"
    if (checked) {
      setValue('goals.target_platforms', [...targetPlatforms, platformValue])
    } else {
      setValue('goals.target_platforms', targetPlatforms.filter(p => p !== platform))
    }
  }

  const addKPI = () => {
    setValue('goals.kpis', [
      ...kpis,
      {
        metric: '',
        target: '',
        timeframe: ''
      }
    ])
  }

  const updateKPI = (index: number, field: string, value: string) => {
    const newKPIs = [...kpis]
    newKPIs[index] = { ...newKPIs[index], [field]: value }
    setValue('goals.kpis', newKPIs)
  }

  const removeKPI = (index: number) => {
    setValue('goals.kpis', kpis.filter((_, i) => i !== index))
  }

  const selectedGoal = PRIMARY_GOALS.find(g => g.value === primaryGoal)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Goals & KPIs</h2>
        <p className="text-gray-600">Define what you want to achieve with your social media presence</p>
      </div>

      {/* Primary Goal */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          <Label className="text-lg font-medium">Primary Marketing Goal</Label>
        </div>
        <p className="text-sm text-gray-600">
          Choose your main objective for social media marketing
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRIMARY_GOALS.map((goal) => (
            <label
              key={goal.value}
              className={`
                cursor-pointer p-4 border rounded-lg transition-all flex items-start gap-3
                ${primaryGoal === goal.value 
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <input
                type="radio"
                name="primary_goal"
                value={goal.value}
                checked={primaryGoal === goal.value}
                onChange={(e) => setValue('goals.primary_goal', e.target.value as any)}
                className="sr-only"
              />
              <div className={`mt-0.5 ${primaryGoal === goal.value ? 'text-blue-600' : 'text-gray-400'}`}>
                {goal.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium mb-1">{goal.label}</div>
                <div className="text-sm text-gray-600">{goal.description}</div>
              </div>
            </label>
          ))}
        </div>

        {errors.goals?.primary_goal && (
          <p className="text-sm text-red-600">{errors.goals.primary_goal.message}</p>
        )}
      </div>

      {/* Target Platforms */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <Label className="text-lg font-medium">Target Platforms</Label>
        </div>
        <p className="text-sm text-gray-600">
          Select the social media platforms where you want to focus your efforts
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLATFORMS.map((platform) => (
            <div
              key={platform.value}
              className={`
                p-4 border rounded-lg transition-all
                ${targetPlatforms.includes(platform.value as any)
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={platform.value}
                  checked={targetPlatforms.includes(platform.value as any)}
                  onCheckedChange={(checked) => togglePlatform(platform.value, !!checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor={platform.value} className="font-medium cursor-pointer">
                    {platform.label}
                  </Label>
                  <p className="text-sm text-gray-600 mb-1">{platform.description}</p>
                  <p className="text-xs text-gray-500">{platform.audience}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {targetPlatforms.length === 0 && (
          <div className="text-center py-6 bg-yellow-50 rounded-lg border-2 border-dashed border-yellow-300">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <p className="text-yellow-700">Select at least one platform to get started</p>
          </div>
        )}

        {errors.goals?.target_platforms && (
          <p className="text-sm text-red-600">{errors.goals.target_platforms.message}</p>
        )}
      </div>

      {/* Posting Frequency */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <Label className="text-lg font-medium">Posting Frequency</Label>
        </div>
        <p className="text-sm text-gray-600">
          How often do you want to publish content? Consider your resources and audience expectations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {POSTING_FREQUENCIES.map((frequency) => (
            <label
              key={frequency.value}
              className={`
                cursor-pointer p-4 border rounded-lg transition-all
                ${postingFrequency === frequency.value 
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <input
                type="radio"
                name="posting_frequency"
                value={frequency.value}
                checked={postingFrequency === frequency.value}
                onChange={(e) => setValue('goals.posting_frequency', e.target.value as any)}
                className="sr-only"
              />
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{frequency.label}</div>
                <div className={`
                  text-xs px-2 py-1 rounded-full
                  ${frequency.commitment === 'High' ? 'bg-red-100 text-red-700' :
                    frequency.commitment === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    frequency.commitment === 'Low' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }
                `}>
                  {frequency.commitment} Commitment
                </div>
              </div>
              <div className="text-sm text-gray-600">{frequency.description}</div>
            </label>
          ))}
        </div>

        {errors.goals?.posting_frequency && (
          <p className="text-sm text-red-600">{errors.goals.posting_frequency.message}</p>
        )}
      </div>

      {/* KPIs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <Label className="text-lg font-medium">Key Performance Indicators (KPIs)</Label>
          </div>
          <Button type="button" onClick={addKPI} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add KPI
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Define specific, measurable goals that align with your primary objective
        </p>

        <div className="space-y-4">
          {kpis.map((kpi, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">KPI #{index + 1}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeKPI(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`kpi-metric-${index}`}>Metric</Label>
                  <Input
                    id={`kpi-metric-${index}`}
                    value={kpi.metric || ''}
                    onChange={(e) => updateKPI(index, 'metric', e.target.value)}
                    placeholder="e.g., Website Traffic, Sign-ups, Engagement Rate"
                  />
                </div>

                <div>
                  <Label htmlFor={`kpi-target-${index}`}>Target</Label>
                  <Input
                    id={`kpi-target-${index}`}
                    value={kpi.target || ''}
                    onChange={(e) => updateKPI(index, 'target', e.target.value)}
                    placeholder="e.g., 1000 visitors, 50 sign-ups, 5%"
                  />
                </div>

                <div>
                  <Label htmlFor={`kpi-timeframe-${index}`}>Timeframe</Label>
                  <Input
                    id={`kpi-timeframe-${index}`}
                    value={kpi.timeframe || ''}
                    onChange={(e) => updateKPI(index, 'timeframe', e.target.value)}
                    placeholder="e.g., per month, per quarter, in 6 months"
                  />
                </div>
              </div>
            </div>
          ))}

          {kpis.length === 0 && (
            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600 mb-4">Add KPIs to track your social media success</p>
              <Button type="button" onClick={addKPI} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First KPI
              </Button>
            </div>
          )}
        </div>

        {errors.goals?.kpis && (
          <p className="text-sm text-red-600">{errors.goals.kpis.message}</p>
        )}
      </div>

      {/* Goal Alignment Info */}
      {selectedGoal && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 mt-1">{selectedGoal.icon}</div>
            <div>
              <h3 className="font-medium text-blue-900 mb-2">
                Content Strategy for {selectedGoal.label}
              </h3>
              <div className="text-sm text-blue-800 space-y-2">
                {primaryGoal === 'awareness' && (
                  <div>
                    <p><strong>Focus:</strong> Thought leadership, industry insights, behind-the-scenes content</p>
                    <p><strong>Metrics:</strong> Reach, impressions, brand mentions, follower growth</p>
                  </div>
                )}
                {primaryGoal === 'leads' && (
                  <div>
                    <p><strong>Focus:</strong> Educational content, lead magnets, problem-solving posts</p>
                    <p><strong>Metrics:</strong> Click-through rates, contact form submissions, email sign-ups</p>
                  </div>
                )}
                {primaryGoal === 'signups' && (
                  <div>
                    <p><strong>Focus:</strong> Product benefits, free trial offers, user testimonials</p>
                    <p><strong>Metrics:</strong> Trial activations, account registrations, conversion rates</p>
                  </div>
                )}
                {primaryGoal === 'demos' && (
                  <div>
                    <p><strong>Focus:</strong> Product demos, feature highlights, use case examples</p>
                    <p><strong>Metrics:</strong> Demo requests, video views, engagement with demo content</p>
                  </div>
                )}
                {primaryGoal === 'sales' && (
                  <div>
                    <p><strong>Focus:</strong> Product benefits, customer success stories, limited-time offers</p>
                    <p><strong>Metrics:</strong> Conversion rates, sales attribution, revenue from social</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
