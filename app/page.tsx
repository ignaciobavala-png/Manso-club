"use client";

import { Hero } from "@/components/Home/Hero";
import { Manifesto } from "@/components/Home/Manifesto";
import { EventList } from "@/components/Home/EventList";
import { SectionsGrid } from "@/components/Home/SectionsGrid";

export default function Home() {
  return (
    <main>
      <Hero />
      <Manifesto />
      <EventList />
      <SectionsGrid />
    </main>
  );
}