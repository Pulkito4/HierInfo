import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <>
     <div className="  bg-[#101130]  ">
      <div className="flex justify-between p-2">
      <Image src="/Logo52.png" alt="Logo" width={150} height={150} className="mt-0" />
       <Link href="/login" className="text-white pt-4 pr-4 hover:underline">Get Started</Link>
      </div>

      <div className="flex justify-between items-center mt-5 p-3">
        <div className="flex-1 flex justify-center">
          <h1 className="text-3xl font-bold text-white">WELCOME TO HEIRINFO
            <ul className="list-disc list-inside mt-6">
            <li className="text-white mt-4">Your Gateway to Informed Decisions</li>
            <li className="text-white mt-2">Stay Ahead with Real-Time News</li>
          </ul>
          </h1>
          
        </div>
        <Image src="/Hero2.png" alt="Hero" width={650} height={650}  />

      </div>
      
     
       
      </div>
    </>
  );
}