import Image from "next/image";
import AuthButton from "@/components/AuthButton";
import { ContainerTextFlipDemo } from "@/components/landingpage/LandingPage";
import LiquidEther from "@/components/LiquidEther";

export default function HomePage() {
  return (
    <>
     {/* <div style={{ background: 'linear-gradient(45deg, #0b1120 100%, #1a2a4c 0%)' }} className="  p-4  ">
      <div className="flex justify-between p-2">
        <Image src="/Logo52.png" alt="Logo" width={150} height={150} className="mt-0" />
        <AuthButton>Get Started</AuthButton>
      </div>

      <div className="flex justify-between items-center mt-5 p-3">
        <div className="flex-1 flex justify-center">
           <ContainerTextFlipDemo/>
        </div>
        <Image src="/Hero22.png" alt="Hero" width={550} height={550}  />

      </div>
      
     
     
       
      </div> */}

<div style={{ width: '100%', height: 800, position: 'relative', backgroundColor: '#0b1120' }}>
  {/* LiquidEther background */}
  <LiquidEther
    colors={[ '#5227FF', '#FF9FFC', '#B19EEF' ]}
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
  
  {/* Content overlay */}
  <div style={{ 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    width: '100%', 
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none' // Allows interaction with LiquidEther beneath
  }}>
    <div style={{ pointerEvents: 'auto' }}> {/* Re-enable pointer events for your content */}
       <div className="flex justify-between p-2">
        <Image src="/Logo52.png" alt="Logo" width={150} height={150} className="mt-0" />
        <AuthButton>Get Started</AuthButton>
      </div>
       <div className="flex justify-between items-center mt-5 p-3">
        <div className="flex-1 flex justify-center">
           <ContainerTextFlipDemo/>
        </div>
        <Image src="/Hero22.png" alt="Hero" width={550} height={550}  />

      </div>
    </div>
  </div>
 
</div>
    </>
  );
}