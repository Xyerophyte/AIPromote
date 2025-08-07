import { NextRequest, NextResponse } from "next/server"
import { generateResetToken, sendResetEmail } from "@/lib/password-reset"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Generate reset token
    const resetToken = await generateResetToken()
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Call backend API to store reset token
    const response = await fetch(`${process.env.BACKEND_API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        resetToken,
        resetTokenExpiry,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      // Don't reveal if user exists or not for security
      if (response.status === 404) {
        return NextResponse.json(
          { message: "If an account with that email exists, we've sent a password reset link." },
          { status: 200 }
        )
      }
      return NextResponse.json(
        { error: error.message || "Failed to process password reset request" },
        { status: response.status }
      )
    }

    // Send reset email
    try {
      await sendResetEmail(email, resetToken)
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError)
      // Don't fail the request if email fails, for security reasons
    }

    return NextResponse.json(
      { message: "If an account with that email exists, we've sent a password reset link." },
      { status: 200 }
    )
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
