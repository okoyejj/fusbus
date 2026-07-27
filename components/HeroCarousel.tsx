"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  {
    src: "/hero/cameroon-entrepreneurs-commerce.png",
    alt: "Cameroonian entrepreneurs across textile, food, digital, and manufacturing sectors",
    eyebrow: "Verified entrepreneur onboarding",
    title: "Opening Cameroon’s Entrepreneurs to the World",
    text: "We identify, onboard, and promote ambitious Cameroonian entrepreneurs from every sector, helping them become visible to international investors, sponsors, buyers, and partners."
  },
  {
    src: "/hero/cameroon-makers-services.png",
    alt: "Cameroonian makers and service providers preparing products for international visibility",
    eyebrow: "Makers, services, brands, and traders",
    title: "From Local Talent to Global Opportunity",
    text: "Fashion designers, artisans, manufacturers, food producers, digital entrepreneurs, and service providers can tell their story and prepare for trusted introductions."
  },
  {
    src: "/hero/cameroon-global-commerce.png",
    alt: "Cameroonian entrepreneurs presenting diverse products for global commerce",
    eyebrow: "Investor and partner discovery",
    title: "Discover Entrepreneurs Worth Supporting",
    text: "International visitors can browse approved profiles and contact the platform team to explore sponsorship, investment, mentorship, buying, and partnership opportunities."
  }
];

export function HeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative isolate min-h-[560px] overflow-hidden bg-ink text-white sm:min-h-[640px] lg:min-h-[680px]">
      {slides.map((slide, index) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-700 ${index === active ? "opacity-100" : "opacity-0"}`}
          aria-hidden={index !== active}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/32" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/28" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-transparent to-transparent" />
        </div>
      ))}

      <div className="relative z-10 mx-auto flex min-h-[560px] max-w-7xl items-center px-4 py-12 sm:min-h-[640px] sm:px-6 sm:py-16 lg:min-h-[680px] lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-normal text-gold">{slides[active].eyebrow}</p>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl lg:text-7xl">{slides[active].title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/90 sm:text-lg sm:leading-8">{slides[active].text}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn bg-gold text-ink hover:bg-yellow-300" href="/seller/register">Apply as an Entrepreneur</Link>
            <Link className="btn border border-white/70 bg-white/10 text-white backdrop-blur hover:bg-white/20" href="/sellers">Meet Our Entrepreneurs</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-normal text-white/90">
            {["Fashion", "Food", "Manufacturing", "Services", "Creative Goods", "Retail", "Agriculture"].map((label) => (
              <span key={label} className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur">{label}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2" role="tablist" aria-label="Hero slides">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            className={`h-3 rounded-full transition-all ${index === active ? "w-10 bg-gold" : "w-3 bg-white/65 hover:bg-white"}`}
            aria-label={`Show slide ${index + 1}: ${slide.title}`}
            aria-selected={index === active}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </section>
  );
}
