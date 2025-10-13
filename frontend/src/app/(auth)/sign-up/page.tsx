import { SignupForm } from "@/components/landingpage/SignupForm";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Signup() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  // If a session exists, redirect to home page
  if (session) {
    redirect('/home');
  }
  return (
    <div className="bg-[#4E6E95] flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="bg-[#1E2A44] p-7 rounded-2xl py-10 w-full max-w-2xl">
        <div className=" w-full jmax-w-sm">
            {/* <Image src="/loginimage.jpeg" alt="Logo" width={500} height={400} className="mx-auto rounded-2xl mb-4" /> */}
         <SignupForm />
        </div>
       
      </div>
    </div>
  )
}
