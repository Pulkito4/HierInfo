"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import AuthButton from "@/components/AuthButton";
import LiquidEther from "@/components/LiquidEther";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  Sparkles,
  Zap,
  Heart,
  Globe,
  BookOpen,
  TrendingUp,
  Compass,
  Star,
  Clock,
  Shield,
  Filter,
  Play,
  ChevronDown
} from "lucide-react";

export default function HomePage() {
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroFluidY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const orbSlowY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const orbMidY = useTransform(scrollYProgress, [0, 1], [0, 130]);
  const orbFastY = useTransform(scrollYProgress, [0, 1], [0, 170]);
  const heroContentY = useTransform(scrollYProgress, [0, 1], [0, -70]);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-coral/10">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <Image src="/logoicon.png" alt="HierInfo logo" width={40} height={40} className="w-10 h-10 object-contain" />
              <div>
                <span className="text-xl font-bold text-slate-100">HierInfo</span>
              </div>
            </Link>

            <div className="flex items-center gap-4 sm:gap-6">
              {/* Nav Links - Desktop */}
              <div className="hidden md:flex items-center gap-8">
                <Link href="#how-it-works" className="text-slate-300 hover:text-accent transition-colors text-sm font-medium">
                  How It Works
                </Link>
                <Link href="#features" className="text-slate-300 hover:text-accent transition-colors text-sm font-medium">
                  Features
                </Link>
              </div>

              {/* Auth Button */}
              <div className="flex items-center gap-3">
                <AuthButton />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <motion.div className="absolute inset-0 opacity-60" style={{ y: heroFluidY }}>
          <LiquidEther
            className="w-full h-full"
            autoDemo
            autoSpeed={0.4}
            autoIntensity={1.6}
            resolution={0.45}
            cursorSize={100}
            mouseForce={10}
            colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
          />
        </motion.div>

        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div className="absolute top-20 left-10 w-72 h-72 bg-coral/10 rounded-full blur-3xl" style={{ y: orbSlowY }} />
          <motion.div className="absolute bottom-20 right-10 w-72 h-72 bg-teal/10 rounded-full blur-3xl" style={{ y: orbMidY }} />
          <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-3xl" style={{ y: orbFastY }} />
        </div>

        <motion.div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ y: heroContentY }}>
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            {/* Badge */}
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-gray-300">News, without the noise</span>
            </motion.div>
            
            {/* Headline */}
            <motion.h1 
              variants={fadeIn}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            >
              <span className="text-slate-100">No More</span>
              <br />
              <span className="text-gradient">Information Overload</span>
            </motion.h1>
            
            {/* Subheadline */}
            <motion.p 
              variants={fadeIn}
              className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Tired of seeing the same story 50 times? We filter out duplicates and clickbait 
              so you get just the news that matters — once.
            </motion.p>
            
            {/* CTAs */}
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <AuthButton className="btn-primary inline-flex items-center justify-center gap-2 text-lg px-8 py-4">
                <Zap className="w-5 h-5" />
                Start Reading Free
              </AuthButton>
              <Link 
                href="#how-it-works"
                className="btn-ghost inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
              >
                <Play className="w-5 h-5" />
                See How It Works
              </Link>
            </motion.div>

            {/* Social Proof */}
            <motion.div variants={fadeIn} className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-coral/20 flex items-center justify-center text-coral text-xs font-bold">JD</div>
                  <div className="w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center text-teal text-xs font-bold">SK</div>
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold-dark text-xs font-bold">AM</div>
                </div>
                <span>Join 10,000+ readers</span>
              </div>
              {/* <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span>4.9 rating from 2,000+ reviews</span>
              </div> */}
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Link
            href="#how-it-works"
            aria-label="Scroll to how it works section"
            className="flex flex-col items-center gap-2 text-slate-300 hover:text-coral transition-colors"
          >
            <span className="text-xs tracking-[0.18em] uppercase">Scroll</span>
            <motion.span
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.span>
          </Link>
        </motion.div>
      </section>

      {/* Problem / Solution Section */}
      <section id="how-it-works" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4 text-4xl">The News Is Broken.<br/>We Fixed It.</h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Traditional news apps show you the same story again and again. We do things differently.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Problem 1 */}
            <motion.div 
              className="card-featured p-8 text-center"
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
                <Filter className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">Duplicate Stories</h3>
              <p className="text-slate-400 mb-4">
                50 different articles about the same event. You read the same facts over and over.
              </p>
              <div className="text-accent font-semibold text-sm">We group them into one</div>
            </motion.div>

            {/* Problem 2 */}
            <motion.div 
              className="card-featured p-8 text-center"
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">Clickbait Headlines</h3>
              <p className="text-slate-400 mb-4">
                &ldquo;You won&apos;t believe what happened!&rdquo; Articles that waste your time and don&apos;t deliver.
              </p>
              <div className="text-accent font-semibold text-sm">We filter out the junk</div>
            </motion.div>

            {/* Problem 3 */}
            <motion.div 
              className="card-featured p-8 text-center"
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-coral/20 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-coral" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">Too Long, Didn&apos;t Read</h3>
              <p className="text-slate-400 mb-4">
                2,000-word articles when you only need 200 words to get the point.
              </p>
              <div className="text-accent font-semibold text-sm">We summarize the key facts</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Your Feeds Section */}
      <section className="py-24 relative bg-slate-900/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4 text-4xl">Four Ways to Stay Informed</h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Different moods call for different news. Pick what works for you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* For You */}
            <motion.div 
              className="card-featured p-6 border-l-4 border-l-coral"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-12 h-12 rounded-xl bg-coral/10 flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-coral" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">For You</h3>
              <p className="text-slate-400 text-sm">
                Stories handpicked based on what you actually care about. No algorithms pushing junk.
              </p>
            </motion.div>

            {/* Trending */}
            <motion.div 
              className="card-featured p-6 border-l-4 border-l-gold"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-gold-dark" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Trending</h3>
              <p className="text-slate-400 text-sm">
                What everyone&apos;s talking about right now. The stories that matter to the world.
              </p>
            </motion.div>

            {/* Breaking */}
            <motion.div 
              className="card-featured p-6 border-l-4 border-l-rose-400"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-rose-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Breaking</h3>
              <p className="text-slate-400 text-sm">
                Critical updates that need your attention. Important news, not noise.
              </p>
            </motion.div>

            {/* Explore */}
            <motion.div 
              className="card-featured p-6 border-l-4 border-l-teal"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center mb-4">
                <Compass className="w-6 h-6 text-teal" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">Explore</h3>
              <p className="text-slate-400 text-sm">
                Discover something new. Step outside your bubble with curated picks.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4 text-4xl">Built for Real Readers</h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              No tech jargon. Just features that make your life easier.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <motion.div 
              className="flex gap-6 p-6 rounded-2xl bg-slate-900/70 shadow-sm"
              whileHover={{ boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
            >
              <div className="w-14 h-14 rounded-xl bg-coral/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-7 h-7 text-coral" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">No Clickbait, Ever</h3>
                <p className="text-slate-400">
We check if headlines actually match the story. If it&apos;s all hype and no substance, 
                you won&apos;t see it.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              className="flex gap-6 p-6 rounded-2xl bg-slate-900/70 shadow-sm"
              whileHover={{ boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
            >
              <div className="w-14 h-14 rounded-xl bg-teal/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-7 h-7 text-teal" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">Smart Summaries</h3>
                <p className="text-slate-400">
                  Get the gist in 30 seconds. Our summaries capture what actually matters 
                  from long articles.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              className="flex gap-6 p-6 rounded-2xl bg-slate-900/70 shadow-sm"
              whileHover={{ boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
            >
              <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                <Filter className="w-7 h-7 text-gold-dark" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">One Story, Once</h3>
                <p className="text-slate-400">
                  We group coverage from hundreds of sources into a single, easy-to-read story. 
                  No more déjà vu.
                </p>
              </div>
            </motion.div>

            {/* Feature 4 */}
            <motion.div 
              className="flex gap-6 p-6 rounded-2xl bg-slate-900/70 shadow-sm"
              whileHover={{ boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
            >
              <div className="w-14 h-14 rounded-xl bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                <Globe className="w-7 h-7 text-indigo-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">Always Fresh</h3>
                <p className="text-slate-400">
                  News updates continuously. Check back anytime for the latest — 
                  no refresh button needed.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {/* <section id="testimonials" className="py-24 relative bg-slate-900/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4 text-4xl">Loved by Readers</h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Don&apos;t take our word for it. Here&apos;s what real users say.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
           
            <div className="card-featured p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-gold fill-gold" />
                ))}
              </div>
              <p className="text-slate-300 mb-4">
                &ldquo;Finally! No more scrolling past the same story 20 times. This app actually respects my time.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-coral/20 flex items-center justify-center text-coral text-sm font-bold">SM</div>
                <div>
                  <p className="font-semibold text-slate-100 text-sm">Sarah M.</p>
                  <p className="text-slate-400 text-xs">Product Manager</p>
                </div>
              </div>
            </div>

           
            <div className="card-featured p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-gold fill-gold" />
                ))}
              </div>
              <p className="text-slate-300 mb-4">
                &ldquo;The summaries are a game changer. I can stay informed even on my busiest days.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal/20 flex items-center justify-center text-teal text-sm font-bold">JK</div>
                <div>
                  <p className="font-semibold text-slate-100 text-sm">James K.</p>
                  <p className="text-slate-400 text-xs">Entrepreneur</p>
                </div>
              </div>
            </div>

            
            <div className="card-featured p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-gold fill-gold" />
                ))}
              </div>
              <p className="text-slate-300 mb-4">
                &ldquo;I&apos;ve tried every news app. This is the only one that doesn&apos;t make me feel overwhelmed.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold-dark text-sm font-bold">AL</div>
                <div>
                  <p className="font-semibold text-slate-100 text-sm">Aisha L.</p>
                  <p className="text-slate-400 text-xs">Journalist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-coral/5" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-100 mb-4">
            Ready to enjoy news again?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of readers who&apos;ve reclaimed their time. 
            No more doom-scrolling. No more duplicates. Just news.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AuthButton className="btn-primary inline-flex items-center justify-center gap-2 text-lg px-8 py-4">
              <Sparkles className="w-5 h-5" />
              Get Started Free
            </AuthButton>
          </div>
          {/* <p className="text-sm text-slate-400 mt-6">
            Free forever • No credit card required • Cancel anytime
          </p> */}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-12 bg-slate-900/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8 flex justify-center">
            {/* Brand */}
            <div className="md:col-span-2 flex flex-col items-center">
              <Link href="/" className="flex items-center justify-center gap-3 mb-4">
                <Image src="/logoicon.png" alt="HierInfo logo" width={40} height={40} className="w-10 h-10 object-contain" />
                <span className="text-xl font-bold text-center text-slate-100">HierInfo</span>
              </Link>
              <p className="text-slate-400 text-center text-sm max-w-sm mx-auto">
                The news app that respects your time. No duplicates, no clickbait, 
                just what matters.
              </p>
            </div>

            {/* Links */}
            {/* <div>
              <h4 className="text-slate-100 font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#features" className="hover:text-coral transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-coral transition-colors">Mobile Apps</Link></li>
                <li><Link href="#" className="hover:text-coral transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-coral transition-colors">API</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-100 font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-coral transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-coral transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-coral transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-coral transition-colors">Contact</Link></li>
              </ul>
            </div> */}
          </div>

          <div className="border-t border-slate-700 pt-8 flex flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-slate-400">
              © 2025 HierInfo. All rights reserved.
            </p>
            {/* <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link href="#" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-slate-300 transition-colors">Terms</Link>
              <Link href="#" className="hover:text-slate-300 transition-colors">Cookies</Link>
            </div> */}
          </div>
        </div>
      </footer>
    </div>
  );
}
