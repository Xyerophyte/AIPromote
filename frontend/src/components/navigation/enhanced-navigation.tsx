"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Brain, Menu, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavigationProps {
  className?: string
}

const navItems = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#contact", label: "Contact" },
]

const authItems = [
  { href: "/auth/signin", label: "Sign In", variant: "outline" as const },
  { href: "/auth/signup", label: "Get Started", variant: "default" as const },
]

export default function EnhancedNavigation({ className }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeSection, setActiveSection] = useState("")
  const pathname = usePathname()

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight - windowHeight
      
      // Update scroll state for backdrop blur
      setIsScrolled(scrollPosition > 20)
      
      // Update scroll progress
      const progress = (scrollPosition / documentHeight) * 100
      setScrollProgress(Math.min(progress, 100))
      
      // Update active section based on scroll position
      const sections = ["features", "pricing", "contact"]
      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= windowHeight / 2 && rect.bottom >= windowHeight / 2) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && !(event.target as Element)?.closest(".mobile-menu-container")) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [isMobileMenuOpen])

  // Handle smooth scrolling for anchor links
  const handleAnchorClick = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.getElementById(href.substring(1))
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out shadow-md shadow-blue-500/20"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Navigation Header */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-out",
          isScrolled
            ? "bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-lg shadow-black/5"
            : "bg-white border-b border-gray-200",
          className
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center space-x-3 group transition-transform duration-200 hover:scale-105"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
                <Brain className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-200" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AIPromote
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = activeSection === item.href.substring(1)
                return (
                  <div key={item.href} className="relative group">
                    <button
                      onClick={() => handleAnchorClick(item.href)}
                      className={cn(
                        "relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg",
                        "hover:scale-105 hover:bg-gray-50 active:scale-95",
                        isActive
                          ? "text-blue-600"
                          : "text-gray-600 hover:text-blue-600"
                      )}
                    >
                      {item.label}
                      
                      {/* Animated underline */}
                      <span
                        className={cn(
                          "absolute bottom-0 left-1/2 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out",
                          isActive
                            ? "w-3/4 -translate-x-1/2 opacity-100"
                            : "w-0 -translate-x-1/2 opacity-0 group-hover:w-3/4 group-hover:opacity-100"
                        )}
                      />
                    </button>
                  </div>
                )
              })}
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {authItems.map((item) => (
                <Button
                  key={item.href}
                  variant={item.variant}
                  className={cn(
                    "transition-all duration-200 hover:scale-105 active:scale-95",
                    item.variant === "default" &&
                      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg"
                  )}
                  asChild
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden mobile-menu-container">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "p-2 transition-all duration-200 hover:scale-110 active:scale-95",
                  isMobileMenuOpen && "bg-gray-100"
                )}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <div className="relative w-6 h-6">
                  <Menu
                    className={cn(
                      "absolute inset-0 transition-all duration-300",
                      isMobileMenuOpen
                        ? "opacity-0 rotate-180 scale-0"
                        : "opacity-100 rotate-0 scale-100"
                    )}
                  />
                  <X
                    className={cn(
                      "absolute inset-0 transition-all duration-300",
                      isMobileMenuOpen
                        ? "opacity-100 rotate-0 scale-100"
                        : "opacity-0 -rotate-180 scale-0"
                    )}
                  />
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-out mobile-menu-container",
            isMobileMenuOpen
              ? "max-h-96 opacity-100"
              : "max-h-0 opacity-0"
          )}
        >
          <div
            className={cn(
              "px-4 pb-6 space-y-1 bg-white/95 backdrop-blur-md border-t border-gray-200/50",
              "transform transition-all duration-300 ease-out",
              isMobileMenuOpen
                ? "translate-y-0"
                : "-translate-y-4"
            )}
          >
            {/* Mobile Navigation Links */}
            {navItems.map((item, index) => {
              const isActive = activeSection === item.href.substring(1)
              return (
                <div
                  key={item.href}
                  className={cn(
                    "transform transition-all duration-300 ease-out",
                    isMobileMenuOpen
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-4 opacity-0"
                  )}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <button
                    onClick={() => handleAnchorClick(item.href)}
                    className={cn(
                      "w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all duration-200",
                      "hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98]",
                      isActive
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-blue-600"
                    )}
                  >
                    {item.label}
                  </button>
                </div>
              )
            })}

            {/* Mobile Auth Buttons */}
            <div
              className={cn(
                "pt-4 space-y-2 transform transition-all duration-300 ease-out",
                isMobileMenuOpen
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-4 opacity-0"
              )}
              style={{ transitionDelay: "150ms" }}
            >
              {authItems.map((item) => (
                <Button
                  key={item.href}
                  variant={item.variant}
                  className={cn(
                    "w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                    item.variant === "default" &&
                      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  )}
                  asChild
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
