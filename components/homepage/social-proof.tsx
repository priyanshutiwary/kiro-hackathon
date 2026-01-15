import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { brandColors } from "@/lib/brand-colors";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CFO, TechFlow Solutions",
    content: "Reduced our overdue invoices by 73% in the first month. The AI payment reminder calls are professional and effective. Our DSO improved dramatically.",
    rating: 5,
    initials: "SC",
  },
  {
    name: "Michael Rodriguez",
    role: "Owner, Rodriguez Consulting",
    content: "Game changer for cash flow management. Automated payment collection saves us 15 hours per week. Customers appreciate the polite reminders.",
    rating: 5,
    initials: "MR",
  },
  {
    name: "Emily Watson",
    role: "Finance Director, BuildCo",
    content: "The Zoho integration is seamless. Everything syncs automatically, and the analytics help us optimize our accounts receivable strategy.",
    rating: 5,
    initials: "EW",
  },
];

const stats = [
  { value: "85%", label: "Collection Success Rate" },
  { value: "10k+", label: "Payment Calls Made" },
  { value: "73%", label: "Faster Payment Collection" },
  { value: "4.9/5", label: "Customer Satisfaction" },
];

export default function SocialProof() {
  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Stats Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold ${brandColors.text.primary}`}>
              Trusted by businesses worldwide for payment collection
            </h2>
            <p className={`mt-3 text-lg ${brandColors.text.secondary}`}>
              Real results from real businesses using AI-powered payment reminders
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border ${brandColors.border.accent} backdrop-blur-xl`}
              >
                <div className={`text-4xl font-bold ${brandColors.text.gradient}`}>
                  {stat.value}
                </div>
                <div className={`mt-2 text-sm ${brandColors.text.muted}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className={`p-6 hover:shadow-xl transition-all ${brandColors.backgrounds.card} ${brandColors.border.default} backdrop-blur-xl rounded-2xl`}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className={`${brandColors.text.secondary} mb-6 leading-relaxed`}>
                "{testimonial.content}"
              </p>
              <div className="flex items-center gap-3">
                <Avatar className={`h-10 w-10 ${brandColors.primary.gradientBr} shadow-lg shadow-blue-500/30`}>
                  <AvatarFallback className="text-white font-semibold">
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className={`font-semibold ${brandColors.text.primary}`}>
                    {testimonial.name}
                  </div>
                  <div className={`text-sm ${brandColors.text.muted}`}>
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
