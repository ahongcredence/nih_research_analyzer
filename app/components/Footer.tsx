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
    <footer className={cn("border-t border-slate-200 bg-slate-100", className)}>
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Agency Logo and Description */}
          <div className="space-y-4">
            <Image
              src="/credence_logo.png"
              alt="Credence Management Solutions"
              width={200}
              height={80}
              className="h-12 w-auto"
              priority
              quality={100}
            />
            {agencyDescription && (
              <p className="text-sm text-slate-600">
                {agencyDescription}
              </p>
            )}
          </div>
          
          {contactInfo && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Contact</h3>
              <ul className="space-y-2">
                {contactInfo.address && (
                  <li className="text-sm text-slate-600">
                    <span className="sr-only">Address</span>
                    {contactInfo.address}
                  </li>
                )}
                {contactInfo.phone && (
                  <li className="text-sm text-slate-600">
                    <span className="sr-only">Phone</span>
                    <a
                      href={`tel:${contactInfo.phone}`}
                      className="hover:text-slate-900 transition-colors"
                    >
                      {contactInfo.phone}
                    </a>
                  </li>
                )}
                {contactInfo.email && (
                  <li className="text-sm text-slate-600">
                    <span className="sr-only">Email</span>
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="hover:text-slate-900 transition-colors"
                    >
                      {contactInfo.email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-slate-200 pt-8">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <p className="text-xs text-slate-600">
              {copyrightText || defaultCopyright}
            </p>
            <div className="flex space-x-6">
              <Link
                href="/privacy"
                className="text-xs text-slate-600 hover:text-slate-900 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-xs text-slate-600 hover:text-slate-900 transition-colors"
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