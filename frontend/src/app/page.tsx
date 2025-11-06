import Image from "next/image";
import AuthButton from "@/components/AuthButton";
import { ContainerTextFlipDemo } from "@/components/landingpage/LandingPage";
import LiquidEther from "@/components/LiquidEther";

export default function HomePage() {
  return (
    <div className="relative w-full h-screen bg-[#0b1120] overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/bg3.jpeg"
          alt="Background"
          fill
          className="object-cover opacity-30"
          priority
        />
        {/* Black overlay on background image */}
        <div className="absolute inset-0 bg-black/70" />
      </div>
      
      {/* LiquidEther background with enhanced gradient overlay */}
      <div className="absolute inset-0 z-0">
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
        {/* Gradient overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1120]/40 via-transparent to-[#0b1120]/60" />
      </div>
      
      {/* Main content container */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Navigation header */}
        <nav className="w-full px-8 py-4 lg:px-16">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2 group cursor-pointer">
              <Image 
                src="/logo52.png" 
                alt="Logo" 
                width={140} 
                height={140} 
                className="transition-transform duration-300 group-hover:scale-105" 
                priority
              />
            </div>
            <div className="flex items-center gap-4">
              <AuthButton>
                <span className="px-6 py-2.5 font-medium tracking-wide">Get Started</span>
              </AuthButton>
            </div>
          </div>
        </nav>

        {/* Hero section */}
        <main className="flex-1 flex items-center justify-center px-8 lg:px-16 py-4">
          <div className="max-w-7xl w-full mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left content - Text */}
              <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
                <div className="space-y-4">
                  <ContainerTextFlipDemo />
                  
                  {/* Optional: Add a subtitle or description */}
                  <p className="text-gray-300 hover:text-white transition-colors cursor-pointer text-base lg:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 opacity-90">
                    Experience the next generation of intelligent news.
                  </p>
                </div>
                
                
              </div>

              {/* Right content - Hero image */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative group">
                  {/* Glow effect behind image */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                  
                  {/* Image container */}
                  <div className="relative">
                    <Image 
                      src="/Hero22.png" 
                      alt="Hero" 
                      width={450} 
                      height={450}
                      className="relative z-10 transition-transform duration-500 group-hover:scale-105 drop-shadow-2xl"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}