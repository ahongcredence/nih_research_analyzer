"use client";

import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep?: string;
  className?: string;
}

export default function ProgressIndicator({ 
  steps, 
  currentStep, 
  className = "" 
}: ProgressIndicatorProps) {
  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-slate-300" />;
    }
  };

  const getStepColor = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-slate-500';
    }
  };

  const getConnectorColor = (step: ProgressStep, nextStep?: ProgressStep) => {
    if (step.status === 'completed') {
      return 'bg-green-600';
    }
    if (step.status === 'in_progress' && nextStep) {
      return 'bg-slate-300';
    }
    return 'bg-slate-300';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, index) => {
        const nextStep = steps[index + 1];
        const isCurrentStep = currentStep === step.id || step.status === 'in_progress';
        
        return (
          <div key={step.id} className="flex items-start space-x-4">
            {/* Step Icon */}
            <div className="flex-shrink-0">
              {getStepIcon(step)}
            </div>
            
            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className={`text-sm font-medium ${getStepColor(step)}`}>
                  {step.title}
                </h3>
                {isCurrentStep && (
                  <span className="text-xs text-blue-600 font-medium">
                    (Current)
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {step.description}
              </p>
            </div>
            
            {/* Connector Line */}
            {nextStep && (
              <div className="absolute left-6 top-8 w-0.5 h-8">
                <div 
                  className={`w-full h-full ${getConnectorColor(step, nextStep)}`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
