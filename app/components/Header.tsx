"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { cn } from "@/app/lib/utils";

interface HeaderProps {
  logo?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
  heading?: string;
  subheading?: string;
  navigation?: Array<{
    label: string;
    href: string;
  }>;
  className?: string;
}

export default function Header({
  logo,
  heading = "Research Analyzer",
  subheading,
  navigation = [],
  className = "",
}: Readonly<HeaderProps>) {
  return (
    <header className={cn("sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60", className)}>
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            {logo && (
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width || 40}
                height={logo.height || 40}
                className="w-auto"
                style={{ height: `${logo.height || 40}px` }}
              />
            )}
            <span className="hidden font-bold text-slate-900 sm:inline-block">
              {heading}
            </span>
          </Link>
          {navigation.length > 0 && (
            <nav className="flex items-center space-x-6 text-sm font-medium">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition-colors hover:text-slate-700 text-slate-600"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="mr-2 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <SheetHeader>
                <SheetTitle className="flex items-center space-x-2">
                  {logo && (
                    <Image
                      src={logo.src}
                      alt={logo.alt}
                      width={logo.width || 40}
                      height={logo.height || 40}
                      className="w-auto"
                      style={{ height: `${Math.min(logo.height || 40, 32)}px` }}
                    />
                  )}
                  <span>{heading}</span>
                </SheetTitle>
                {subheading && (
                  <SheetDescription>
                    {subheading}
                  </SheetDescription>
                )}
              </SheetHeader>
              <div className="my-4 h-[calc(100vh-8rem)] overflow-y-auto">
                <div className="flex flex-col space-y-3">
                  {navigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link href="/" className="flex items-center space-x-2 md:hidden">
              {logo && (
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width || 40}
                  height={logo.height || 40}
                  className="w-auto"
                  style={{ height: `${Math.min(logo.height || 40, 32)}px` }}
                />
              )}
              <span className="font-bold text-slate-900">{heading}</span>
            </Link>
          </div>
          <nav className="flex items-center">
            <Button asChild variant="ghost" size="sm">
              <Link href="/contact">
                Contact
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}