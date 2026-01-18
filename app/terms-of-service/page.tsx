import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { brandColors } from "@/lib/brand-colors";
import { ThemeToggle } from "@/components/theme-toggle";

export default function TermsOfService() {
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
              Terms of Service
            </h1>
            <p className={`text-sm ${brandColors.text.muted} mb-8`}>
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <div className={`space-y-8 ${brandColors.text.primary}`}>
              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  1. Acceptance of Terms
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  By accessing and using InvoCall (&apos;Service&apos;), you
                  accept and agree to be bound by the terms and provisions of
                  this agreement. If you do not agree to abide by the above,
                  please do not use this Service.
                </p>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  2. Description of Service
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  InvoCall provides a platform for automated AI voice calling and payment
                  collection reminders. Our Service includes tools for managing
                  customer contacts, scheduling calls, tracking collection status,
                  and generating reports.
                </p>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  3. User Accounts
                </h2>
                <div className="space-y-3">
                  <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                    To use certain features of the Service, you must register
                    for an account. When you register for an account, you agree
                    to:
                  </p>
                  <ul className={`list-disc list-inside space-y-1 ml-4 ${brandColors.text.secondary}`}>
                    <li>Provide accurate, current, and complete information</li>
                    <li>
                      Maintain and update your information to keep it accurate
                      and complete
                    </li>
                    <li>Maintain the security of your account credentials</li>
                    <li>
                      Accept responsibility for all activities that occur under
                      your account
                    </li>
                    <li>
                      Notify us immediately of any unauthorized use of your
                      account
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  4. Subscription and Payment
                </h2>
                <div className="space-y-3">
                  <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                    Some aspects of our Service are provided on a subscription
                    basis. By subscribing, you agree to:
                  </p>
                  <ul className={`list-disc list-inside space-y-1 ml-4 ${brandColors.text.secondary}`}>
                    <li>
                      Pay all applicable fees as described in our pricing plans
                    </li>
                    <li>
                      Provide current, complete, and accurate billing
                      information
                    </li>
                    <li>
                      Authorize us to charge your payment method on a recurring
                      basis
                    </li>
                    <li>
                      Be responsible for all charges incurred under your account
                    </li>
                  </ul>
                  <p className={`leading-relaxed mt-3 ${brandColors.text.secondary}`}>
                    Subscription fees are non-refundable except as required by
                    law. We reserve the right to change our subscription plans
                    or adjust pricing with 30 days&apos; notice.
                  </p>
                </div>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  5. User Responsibilities and Conduct
                </h2>
                <div className="space-y-3">
                  <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                    You agree to use the Service only for lawful purposes and in
                    accordance with these Terms. You agree not to:
                  </p>
                  <ul className={`list-disc list-inside space-y-1 ml-4 ${brandColors.text.secondary}`}>
                    <li>
                      Use the Service in any way that violates any applicable
                      laws or regulations
                    </li>
                    <li>
                      Harass, abuse, or harm another person through the Service
                    </li>
                    <li>
                      Impersonate any person or entity or misrepresent your
                      affiliation
                    </li>
                    <li>
                      Upload or transmit viruses or any other type of malicious
                      code
                    </li>
                    <li>
                      Attempt to gain unauthorized access to any portion of the
                      Service
                    </li>
                    <li>Interfere with or disrupt the Service or servers</li>
                    <li>
                      Use the Service to send spam or unsolicited communications
                    </li>
                    <li>Violate the privacy rights of others</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  6. Intellectual Property Rights
                </h2>
                <div className="space-y-3">
                  <h3 className="text-lg font-medium mb-2">
                    Our Intellectual Property
                  </h3>
                  <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                    The Service and its original content, features, and
                    functionality are owned by InvoCall and are protected by
                    international copyright, trademark, patent, trade secret,
                    and other intellectual property laws.
                  </p>

                  <h3 className="text-lg font-medium mb-2 mt-4">
                    Your Content
                  </h3>
                  <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                    You retain ownership of any content you create using our
                    Service. By using our Service, you grant us a worldwide,
                    non-exclusive, royalty-free license to use, reproduce, and
                    display your content solely for the purpose of providing the
                    Service to you.
                  </p>
                </div>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  7. Privacy
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  Your use of our Service is also governed by our Privacy
                  Policy. Please review our Privacy Policy, which also governs
                  the Site and informs users of our data collection practices.
                </p>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  8. Disclaimers
                </h2>
                <div className="space-y-3">
                  <p className={`leading-relaxed uppercase font-medium ${brandColors.text.secondary}`}>
                    The Service is provided on an &apos;AS IS&apos; and &apos;AS
                    AVAILABLE&apos; basis without warranties of any kind, either
                    express or implied, including but not limited to:
                  </p>
                  <ul className={`list-disc list-inside space-y-1 ml-4 ${brandColors.text.secondary}`}>
                    <li>Warranties of merchantability</li>
                    <li>Fitness for a particular purpose</li>
                    <li>Non-infringement</li>
                    <li>
                      That the Service will be uninterrupted or error-free
                    </li>
                    <li>That defects will be corrected</li>
                    <li>
                      That the Service is free of viruses or harmful components
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  9. Limitation of Liability
                </h2>
                <p className={`leading-relaxed uppercase font-medium ${brandColors.text.secondary}`}>
                  To the maximum extent permitted by law, InvoCall shall not
                  be liable for any indirect, incidental, special,
                  consequential, or punitive damages, or any loss of profits or
                  revenues, whether incurred directly or indirectly, or any loss
                  of data, use, goodwill, or other intangible losses resulting
                  from:
                </p>
                <ul className={`list-disc list-inside space-y-1 ml-4 mt-3 ${brandColors.text.secondary}`}>
                  <li>Your use or inability to use the Service</li>
                  <li>Any unauthorized access to or use of our servers</li>
                  <li>
                    Any interruption or cessation of transmission to or from the
                    Service
                  </li>
                  <li>
                    Any bugs, viruses, or similar harmful code transmitted
                    through the Service
                  </li>
                  <li>Any errors or omissions in any content</li>
                </ul>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  10. Indemnification
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  You agree to defend, indemnify, and hold harmless InvoCall
                  and its affiliates, officers, directors, employees, and agents
                  from and against any claims, liabilities, damages, judgments,
                  awards, losses, costs, expenses, or fees arising out of or
                  relating to your violation of these Terms or your use of the
                  Service.
                </p>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  11. Termination
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  We may terminate or suspend your account and bar access to the
                  Service immediately, without prior notice or liability, under
                  our sole discretion, for any reason whatsoever, including
                  without limitation if you breach the Terms. Upon termination,
                  your right to use the Service will cease immediately.
                </p>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  12. Governing Law
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  These Terms shall be governed and construed in accordance with
                  the laws of [Your Jurisdiction], without regard to its
                  conflict of law provisions. Our failure to enforce any right
                  or provision of these Terms will not be considered a waiver of
                  those rights.
                </p>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  13. Changes to Terms
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  We reserve the right, at our sole discretion, to modify or
                  replace these Terms at any time. If a revision is material, we
                  will provide at least 30 days notice prior to any new terms
                  taking effect.
                </p>
              </section>

              <section>
                <h2 className={`text-2xl font-semibold mb-4 ${brandColors.text.primary}`}>
                  14. Contact Information
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  If you have any questions about these Terms, please contact us
                  at:
                </p>
                <div className={`mt-3 space-y-1 ${brandColors.text.secondary}`}>
                  <p>Email: legal@invocall.ai</p>
                  <p>Address: [Your Company Address]</p>
                </div>
              </section>

              <section className={`pt-8 border-t ${brandColors.border.default}`}>
                <p className={`text-sm ${brandColors.text.secondary}`}>
                  By using InvoCall, you acknowledge that you have read,
                  understood, and agree to be bound by these Terms of Service.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
