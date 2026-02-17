import Link from "next/link";
import {
  ArrowRight,
  Check,
  UserPlus,
  MessageSquare,
  CheckCircle,
  Utensils,
  Plane,
  FileText,
  Gift,
  Quote,
  ShieldCheck
} from "lucide-react";

export default function Home() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-charcoal dark:text-gray-100 antialiased selection:bg-primary/20 min-h-screen">
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md bg-white/80 dark:bg-background-dark/80 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-md mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-primary">Kinn.</Link>
          <Link href="/admin/login" className="text-sm font-semibold text-charcoal dark:text-white hover:text-primary transition-colors">Log In</Link>
        </div>
      </header>

      <main className="max-w-md mx-auto bg-white dark:bg-background-dark min-h-screen shadow-2xl overflow-hidden relative">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6 relative overflow-hidden">
          {/* Decorative gradient blur */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Premium Concierge
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-charcoal dark:text-white leading-[1.15] mb-6 tracking-tight">
              Your Personal Executive Assistant in <span className="text-primary">LINE</span>
            </h1>
            <p className="text-lg text-charcoal-light dark:text-gray-400 mb-10 leading-relaxed font-medium">
              Delegate the mundane. Reclaim your time. Professional support, just one message away.
            </p>
            <div className="w-full space-y-4">
              <Link
                href="#pricing"
                className="flex items-center justify-center w-full py-4 px-8 bg-primary hover:bg-primary-dark text-white text-lg font-bold rounded-full shadow-soft hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                <Check className="w-4 h-4" /> No credit card required
              </div>
            </div>
          </div>
          {/* Abstract Image showing phone interaction */}
          <div className="mt-12 relative rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-background-dark via-transparent to-transparent z-10 opacity-50"></div>
            <img
              alt="Close up of hands holding a smartphone typing a message"
              className="w-full h-64 object-cover"
              src="https://images.unsplash.com/photo-1512428559083-a4051ba83fb3?auto=format&fit=crop&q=80&w=800"
            />
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 px-6 bg-background-light dark:bg-gray-900/50 rounded-t-[2.5rem]">
          <div className="text-center mb-12">
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Workflow</h2>
            <h3 className="text-2xl font-bold text-charcoal dark:text-white">Seamless Integration</h3>
          </div>
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200 dark:bg-gray-800"></div>
            <div className="space-y-10 relative">
              {/* Step 1 */}
              <div className="flex items-start gap-6">
                <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-white dark:bg-gray-800 border-2 border-primary shadow-sm flex items-center justify-center text-primary">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div className="pt-1">
                  <h4 className="text-lg font-bold text-charcoal dark:text-white mb-1">Add Kinn on LINE</h4>
                  <p className="text-charcoal-light dark:text-gray-400 text-sm leading-relaxed">Simply add our official account. No new apps to download or learn.</p>
                </div>
              </div>
              {/* Step 2 */}
              <div className="flex items-start gap-6">
                <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-white dark:bg-gray-800 border-2 border-primary shadow-sm flex items-center justify-center text-primary">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="pt-1">
                  <h4 className="text-lg font-bold text-charcoal dark:text-white mb-1">Send Your Request</h4>
                  <p className="text-charcoal-light dark:text-gray-400 text-sm leading-relaxed">Text us anything: &ldquo;Book a table for 2 at Gage tonight at 8pm.&rdquo;</p>
                </div>
              </div>
              {/* Step 3 */}
              <div className="flex items-start gap-6">
                <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center text-white">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="pt-1">
                  <h4 className="text-lg font-bold text-charcoal dark:text-white mb-1">Consider It Done</h4>
                  <p className="text-charcoal-light dark:text-gray-400 text-sm leading-relaxed">Our team handles the logistics and confirms when it&apos;s complete.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16 px-6 bg-white dark:bg-background-dark">
          <div className="flex flex-col gap-2 mb-10">
            <h2 className="text-3xl font-bold text-charcoal dark:text-white">Curated Services</h2>
            <p className="text-charcoal-light dark:text-gray-400">Tailored support for your busy lifestyle.</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {/* Service Cards */}
            {[
              { icon: Utensils, title: "Dining Reservations", desc: "Secure tables at exclusive restaurants and handle last-minute bookings.", color: "orange" },
              { icon: Plane, title: "Travel Logistics", desc: "Flights, hotels, and detailed itineraries organized seamlessly.", color: "blue" },
              { icon: FileText, title: "Document Prep", desc: "Formatting, proofreading, and summary generation for executives.", color: "purple" },
              { icon: Gift, title: "Gift Sourcing", desc: "Thoughtful gifts found, wrapped, and delivered for any occasion.", color: "pink" }
            ].map((service, idx) => (
              <div key={idx} className="group p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-primary/30 shadow-card hover:shadow-soft transition-all duration-300">
                <div className={`w-10 h-10 rounded-full bg-${service.color}-50 dark:bg-${service.color}-900/20 text-${service.color}-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <service.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-charcoal dark:text-white mb-2">{service.title}</h3>
                <p className="text-sm text-charcoal-light dark:text-gray-400">{service.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 px-6 bg-background-light dark:bg-background-dark" id="pricing">
          <div className="relative p-1 rounded-[2.5rem] bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800 shadow-xl">
            {/* Premium Border Effect */}
            <div className="bg-white dark:bg-gray-900 rounded-[2.25rem] p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
              <h3 className="text-sm font-bold text-primary tracking-widest uppercase mb-4">Membership</h3>
              <h2 className="text-3xl font-extrabold text-charcoal dark:text-white mb-2">The Executive</h2>
              <div className="flex items-baseline justify-center gap-1 mb-8">
                <span className="text-4xl font-bold text-charcoal dark:text-white">$199</span>
                <span className="text-gray-400 font-medium">/month</span>
              </div>
              <ul className="space-y-4 mb-8 text-left">
                {[
                  "Unlimited requests",
                  "Dedicated assistant",
                  "24/7 Priority support",
                  "Monthly expense reporting"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-charcoal-light dark:text-gray-300">
                    <Check className="text-primary w-5 h-5" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-4 bg-charcoal dark:bg-white text-white dark:text-charcoal font-bold rounded-full hover:opacity-90 transition-opacity">
                Join Kinn
              </button>
              <p className="mt-4 text-xs text-gray-400">Cancel anytime. 7-day money-back guarantee.</p>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-12 px-8 text-center bg-white dark:bg-background-dark">
          <Quote className="w-8 h-8 text-primary/30 mx-auto mb-4" />
          <p className="text-xl font-medium text-charcoal dark:text-white italic mb-6">
            &ldquo;Kinn has completely changed how I manage my personal life. It&apos;s like having a magic wand in my pocket.&rdquo;
          </p>
          <div className="flex items-center justify-center gap-3">
            <img
              alt="Portrait of Sarah Jenkins"
              className="w-10 h-10 rounded-full object-cover"
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"
            />
            <div className="text-left">
              <p className="text-sm font-bold text-charcoal dark:text-white">Sarah Jenkins</p>
              <p className="text-xs text-gray-400">CEO, TechFlow</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-50 dark:bg-gray-900 pt-16 pb-8 px-6 rounded-t-[3rem]">
          <div className="flex flex-col items-center text-center">
            {/* Trust Badge */}
            <div className="flex flex-col items-center mb-10 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 w-full max-w-xs">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-charcoal dark:text-white mb-1">100% Secure & Private</h4>
              <p className="text-xs text-gray-400">We are PDPA compliant and use bank-grade 256-bit encryption for all your data.</p>
            </div>
            <div className="text-2xl font-bold text-primary mb-6">Kinn.</div>
            <div className="flex gap-6 mb-8">
              <Link href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Privacy</Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Terms</Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-primary transition-colors">Contact</Link>
            </div>
            <p className="text-xs text-gray-400">
              © 2024 Kinn Services. All rights reserved.<br />
              Operating within LINE app.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
