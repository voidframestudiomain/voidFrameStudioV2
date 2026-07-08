"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import RecentProjects from "@/components/RecentProjects";
import Workflow from "@/components/Workflow";
import Contact from "@/components/Contactus";
import About from "@/components/About";
import FunFact from "@/components/Funfact";
// import Cafehero from "@/components/Cafehero";
// import CellHero from "@/components/CellHero";

export default function Home() {
  // Single source of truth for RecentProjects' scroll-driven progress
  // (0 = top of that section, 1 = fully expanded). Hero reads this to
  // trigger its hide animation in sync with the row, instead of running
  // its own separate scroll listener.
  const [projectsProgress, setProjectsProgress] = useState(0);

  return (
    <main className="min-h-screen flex flex-col px-[40px] py-10">
      <Header />
      <Hero projectsProgress={projectsProgress} />

      <RecentProjects onProgress={setProjectsProgress} />
      <Workflow />
       <FunFact />
      <Contact />
      <About />

      {/* <Cafehero />
      <CellHero /> */}
     


    </main>
  );
}