"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  Zap,
  Eye,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Video,
  Brush,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Zap,
    title: "Smart Income Split",
    description:
      "Every payment is routed instantly. Tax reserve, collaborator cut, and your take-home — calculated and separated in seconds, not spreadsheets.",
  },
  {
    icon: Eye,
    title: "Glass Box Audit Trail",
    description:
      "Nothing is hidden. Every AI decision is logged with full reasoning — so you always know why money moved and where it went.",
  },
  {
    icon: ShieldCheck,
    title: "Deal Vetting Agent",
    description:
      "Paste a deal description and get a fair-market score with reasoning. Know in 10 seconds if you're being underpaid before you sign.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Payment arrives",
    description: "You receive income from any source — brand deal, client, platform payout.",
  },
  {
    number: "02",
    title: "AI thinks",
    description:
      "The Architect analyses your profile, tax bracket, and collaborator agreements to decide the correct split.",
  },
  {
    number: "03",
    title: "Builder executes",
    description:
      "The Builder applies the decision: reserves tax, pays collaborators, and logs every action to the Glass Box.",
  },
];

const STATS = [
  { icon: Users, value: "1.5B", label: "gig workers worldwide" },
  { icon: TrendingUp, value: "$500B+", label: "gig economy market" },
  { icon: DollarSign, value: "20-40%", label: "earnings lost to admin" },
  { icon: Clock, value: "0", label: "manual work with AFE" },
];

const TESTIMONIALS = [
  {
    icon: Video,
    role: "Creator",
    name: "Aarav Mehta",
    text: "I used to dread tax season. AFE splits every payment the moment it lands and I haven't touched a spreadsheet in three months.",
  },
  {
    icon: Brush,
    role: "Freelancer",
    name: "Priya Nair",
    text: "I share revenue with a subcontractor on most projects. AFE handles their cut automatically and logs everything so there is never a dispute.",
  },
  {
    icon: Briefcase,
    role: "Consultant",
    name: "Rohan Sharma",
    text: "The deal vetting feature alone is worth it. I nearly took a retainer 30% below market rate. AFE flagged it before I replied.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen font-sans bg-background text-foreground">
      {/* Navbar */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b bg-background/85 border-border backdrop-blur-xl"
      >
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          AFE
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              size="sm"
              className="bg-primary text-primary-foreground font-semibold hover:opacity-90"
            >
              Get started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-screen text-center px-6 pt-24 pb-16 relative overflow-hidden">
        {/* Glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none bg-[radial-gradient(circle,hsl(var(--primary)/0.07)_0%,transparent_70%)]"
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" as const }}
          className="relative z-10 max-w-4xl"
        >
          <div
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border mb-6 border-primary/20 text-primary bg-primary/5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Autonomous Finance Engine
          </div>

          <h1
            className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6 text-foreground"
          >
            Your finances,{" "}
            <span className="text-primary">on autopilot.</span>
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 text-muted-foreground">
            AFE is an AI-powered finance layer built for creators, freelancers, and consultants.
            Every payment is split, taxed, and logged — automatically, with full audit trail.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground font-semibold text-base px-8 h-12"
              >
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base border-border text-foreground bg-transparent"
              >
                See how it works
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-y py-12 border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label}>
              <Icon className="mx-auto mb-2 h-5 w-5 text-primary" />
              <div className="text-3xl font-bold mb-1 text-foreground">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Section>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Built for the modern builder
              </h2>
              <p className="text-lg max-w-xl mx-auto text-muted-foreground">
                Three layers of intelligence working together so you never have to think about money admin again.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  className="rounded-xl border p-6 bg-card border-border"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-primary/10"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6" style={{ background: "#0D0D0D" }}>
        <div className="max-w-4xl mx-auto">
          <Section>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                How it works
              </h2>
              <p className="text-lg max-w-xl mx-auto text-muted-foreground">
                Three steps. No spreadsheets. No manual bookkeeping.
              </p>
            </motion.div>

            <div className="relative">
              {/* Connecting line */}
              <div
                className="absolute left-[27px] top-10 bottom-10 w-px hidden md:block"
                style={{ background: "linear-gradient(to bottom, #00FF9C44, transparent)" }}
              />

              <div className="space-y-12">
                {STEPS.map(({ number, title, description }) => (
                  <motion.div
                    key={number}
                    variants={fadeUp}
                    className="flex gap-6 items-start"
                  >
                    <div
                      className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center font-mono text-sm font-bold border-2 border-primary text-primary bg-background"
                    >
                      {number}
                    </div>
                    <div className="pt-3">
                      <h3 className="font-semibold text-xl mb-2 text-foreground">{title}</h3>
                      <p className="text-base text-muted-foreground">{description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Section>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Section>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Trusted by builders
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map(({ icon: Icon, role, name, text }) => (
                <motion.div
                  key={name}
                  variants={fadeUp}
                  className="rounded-xl border p-6 bg-card border-border"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-foreground">{name}</div>
                      <div className="text-xs text-muted-foreground">{role}</div>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center bg-muted/20 border-t border-border">
        <Section>
          <motion.div variants={fadeUp} className="max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Start for free today.
            </h2>
            <p className="text-lg mb-10 text-muted-foreground">
              No credit card required. Set up in under 2 minutes.
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground h-14 px-10 text-lg font-semibold"
              >
                Get started free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </Section>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-6 border-border bg-background">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-xl font-bold mb-1 text-primary">AFE</div>
            <div className="text-sm text-muted-foreground">
              Autonomous Finance Engine for the gig economy.
            </div>
          </div>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          </nav>
          <div className="text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} AFE. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
