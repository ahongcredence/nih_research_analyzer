import Link from "next/link";
import Image from "next/image";
import { cn } from "@/app/lib/utils";

interface FooterProps {
  agencyName?: string;
  agencyDescription?: string;
  links?: Array<{
    label: string;
    href: string;
    external?: boolean;
  }>;
  contactInfo?: {
    address?: string;
    phone?: string;
    email?: string;
  };
  socialLinks?: Array<{
    name: string;
    href: string;
    icon: string;
  }>;
  copyrightText?: string;
  className?: string;
}

export default function Footer({
  agencyName = "Credence",
  agencyDescription,
  contactInfo,
  copyrightText,
  className = "",
}: Readonly<FooterProps>) {
  const currentYear = new Date().getFullYear();
  const defaultCopyright = `© ${currentYear} ${agencyName}. All rights reserved.`;

  return (
    <footer className={cn("border-t border-slate-200/50 bg-slate-50/80", className)}>
      <div className="container py-6 md:py-6">
        <div className="flex flex-col items-start text-left">
          {/* Agency Logo and Description */}
          <div className="space-y-3">
            <Image
              src="/credence_logo_condensed.png"
              alt="Credence Management Solutions"
              width={100}
              height={40}
              className="h-8 w-auto"
              priority
            />
            {agencyDescription && (
              <p className="text-sm text-slate-500 max-w-md">
                {agencyDescription}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200/30 pt-4">
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
            <p className="text-xs text-slate-500">
              {copyrightText || defaultCopyright}
            </p>
            <div className="flex space-x-4">
              <Link
                href="/privacy"
                className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}