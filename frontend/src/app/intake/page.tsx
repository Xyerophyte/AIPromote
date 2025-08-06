'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { FounderIntakeWizard } from '@/components/intake/founder-intake-wizard'
import { CompleteIntake } from '@/lib/validations/intake'

export default function IntakePage() {
  const router = useRouter()

  const handleIntakeComplete = (data: CompleteIntake) => {
    console.log('Intake completed:', data)
    // Redirect to dashboard or success page
    router.push('/dashboard?onboarding=complete')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <FounderIntakeWizard
          onComplete={handleIntakeComplete}
        />
      </div>
    </div>
  )
}
