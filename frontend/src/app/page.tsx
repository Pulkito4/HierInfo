import Image from "next/image";
import AuthButton from "@/components/AuthButton";
import { ContainerTextFlipDemo } from "@/components/landingpage/LandingPage";

export default function HomePage() {
  return (
    <>
     <div style={{ background: 'linear-gradient(45deg, #0b1120 100%, #1a2a4c 0%)' }} className="  p-4  ">
      <div className="flex justify-between p-2">
        <Image src="/Logo52.png" alt="Logo" width={150} height={150} className="mt-0" />
        <AuthButton showStatus={true}>Get Started</AuthButton>
      </div>

      <div className="flex justify-between items-center mt-5 p-3">
        <div className="flex-1 flex justify-center">
           <ContainerTextFlipDemo/>
        </div>
        <Image src="/Hero22.png" alt="Hero" width={550} height={550}  />

      </div>
      
     
     
       
      </div>
    </>
  );
}