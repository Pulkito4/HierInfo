"use client";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";


export function ContainerTextFlipDemo() {
  const words = ["personalized", "accurate", "clearer", "unbiased"]
  return (
    <motion.h1
      initial={{
        opacity: 0,
      }}
      whileInView={{
        opacity: 1,
      }}
      className={cn(
        "relative mb-6 max-w-2xl text-left text-4xl leading-normal font-bold tracking-tight text-slate-300 md:text-7xl dark:text-zinc-100",
      )}
      layout
    >
      <div className="inline-block p-3">
        <h1 className="mb-2">Welcome to <span className="text-teal-400">HeirInfo</span></h1>
        
  <h2 className="text-7xl gap-x-1">Stay ahead with news that&apos;s <br/> <ContainerTextFlip words={words} /></h2> 
        {/* <Blips /> */}
      </div>
    </motion.h1>
  );
}
