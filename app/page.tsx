"use client";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { FileText, Shield, BarChart3, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <div className="bg-slate-70">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Agentic Research Analysis
          </h1>
          <p className="mt-6 text-lg text-slate-600 sm:text-xl">
            AI agents cross-reference uploaded documents against a comprehensive rubric. 
            Generate detailed reports with systematic analysis across multiple research papers.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => router.push("/upload")}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Documents
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => router.push("/sample-report")}>
              <FileText className="mr-2 h-4 w-4" />
              View Sample Report
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-slate-700" />
                  </div>
                  <CardTitle className="text-lg text-slate-900">Multi-Document Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600">
                  Upload multiple research papers for simultaneous analysis. 
                  AI agents cross-reference each document against comprehensive rubric.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-slate-700" />
                  </div>
                  <CardTitle className="text-lg text-slate-900">Bias Detection</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600">
                  AI agents systematically evaluate documents using a structured rubric 
                  covering confirmation bias, selection bias, publication bias, and more.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-slate-700" />
                  </div>
                  <CardTitle className="text-lg text-slate-900">Comprehensive Reports</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600">
                  Generate comprehensive reports showing rubric-based analysis 
                  with cross-document comparisons and sources.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

    </div>
  );
}