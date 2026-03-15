import Link from "next/link";
import { brandColors } from "@/lib/brand-colors";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Privacy Policy – InvoCall",
  description:
    "How InvoCall collects, uses, and protects your personal data and your customers' data.",
};

const LAST_UPDATED = "March 10, 2025";
const CONTACT_EMAIL = "priyanshutiwary711@gmail.com";

export default function PrivacyPolicy() {
  return (
    <div
      className={`min-h-screen relative overflow-hidden ${brandColors.backgrounds.hero}`}
    >
      {/* Background */}
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

        <Card
          className={`${brandColors.backgrounds.glass} backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 dark:ring-white/10 rounded-[24px] border-0`}
        >
          <CardContent className="p-8 md:p-12">
            <h1
              className={`text-3xl md:text-4xl font-bold mb-3 ${brandColors.text.gradient}`}
            >
              Privacy Policy
            </h1>
            <p className={`text-sm ${brandColors.text.muted} mb-10`}>
              Last updated: {LAST_UPDATED}
            </p>

            <div className={`space-y-10 ${brandColors.text.primary}`}>

              {/* 1. Introduction */}
              <section>
                <h2 className={`text-xl font-semibold mb-3 ${brandColors.text.primary}`}>
                  1. Who We Are
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  InvoCall is an AI-powered payment reminder platform that helps
                  businesses automate follow-ups on outstanding invoices via
                  automated voice calls and SMS. This Privacy Policy explains
                  what personal data we collect, why we collect it, and how we
                  handle it — including data belonging to your end customers
                  (debtors) that you provide to us.
                </p>
              </section>

              {/* 2. Data We Collect */}
              <section>
                <h2 className={`text-xl font-semibold mb-3 ${brandColors.text.primary}`}>
                  2. Data We Collect
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">2.1 Account Data (about you, our user)</h3>
                    <ul className={`list-disc list-inside space-y-1 ml-3 ${brandColors.text.secondary}`}>
                      <li>Name and email address (on registration)</li>
                      <li>Google account name, email, and profile picture (when using Google Sign-In)</li>
                      <li>Profile photo (if uploaded)</li>
                      <li>Business name, industry, support phone number, and business description (entered in Business Profile)</li>
                      <li>Subscription and billing information (processed by our payment provider)</li>
                      <li>Session tokens and IP address (for authentication and security)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">2.2 Third-Party Integration Data (from connected services)</h3>
                    <p className={`mb-2 ${brandColors.text.secondary}`}>
                      When you connect external services, we access and store the following data on your behalf:
                    </p>
                    <ul className={`list-disc list-inside space-y-1 ml-3 ${brandColors.text.secondary}`}>
                      <li>
                        <strong>Zoho Books:</strong> Invoice records (invoice numbers, amounts, due dates, statuses) and customer records (names, company names, phone numbers, email addresses). Accessed via Zoho OAuth with read-only scopes.
                      </li>
                      <li>
                        <strong>Google Sheets:</strong> Rows from the specific spreadsheet you link — typically invoice and customer data. Accessed via Google OAuth with read-only scope (<code className="text-xs bg-muted px-1 rounded">spreadsheets.readonly</code>). We only read the sheet you explicitly select.
                      </li>
                      <li>
                        <strong>Excel Upload:</strong> Invoice and customer data from .xlsx files you upload manually.
                      </li>
                    </ul>
                    <p className={`mt-2 text-sm ${brandColors.text.muted}`}>
                      OAuth access tokens and refresh tokens for these integrations are securely encrypted before being stored in our database.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">2.3 Your Customers&apos; Data (debtor data)</h3>
                    <p className={`${brandColors.text.secondary}`}>
                      To deliver payment reminders, we store your customers&apos; names,
                      phone numbers, and email addresses. This data is sourced
                      exclusively from the integrations you connect (Zoho Books,
                      Google Sheets, or Excel) or from information you enter
                      directly. We use this data only to execute automated voice
                      calls and SMS messages on your behalf. We do not sell, rent,
                      or use this data for any other purpose.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">2.4 Call and Reminder Data</h3>
                    <ul className={`list-disc list-inside space-y-1 ml-3 ${brandColors.text.secondary}`}>
                      <li>Scheduled reminder dates and times</li>
                      <li>Call outcomes (answered, unanswered, voicemail)</li>
                      <li>Delivery status of SMS messages</li>
                      <li>Retry attempts and timestamps</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">2.5 Technical Data</h3>
                    <ul className={`list-disc list-inside space-y-1 ml-3 ${brandColors.text.secondary}`}>
                      <li>Browser type and version</li>
                      <li>IP address</li>
                      <li>Device information</li>
                      <li>Pages visited and features used within the app</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* 3. How We Use Your Data */}
              <section>
                <h2 className={`text-xl font-semibold mb-3 ${brandColors.text.primary}`}>
                  3. How We Use Your Data
                </h2>
                <ul className={`list-disc list-inside space-y-2 ml-3 ${brandColors.text.secondary}`}>
                  <li>To create and maintain your InvoCall account</li>
                  <li>To authenticate you securely (email/password or Google Sign-In)</li>
                  <li>To sync invoice and customer records from your connected integrations</li>
                  <li>To schedule, execute, and track automated voice call and SMS payment reminders to your customers</li>
                  <li>To display your invoices, customers, and reminder history inside the dashboard</li>
                  <li>To process your subscription payments</li>
                  <li>To send you transactional emails (email verification, password reset, reminder activity summaries)</li>
                  <li>To detect and prevent fraud, abuse, and unauthorized access</li>
                  <li>To comply with applicable legal obligations</li>
                </ul>
                <p className={`mt-3 text-sm ${brandColors.text.muted}`}>
                  We do <strong>not</strong> use your data or your customers&apos; data for advertising, profiling, or sale to third parties.
                </p>
              </section>

              {/* 4. Google User Data */}
              <section>
                <h2 className={`text-xl font-semibold mb-3 ${brandColors.text.primary}`}>
                  4. Google User Data (Limited Use Disclosure)
                </h2>
                <p className={`leading-relaxed mb-3 ${brandColors.text.secondary}`}>
                  InvoCall&apos;s use of data received from Google APIs adheres to the{" "}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Google API Services User Data Policy
                  </a>
                  , including the Limited Use requirements.
                </p>
                <ul className={`list-disc list-inside space-y-2 ml-3 ${brandColors.text.secondary}`}>
                  <li>
                    <strong>What we access:</strong> When you connect Google Sheets, we request read-only access to the specific spreadsheet you link. We use the scope <code className="text-xs bg-muted px-1 rounded">spreadsheets.readonly</code>.
                  </li>
                  <li>
                    <strong>Why we access it:</strong> Solely to read invoice and customer rows from your selected spreadsheet so InvoCall can schedule payment reminders on your behalf.
                  </li>
                  <li>
                    <strong>What we do not do:</strong> We do not read any other spreadsheets or Google Drive files. We do not share Google Sheets data with any third parties. We do not use this data for advertising or AI/ML training.
                  </li>
                  <li>
                    <strong>Token storage:</strong> Google OAuth access tokens and refresh tokens are securely encrypted before being stored in our database.
                  </li>
                  <li>
                    <strong>Revocation:</strong> You can disconnect Google Sheets at any time from the Integrations page. When you disconnect, we revoke the OAuth tokens and delete all associated data.
                  </li>
                </ul>
              </section>

              {/* 5. Third-Party Services */}
              <section>
                <h2 className={`text-xl font-semibold mb-3 ${brandColors.text.primary}`}>
                  5. Third-Party Services We Use
                </h2>
                <p className={`mb-3 ${brandColors.text.secondary}`}>
                  We rely on carefully selected, industry-standard third-party service providers to deliver InvoCall&apos;s core features. These include providers for database hosting, secure payment processing, voice network infrastructure, SMS delivery, and file storage.
                </p>
                <p className={`mt-3 text-sm ${brandColors.text.muted}`}>
                  We ensure that all our third-party vendors comply with applicable data protection laws. Each of these providers has their own privacy policies governing their handling of data.
                </p>
              </section>

              {/* 6. Data Security */}
              <section>
                <h2 className={`text-xl font-semibold mb-3 ${brandColors.text.primary}`}>
                  6. Data Security
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  We take data security seriously. Measures we implement include:
                </p>
                <ul className={`list-disc list-inside mt-2 space-y-1 ml-3 ${brandColors.text.secondary}`}>
                  <li>Encryption of data both at rest and in transit</li>
                  <li>Industry-standard authentication and session management</li>
                  <li>Continuous monitoring for unauthorized access attempts</li>
                  <li>Strict access controls to production environments</li>
                </ul>
                <p className={`mt-3 ${brandColors.text.secondary}`}>
                  No method of electronic transmission or storage is 100% secure.
                  While we implement strong safeguards, we cannot guarantee
                  absolute security.
                </p>
              </section>

              {/* 7. Data Retention */}
              <section>
                <h2 className={`text-xl font-semibold mb-3 ${brandColors.text.primary}`}>
                  7. Data Retention
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  We retain your account data and your customers&apos; data for as
                  long as your account is active. If you close your account, we
                  will delete your personal data within 30 days, except where we
                  are required to retain it for legal or accounting purposes.
                  Integration data (e.g., OAuth tokens for Zoho, Google) is
                  deleted immediately when you disconnect an integration.
                </p>
              </section>

              {/* 8. Your Rights */}
              <section>
                <h2 className={`text-xl font-semibold mb-3 ${brandColors.text.primary}`}>
                  8. Your Rights
                </h2>
                <p className={`mb-3 ${brandColors.text.secondary}`}>
                  Depending on your location, you may have the following rights:
                </p>
                <ul className={`list-disc list-inside space-y-1 ml-3 ${brandColors.text.secondary}`}>
                  <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                  <li><strong>Correction:</strong> Ask us to correct inaccurate or incomplete data</li>
                  <li><strong>Deletion:</strong> Ask us to delete your account and associated data</li>
                  <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
                  <li><strong>Objection:</strong> Object to certain processing of your data</li>
                  <li><strong>Revoke integration access:</strong> Disconnect any third-party integration at any time from the Integrations page</li>
                </ul>
                <p className={`mt-3 ${brandColors.text.secondary}`}>
                  To exercise any of these rights, email us at{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>
              </section>

              {/* 9. Children */}
              <section>
                <h2 className={`text-xl font-semibold mb-3 ${brandColors.text.primary}`}>
                  9. Children&apos;s Privacy
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  InvoCall is a business tool intended for users aged 18 and
                  above. We do not knowingly collect data from children under 13.
                  If you believe a child has created an account, please contact us
                  and we will delete the account promptly.
                </p>
              </section>

              {/* 10. International Transfers */}
              <section>
                <h2 className={`text-xl font-semibold mb-3 ${brandColors.text.primary}`}>
                  10. International Data Transfers
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  Our servers and third-party service providers may be located
                  outside your country. By using InvoCall, you consent to the
                  transfer of your data to these locations. We take steps to
                  ensure that transferred data is protected in line with this
                  Privacy Policy.
                </p>
              </section>

              {/* 11. Changes */}
              <section>
                <h2 className={`text-xl font-semibold mb-3 ${brandColors.text.primary}`}>
                  11. Changes to This Policy
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  We may update this Privacy Policy from time to time. When we
                  do, we will update the &quot;Last updated&quot; date at the top. For
                  significant changes, we will notify you by email or by a notice
                  in the dashboard.
                </p>
              </section>

              {/* 12. Contact */}
              <section>
                <h2 className={`text-xl font-semibold mb-3 ${brandColors.text.primary}`}>
                  12. Contact Us
                </h2>
                <p className={`leading-relaxed ${brandColors.text.secondary}`}>
                  If you have any questions about this Privacy Policy or want to
                  exercise any of your rights, please contact us:
                </p>
                <div className={`mt-3 space-y-1 ${brandColors.text.secondary}`}>
                  <p>
                    Email:{" "}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
                      {CONTACT_EMAIL}
                    </a>
                  </p>
                </div>
              </section>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
