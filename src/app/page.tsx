import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Pillars } from '@/components/landing/Pillars';
import { Process } from '@/components/landing/Process';
import { BriefingWizard } from '@/components/landing/BriefingWizard';
import { Footer } from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <Navbar />
      <main>
        <Hero />
        <Pillars />
        <Process />
        <BriefingWizard />
      </main>
      <Footer />
    </div>
  );
}
