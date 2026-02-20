import Link from "next/link";
import { Metadata } from 'next';
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
  ShieldCheck,
  LogIn
} from "lucide-react";

export const metadata: Metadata = {
  title: 'Kinn - Your AI Personal Assistant in LINE',
  description: 'Manage tasks, split bills, and organize your life with a simple chat. No new apps to download.',
  openGraph: {
    title: 'Kinn - AI Personal Assistant',
    description: 'Your personal executive assistant within LINE. Task management, bill splitting, and daily briefings.',
    type: 'website',
  }
};

export default function Home() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-charcoal dark:text-gray-100 antialiased selection:bg-primary/20 min-h-screen">
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md bg-white/80 dark:bg-background-dark/80 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            Kinn.
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="https://line.me/R/ti/p/@868vgnmz"
              target="_blank"
              className="hidden sm:flex text-sm font-semibold text-charcoal dark:text-white hover:text-primary transition-colors gap-1 items-center"
            >
              <UserPlus size={16} /> Add Friend
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-charcoal dark:bg-white text-white dark:text-charcoal text-sm font-bold hover:opacity-90 transition-all shadow-md"
            >
              <LogIn size={16} />
              Login with LINE
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full bg-white dark:bg-background-dark min-h-screen overflow-hidden relative">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 relative overflow-hidden max-w-7xl mx-auto">
          {/* Decorative gradient blur */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            <div className="flex-1 text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                AI-Powered Productivity
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-charcoal dark:text-white leading-[1.15] mb-6 tracking-tight">
                Your Personal Assistant in <span className="text-primary">LINE</span>
              </h1>
              <p className="text-lg sm:text-xl text-charcoal-light dark:text-gray-400 mb-10 leading-relaxed font-medium max-w-2xl mx-auto lg:mx-0">
                Delegate the mundane. Manage tasks, split bills, and get daily briefings just by chatting. No new apps to learn.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center w-full sm:w-auto py-4 px-8 bg-primary hover:bg-primary-dark text-white text-lg font-bold rounded-full shadow-soft hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="flex items-center justify-center w-full sm:w-auto py-4 px-8 bg-white dark:bg-gray-800 text-charcoal dark:text-white border border-gray-200 dark:border-gray-700 text-lg font-bold rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
                >
                  How it works
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Free Forever Plan
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" /> No Credit Card
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="flex-1 w-full max-w-lg lg:max-w-xl relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-[2.5rem] blur-2xl transform rotate-3"></div>
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800">
                <img
                  alt="App Interface"
                  className="w-full h-auto object-cover"
                  src="https://images.unsplash.com/photo-1512428559083-a4051ba83fb3?auto=format&fit=crop&q=80&w=800"
                />
                {/* Overlay UI Mockup (CSS only for effect) */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/20">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary mb-1">YOU</p>
                      <p className="text-sm font-medium text-charcoal dark:text-white">Remind me to pay electricity bill 5000 THB tomorrow</p>
                    </div>
                  </div>
                  <div className="mt-3 pl-12">
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="text-xs font-bold text-primary mb-1">KINN</p>
                      <p className="text-sm text-charcoal dark:text-white">✅ Task created! I'll remind you tomorrow at 9:00 AM.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-primary font-bold tracking-wider uppercase text-sm mb-3">Workflow</h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-charcoal dark:text-white">Productivity on Autopilot</h3>
              <p className="mt-4 text-gray-500 max-w-2xl mx-auto">Seamlessly integrated into your daily chat. No complex dashboards to learn.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: UserPlus, title: "1. Add Friend", desc: "Add Kinn as a LINE friend. No app installation required." },
                { icon: MessageSquare, title: "2. Just Chat", desc: "Type naturally: 'Meeting tomorrow at 10am' or 'Bill 500 split 3'." },
                { icon: CheckCircle, title: "3. Get Done", desc: "Kinn creates tasks, sends reminders, and tracks expenses automatically." }
              ].map((step, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                  <div className="absolute top-0 right-0 bg-primary/5 w-24 h-24 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                    <step.icon size={28} />
                  </div>
                  <h4 className="text-xl font-bold mb-3">{step.title}</h4>
                  <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-6 bg-white dark:bg-background-dark">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-primary font-bold tracking-wider uppercase text-sm mb-3">Features</h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-charcoal dark:text-white">Everything You Need</h3>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: FileText, title: "Smart Tasks", desc: "Natural language processing extracts dates, times, and priorities.", color: "blue" },
                { icon: Utensils, title: "Bill Splitting", desc: "Scan slips or type amounts. We calculate who owes what effortlessly.", color: "orange" },
                { icon: Gift, title: "Gamification", desc: "Earn points for completing tasks. Level up and compete with friends.", color: "purple" },
                { icon: ShieldCheck, title: "Group Mode", desc: "Collaborate with family or teams. Assign tasks and track progress together.", color: "green" }
              ].map((service, idx) => (
                <div key={idx} className="group p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-primary/30 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl bg-${service.color}-100 dark:bg-${service.color}-900/30 text-${service.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <service.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-charcoal dark:text-white mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section (Simplified) */}
        <section className="py-20 px-6 bg-background-light dark:bg-background-dark border-t border-gray-100 dark:border-gray-800" id="pricing">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-10">Simple, Transparent Pricing</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">

              {/* Free Plan */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-2">Starter</h3>
                <div className="text-4xl font-extrabold mb-6">Free</div>
                <ul className="text-left space-y-3 mb-8 text-gray-600 dark:text-gray-400">
                  <li className="flex gap-2"><Check size={18} className="text-green-500" /> Unlimited Tasks</li>
                  <li className="flex gap-2"><Check size={18} className="text-green-500" /> Basic Reminders</li>
                  <li className="flex gap-2"><Check size={18} className="text-green-500" /> 1 Group</li>
                </ul>
                <Link href="/dashboard" className="block w-full py-3 rounded-xl border-2 border-charcoal dark:border-white font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition">Get Started</Link>
              </div>

              {/* Pro Plan */}
              <div className="bg-charcoal dark:bg-white text-white dark:text-charcoal p-8 rounded-3xl shadow-xl relative transform md:scale-105">
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">POPULAR</div>
                <h3 className="text-xl font-bold mb-2">Pro Executive</h3>
                <div className="text-4xl font-extrabold mb-6">฿199<span className="text-lg font-normal opacity-70">/mo</span></div>
                <ul className="text-left space-y-3 mb-8 text-gray-300 dark:text-gray-600">
                  <li className="flex gap-2"><Check size={18} className="text-primary" /> AI Smart Analysis</li>
                  <li className="flex gap-2"><Check size={18} className="text-primary" /> Recurring Tasks</li>
                  <li className="flex gap-2"><Check size={18} className="text-primary" /> Unlimited Groups</li>
                  <li className="flex gap-2"><Check size={18} className="text-primary" /> Weekly & Monthly Reports</li>
                </ul>
                <Link href="/dashboard/subscription" className="block w-full py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold transition shadow-lg">Upgrade to Pro</Link>
              </div>

            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pt-16 pb-8 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <div className="text-2xl font-bold text-primary mb-2">Kinn.</div>
              <p className="text-sm text-gray-500">Your AI Personal Assistant in LINE.</p>
            </div>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="https://line.me/R/ti/p/@868vgnmz" className="text-sm text-gray-500 hover:text-primary transition-colors">Add LINE Friend</Link>
            </div>
            <p className="text-xs text-gray-400">
              © 2026 Kinn Services. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

