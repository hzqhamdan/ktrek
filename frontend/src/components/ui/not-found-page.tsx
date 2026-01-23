import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Home, ArrowLeft, Search } from "lucide-react"
import Button from "../common/Button"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "./empty"
import { cn } from "@/lib/utils"

export interface NotFoundPageProps {
  className?: string
  title?: string
  description?: string
  showBackButton?: boolean
  showHomeButton?: boolean
}

export function NotFoundPage({
  className,
  title = "Page Not Found",
  description = "Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.",
  showBackButton = true,
  showHomeButton = true,
}: NotFoundPageProps) {
  const navigate = useNavigate()

  return (
    <div
      className={cn(
        "flex min-h-screen items-center justify-center p-4",
        className
      )}
      style={{ backgroundColor: '#F1EEE7' }}
    >
      <Empty className="border-0 max-w-2xl">
        <EmptyHeader>
          <div className="space-y-4">
            <div className="text-8xl font-bold" style={{ color: '#e16a02' }}>404</div>
            <EmptyTitle className="text-2xl">{title}</EmptyTitle>
            <EmptyDescription className="text-base">
              {description}
            </EmptyDescription>
          </div>
        </EmptyHeader>

        <EmptyContent>
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            {showHomeButton && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate("/")}
                icon={Home}
              >
                Go to Home
              </Button>
            )}
            {showBackButton && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate(-1)}
                icon={ArrowLeft}
              >
                Go Back
              </Button>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 w-full">
            <p className="text-sm text-gray-600 mb-4">
              Looking for something specific?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  const isAuthenticated = localStorage.getItem('token')
                  navigate(isAuthenticated ? "/dashboard/attractions" : "/")
                }}
                className="text-primary-700 hover:text-primary-800 font-medium text-sm hover:underline"
              >
                Browse Attractions
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => navigate("/dashboard/progress")}
                className="text-primary-700 hover:text-primary-800 font-medium text-sm hover:underline"
              >
                View Progress
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => navigate("/dashboard/rewards")}
                className="text-primary-700 hover:text-primary-800 font-medium text-sm hover:underline"
              >
                My Rewards
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => navigate("/dashboard/reports")}
                className="text-primary-700 hover:text-primary-800 font-medium text-sm hover:underline"
              >
                Report Issue
              </button>
            </div>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  )
}
