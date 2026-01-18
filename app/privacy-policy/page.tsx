import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { brandColors } from "@/lib/brand-colors";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PrivacyPolicy() {
  return (
    <div className={`min-h-screen relative overflow-hidden ${brandColors.backgrounds.hero}`}>
      {/* Background Elements */}
      <div className={`absolute inset-0 ${brandColors.backgrounds.hero}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(148,163,184,0.1),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(148,163,184,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl relative z-10">
        <div className="mb-8">
          <Link
            href="/"
            className={`text-sm ${brandColors.text.secondary} hover:${brandColors.text.primary} transition-colors flex items-center gap-1`}
          >
            ← Back to home
          </Link>
        </div>

        <Card className={`${brandColors.backgrounds.glass} backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-white/10 rounded-[24px] border-0`}>
          <CardContent className="p-8 md:p-12">
            <h1 className={`text-3xl md:text-4xl font-bold mb-8 ${brandColors.text.gradient}`}>
              Privacy Policy
            </h1>
            <p className={`text-sm ${brandColors.text.muted} mb-8`}>
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <div className={`space-y-8 ${brandColors.text.primary}`}>
              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  1. Introduction
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  Welcome to InvoCall (&apos;we,&apos; &apos;our,&apos; or
                  &apos;us&apos;). We are committed to protecting your personal
                  information and your right to privacy. This Privacy Policy
                  explains how we collect, use, disclose, and safeguard your
                  information when you use our service.
                </p>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  2. Information We Collect
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Personal Information
                    </h3>
                    <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                      When you register for an account, we collect:
                    </p>
                    <ul className={`list-disc list-inside mt-2 space-y-1 ml-4 ${brandColors.text.secondary}`}>
                      <li>Name</li>
                      <li>Email address</li>
                      <li>
                        Google account information (when using Google Sign-In)
                      </li>
                      <li>Organization details</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Usage Information
                    </h3>
                    <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                      When you use our services, we store:
                    </p>
                    <ul className={`list-disc list-inside mt-2 space-y-1 ml-4 ${brandColors.text.secondary}`}>
                      <li>Call logs and transcripts</li>
                      <li>Contact lists and customer details</li>
                      <li>Usage analytics</li>
                      <li>Payment and subscription history</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Automatically Collected Information
                    </h3>
                    <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                      We automatically collect certain information when you use
                      our service:
                    </p>
                    <ul className={`list-disc list-inside mt-2 space-y-1 ml-4 ${brandColors.text.secondary}`}>
                      <li>IP address</li>
                      <li>Browser type and version</li>
                      <li>Device information</li>
                      <li>Usage data and analytics</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  3. How We Use Your Information
                </h2>
                <p className={`leading-relaxed mb-3 ${brandColors.text.secondary}`}>
                  We use your information to:
                </p>
                <ul className={`list-disc list-inside space-y-1 ml-4 ${brandColors.text.secondary}`}>
                  <li>Provide and maintain our service</li>
                  <li>Create and manage your account</li>
                  <li>Process automated calls and reminders</li>
                  <li>Send you important updates and notifications</li>
                  <li>Respond to your inquiries and support requests</li>
                  <li>Monitor and analyze usage patterns</li>
                  <li>Improve our service and develop new features</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  4. Data Sharing and Disclosure
                </h2>
                <p className={`leading-relaxed mb-3 ${brandColors.text.secondary}`}>
                  We may share your information in the following situations:
                </p>
                <ul className={`list-disc list-inside space-y-1 ml-4 ${brandColors.text.secondary}`}>
                  <li>
                    <strong>With your consent:</strong> We may share your
                    information for any purpose with your explicit consent
                  </li>
                  <li>
                    <strong>Service providers:</strong> We share data with
                    third-party vendors who assist in providing our services
                  </li>
                  <li>
                    <strong>Legal requirements:</strong> We may disclose
                    information if required by law or valid legal process
                  </li>
                  <li>
                    <strong>Business transfers:</strong> In connection with any
                    merger, sale, or acquisition
                  </li>
                  <li>
                    <strong>Protection of rights:</strong> To protect our
                    rights, privacy, safety, or property
                  </li>
                </ul>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  5. Third-Party Services
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  We use the following third-party services that may collect
                  information:
                </p>
                <ul className={`list-disc list-inside mt-2 space-y-1 ml-4 ${brandColors.text.secondary}`}>
                  <li>
                    <strong>Google Sign-In:</strong> For authentication services
                  </li>
                  <li>
                    <strong>Payment processors:</strong> For handling
                    subscription payments
                  </li>
                  <li>
                    <strong>Analytics services:</strong> To understand service
                    usage
                  </li>
                  <li>
                    <strong>CRM Providers:</strong> Integration with Zoho CRM, etc.
                  </li>
                </ul>
                <p className={`mt-3 leading-relaxed ${brandColors.text.secondary}`}>
                  These services have their own privacy policies governing the
                  use of your information.
                </p>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  6. Data Security
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  We implement appropriate technical and organizational security
                  measures to protect your personal information. However, no
                  method of transmission over the Internet or electronic storage
                  is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  7. Data Retention
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  We retain your personal information for as long as necessary
                  to provide our services and fulfill the purposes outlined in
                  this Privacy Policy. We will also retain and use your
                  information to comply with legal obligations, resolve
                  disputes, and enforce our agreements.
                </p>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  8. Your Rights
                </h2>
                <p className={`leading-relaxed mb-3 ${brandColors.text.secondary}`}>
                  Depending on your location, you may have the following rights:
                </p>
                <ul className={`list-disc list-inside space-y-1 ml-4 ${brandColors.text.secondary}`}>
                  <li>
                    <strong>Access:</strong> Request access to your personal
                    information
                  </li>
                  <li>
                    <strong>Correction:</strong> Request correction of
                    inaccurate information
                  </li>
                  <li>
                    <strong>Deletion:</strong> Request deletion of your personal
                    information
                  </li>
                  <li>
                    <strong>Portability:</strong> Request a copy of your data in
                    a portable format
                  </li>
                  <li>
                    <strong>Objection:</strong> Object to certain processing of
                    your information
                  </li>
                </ul>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  9. Children&apos;s Privacy
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  Our service is not intended for children under 13 years of
                  age. We do not knowingly collect personal information from
                  children under 13. If you are a parent or guardian and believe
                  your child has provided us with personal information, please
                  contact us.
                </p>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  10. International Data Transfers
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  Your information may be transferred to and processed in
                  countries other than your country of residence. These
                  countries may have data protection laws that are different
                  from the laws of your country.
                </p>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  11. Updates to This Policy
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  We may update this Privacy Policy from time to time. We will
                  notify you of any changes by posting the new Privacy Policy on
                  this page and updating the &apos;Last updated&apos; date.
                </p>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  12. Contact Us
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  If you have any questions about this Privacy Policy or our
                  data practices, please contact us at:
                </p>
                <div className={`mt-3 space-y-1 ${brandColors.text.secondary}`}>
                  <p>Email: privacy@invocall.ai</p>
                  <p>Address: [Your Company Address]</p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
