"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import RecentProjects from "@/components/RecentProjects";
// import Workflow from "@/components/Workflow";
import ProcessPit from "@/components/ProcessPit";
import Contact from "@/components/Contactus";
import About from "@/components/About";
import FunFact from "@/components/Funfact";
import ClientSimulator from "@/components/ClientSimulator";
import DamageMenu from "@/components/DamageMenu";
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

      {/* Spectrum rules mark each hand-off between color blocks —
          lilac → ink → yellow → blue → pink → beige → ink. */}
      <div className="vf-spectrum vf-bleed" />
      {/* <Workflow /> */}
      {/* Workflow's old slot: the physics-pit parody of agency process
          diagrams. Dark panel, so the color rhythm stays intact. */}
      <ProcessPit />
      <div className="vf-spectrum vf-bleed" />
      <FunFact />
      <div className="vf-spectrum vf-bleed" />
      {/* FunFact lists the red-flag feedback; this section lets you
          commit it. Keep them adjacent — it's one joke in two acts. */}
      <ClientSimulator />
      <div className="vf-spectrum vf-bleed" />
      {/* Services as a diner menu + live thermal receipt. Placed right
          before Contact so "get a real quote" is a one-scroll payoff. */}
      <DamageMenu />
      <div className="vf-spectrum vf-bleed" />
      <Contact />
      <div className="vf-spectrum vf-bleed" />
      <About />

      {/* <Cafehero />
      <CellHero /> */}
     


    </main>
  );
}