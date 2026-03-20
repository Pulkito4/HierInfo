import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import { 
  Newspaper, 
  Sparkles, 
  Zap, 
  Shield, 
  ChevronRight,
  Bookmark,
  Share2,
  Bell
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-[#1A1A1A] rounded-md flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                HierInfo
              </span>
            </Link>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors text-sm font-medium">
                Features
              </Link>
              <Link href="#how-it-works" className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors text-sm font-medium">
                How it Works
              </Link>
              <Link href="#pricing" className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors text-sm font-medium">
                Pricing
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link 
                href="/login"
                className="hidden sm:block text-[#1A1A1A] hover:text-[#6B6B6B] transition-colors text-sm font-medium px-4 py-2"
              >
                Sign In
              </Link>
              <AuthButton>
                <span className="btn-editorial text-sm">Get Started</span>
              </AuthButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FEF3C7] rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-[#B45309]" />
                <span className="text-sm font-medium text-[#B45309]">AI-Powered News Curation</span>
              </div>
              
              <h1 className="hero-title mb-6">
                Stay informed with{" "}
                <span className="text-[#B45309]">personalized</span>{" "}
                news that matters
              </h1>
              
              <p className="hero-subtitle mb-8 max-w-xl mx-auto lg:mx-0">
                HierInfo delivers curated news from trusted sources, tailored to your interests. 
                No noise, no bias—just the stories that keep you ahead.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <AuthButton>
                  <span className="btn-editorial inline-flex items-center gap-2">
                    Start Reading Free
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </AuthButton>
                <Link 
                  href="#features"
                  className="btn-editorial-outline inline-flex items-center justify-center gap-2"
                >
                  Explore Features
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-[#6B6B6B]">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#059669]" />
                  <span>Trusted Sources</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#B45309]" />
                  <span>Real-time Updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-[#1E40AF]" />
                  <span>Save & Share</span>
                </div>
              </div>
            </div>

            {/* Right Content - App Preview */}
            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E5E5E5] overflow-hidden">
                {/* Mock App Header */}
                <div className="bg-[#1A1A1A] px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                    <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                    <div className="w-3 h-3 rounded-full bg-[#059669]" />
                  </div>
                  <span className="text-white text-sm font-medium ml-2">HierInfo</span>
                </div>
                
                {/* Mock App Content */}
                <div className="p-6 space-y-4">
                  {/* Article Card 1 */}
                  <div className="border-b border-[#E5E5E5] pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="category-badge">Technology</span>
                      <span className="text-xs text-[#9CA3AF]">2 hours ago</span>
                    </div>
                    <h3 className="font-semibold text-[#1A1A1A] mb-1 leading-tight">
                      The Future of AI: What Experts Predict for 2025
                    </h3>
                    <p className="text-sm text-[#6B6B6B] line-clamp-2">
                      Leading researchers share insights on the next wave of artificial intelligence breakthroughs...
                    </p>
                  </div>
                  
                  {/* Article Card 2 */}
                  <div className="border-b border-[#E5E5E5] pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="category-badge bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]">Business</span>
                      <span className="text-xs text-[#9CA3AF]">4 hours ago</span>
                    </div>
                    <h3 className="font-semibold text-[#1A1A1A] mb-1 leading-tight">
                      Global Markets React to New Economic Policies
                    </h3>
                    <p className="text-sm text-[#6B6B6B] line-clamp-2">
                      Major indices show positive momentum as central banks announce coordinated measures...
                    </p>
                  </div>
                  
                  {/* Article Card 3 */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="category-badge bg-[#DBEAFE] text-[#1E40AF] border-[#93C5FD]">Science</span>
                      <span className="text-xs text-[#9CA3AF]">6 hours ago</span>
                    </div>
                    <h3 className="font-semibold text-[#1A1A1A] mb-1 leading-tight">
                      Climate Research Reveals Promising New Data
                    </h3>
                    <p className="text-sm text-[#6B6B6B] line-clamp-2">
                      Scientists document significant progress in renewable energy adoption across Europe...
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#FEF3C7] rounded-full opacity-50 blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#DBEAFE] rounded-full opacity-50 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white border-t border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-4">
              Everything you need to stay informed
            </h2>
            <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto">
              A complete news reading experience designed for the modern reader
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card-editorial p-6">
              <div className="w-12 h-12 bg-[#FEF3C7] rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-[#B45309]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                Personalized Feed
              </h3>
              <p className="text-[#6B6B6B] text-sm leading-relaxed">
                AI-powered curation learns your interests and delivers stories that actually matter to you.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card-editorial p-6">
              <div className="w-12 h-12 bg-[#DBEAFE] rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-[#1E40AF]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                Real-time Updates
              </h3>
              <p className="text-[#6B6B6B] text-sm leading-relaxed">
                Breaking news delivered instantly. Stay ahead with live updates from trusted sources worldwide.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card-editorial p-6">
              <div className="w-12 h-12 bg-[#D1FAE5] rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-[#059669]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                Trusted Sources
              </h3>
              <p className="text-[#6B6B6B] text-sm leading-relaxed">
                Every article is sourced from verified publishers. No misinformation, just facts.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card-editorial p-6">
              <div className="w-12 h-12 bg-[#E0E7FF] rounded-lg flex items-center justify-center mb-4">
                <Bookmark className="w-6 h-6 text-[#4338CA]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                Save & Organize
              </h3>
              <p className="text-[#6B6B6B] text-sm leading-relaxed">
                Bookmark articles for later reading. Build your personal knowledge library.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card-editorial p-6">
              <div className="w-12 h-12 bg-[#FCE7F3] rounded-lg flex items-center justify-center mb-4">
                <Share2 className="w-6 h-6 text-[#BE185D]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                Easy Sharing
              </h3>
              <p className="text-[#6B6B6B] text-sm leading-relaxed">
                Share stories with your network in one click. Spread knowledge effortlessly.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card-editorial p-6">
              <div className="w-12 h-12 bg-[#F3E8FF] rounded-lg flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-[#7C3AED]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                Smart Notifications
              </h3>
              <p className="text-[#6B6B6B] text-sm leading-relaxed">
                Get notified only for breaking news in your areas of interest. No spam, ever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-[#F5F5F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-4">
              Start reading in minutes
            </h2>
            <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto">
              Simple setup, powerful results
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#1A1A1A] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">
                Create Account
              </h3>
              <p className="text-[#6B6B6B]">
                Sign up in seconds with your email or Google account
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#1A1A1A] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">
                Select Interests
              </h3>
              <p className="text-[#6B6B6B]">
                Choose topics you care about—tech, business, science, and more
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#B45309] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">
                Start Reading
              </h3>
              <p className="text-[#6B6B6B]">
                Enjoy a personalized news feed tailored just for you
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#1A1A1A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to transform how you read news?
          </h2>
          <p className="text-lg text-[#9CA3AF] mb-8 max-w-2xl mx-auto">
            Join thousands of readers who get their news the smart way. 
            No clutter, no bias—just the stories that matter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AuthButton>
              <span className="inline-flex items-center gap-2 bg-white text-[#1A1A1A] px-8 py-4 rounded-md font-semibold hover:bg-[#F5F5F4] transition-colors">
                Get Started Free
                <ChevronRight className="w-5 h-5" />
              </span>
            </AuthButton>
          </div>
          <p className="text-sm text-[#6B6B6B] mt-6">
            Free forever. No credit card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F5F5F4] border-t border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#1A1A1A] rounded-md flex items-center justify-center">
                  <Newspaper className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-[#1A1A1A]">HierInfo</span>
              </Link>
              <p className="text-[#6B6B6B] text-sm max-w-sm">
                Personalized news for the modern reader. Stay informed with curated stories from trusted sources.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-[#1A1A1A] mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Features</Link></li>
                <li><Link href="#" className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Pricing</Link></li>
                <li><Link href="#" className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Mobile App</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-[#1A1A1A] mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">About</Link></li>
                <li><Link href="#" className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Contact</Link></li>
                <li><Link href="#" className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#E5E5E5] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[#6B6B6B]">
              © 2025 HierInfo. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-[#6B6B6B]">
              <Link href="#" className="hover:text-[#1A1A1A] transition-colors">Terms</Link>
              <Link href="#" className="hover:text-[#1A1A1A] transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-[#1A1A1A] transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
