"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ProgressIndicator } from "@/app/components";
import { Play, Pause, RotateCcw } from "lucide-react";

export default function DemoPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const steps = [
    {
      id: 'pdf_processing',
      title: 'PDF Processing',
      description: 'Extracting text from uploaded documents',
      status: currentStep > 0 ? 'completed' : currentStep === 0 ? 'in_progress' : 'pending'
    },
    {
      id: 'study_classification',
      title: 'Study Classification',
      description: 'AI agents analyzing study types and methodologies',
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'in_progress' : 'pending'
    },
    {
      id: 'bias_analysis',
      title: 'Bias Analysis',
      description: 'Applying JBI criteria for systematic bias assessment',
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'in_progress' : 'pending'
    },
    {
      id: 'report_generation',
      title: 'Report Generation',
      description: 'Generating comprehensive analysis reports',
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'in_progress' : 'pending'
    }
  ];

  const startDemo = () => {
    setIsRunning(true);
    setIsPaused(false);
    setCurrentStep(0);
    
    const interval = setInterval(() => {
      if (!isPaused) {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) {
            clearInterval(interval);
            setIsRunning(false);
            return prev;
          }
          return prev + 1;
        });
      }
    }, 2000);
  };

  const pauseDemo = () => {
    setIsPaused(!isPaused);
  };

  const resetDemo = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Analysis Progress Demo
            </h1>
            <p className="text-lg text-slate-600">
              Interactive demonstration of the analysis progress tracking system
            </p>
          </div>

          {/* Demo Controls */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Demo Controls</CardTitle>
              <CardDescription>
                Control the demo to see how the progress tracking works
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button
                  onClick={startDemo}
                  disabled={isRunning}
                  className="flex items-center"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Demo
                </Button>
                
                {isRunning && (
                  <Button
                    onClick={pauseDemo}
                    variant="outline"
                    className="flex items-center"
                  >
                    {isPaused ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  onClick={resetDemo}
                  variant="outline"
                  className="flex items-center"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
              
              <div className="mt-4 text-sm text-slate-600">
                <p>Current Step: {currentStep + 1} of {steps.length}</p>
                <p>Status: {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Stopped'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Progress Indicator */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Progress</CardTitle>
              <CardDescription>
                Step-by-step progress through the analysis pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProgressIndicator
                steps={steps}
                currentStep={steps[currentStep]?.id}
              />
            </CardContent>
          </Card>

          {/* Information */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-slate-600">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Real-time Polling</h4>
                  <p>
                    The system polls AWS Step Functions every 3-30 seconds to check 
                    the status of your analysis. This demo simulates that process.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Phase Detection</h4>
                  <p>
                    Based on execution time and status, the system determines which 
                    phase of analysis is currently running.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Error Handling</h4>
                  <p>
                    If errors occur, the system displays helpful messages and provides 
                    options to retry or start over.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Results Display</h4>
                  <p>
                    Once complete, you can view and download the generated reports 
                    and analysis results.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
