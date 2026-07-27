import React from 'react';
import { 
  UtensilsCrossed, 
  Soup, 
  ShoppingBag, 
  CalendarCheck, 
  Store, 
  Users, 
  Sun,
  Target,
  History as HistoryIcon
} from 'lucide-react';
import heroImage from '../assets/bgHero.jpg';
import logo from '../assets/logoword.png';
import asian from '../assets/asian.jpg';
import european from '../assets/european.jpg';
import about1 from '../assets/aboutUs1.jpg';
import about2 from '../assets/aboutUs2.jpg';

const SERVICES = [
  { label: 'Dine-in', icon: Users },
  { label: 'Outdoor Seating', icon: Sun },
  { label: 'Reservations', icon: CalendarCheck },
  { label: 'Takeout', icon: ShoppingBag },
  { label: 'In-store Pickup', icon: Store },
];

export default function AboutUs() {
  return (
    <div className="bg-[#faf8f5] text-[#1d080f] font-sans min-h-screen">
      
      {/* Hero Header */}
      <div className="relative h-64 overflow-hidden shrink-0 md:h-60">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-white/40" />
        <div className="relative flex h-full items-start justify-center px-4 pt-16 md:pt-20">
          <img
            src={logo}
            alt="Eurasia Restaurant"
            className="h-20 w-auto md:h-32"
          />
        </div>
      </div>

      {/* 1. What We Offer Section */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-semibold tracking-[0.25em] text-[#b38548] uppercase mb-2 block">
            Our Specialties & Services
          </span>
          <h2 className="font-['Prata'],serif text-3xl md:text-4xl font-bold text-[#1d080f]">
            What We Offer
          </h2>
          <div className="w-12 h-0.5 bg-[#b38548] mx-auto mt-4 rounded-full" />
        </div>

        {/* Cuisine Cards (Featured Offers) */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          
          {/* European Foods Card */}
          <div className="group relative h-64 md:h-72 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-neutral-100">
            <img 
              src={european} 
              alt="European Foods"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1d080f]/90 via-[#1d080f]/40 to-transparent" />
            
            <div className="relative h-full p-6 flex flex-col justify-end text-white">
              <div className="w-10 h-10 rounded-full bg-[#b38548] flex items-center justify-center mb-3 shadow-md">
                <UtensilsCrossed size={20} className="text-white" />
              </div>
              <h3 className="font-['Prata'],serif text-2xl font-bold mb-1 tracking-wide">
                European Cuisines
              </h3>
              <p className="text-xs text-neutral-200 line-clamp-2">
                Indulge in rich, classic flavors crafted with premium ingredients inspired by traditional European recipes.
              </p>
            </div>
          </div>

          {/* Asian Foods Card */}
          <div className="group relative h-64 md:h-72 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-neutral-100">
            <img 
              src={asian} 
              alt="Asian Foods"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1d080f]/90 via-[#1d080f]/40 to-transparent" />
            
            <div className="relative h-full p-6 flex flex-col justify-end text-white">
              <div className="w-10 h-10 rounded-full bg-[#b38548] flex items-center justify-center mb-3 shadow-md">
                <Soup size={20} className="text-white" />
              </div>
              <h3 className="font-['Prata'],serif text-2xl font-bold mb-1 tracking-wide">
                Asian Cuisines
              </h3>
              <p className="text-xs text-neutral-200 line-clamp-2">
                Savor authentic, aromatic dishes celebrating the vibrant culinary traditions across Asia.
              </p>
            </div>
          </div>

        </div>

        {/* Available Dining Services Pills */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-neutral-200/60 shadow-xs">
          <h4 className="text-center text-xs font-bold uppercase tracking-wider text-neutral-500 mb-6">
            Dining & Service Options
          </h4>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {SERVICES.map(({ label, icon: Icon }) => (
              <div 
                key={label}
                className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#faf8f5] border border-neutral-200/80 text-neutral-800 text-xs font-medium hover:border-[#b38548] hover:text-[#1d080f] transition-all cursor-default"
              >
                <Icon size={16} className="text-[#b38548]" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Mission Section */}
      <section className="bg-white py-16 border-y border-neutral-200/50">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4 text-left text-sm md:text-base leading-relaxed text-[#1d080f]">
            <div className="flex items-center gap-2 text-[#b38548] mb-1">
              <Target size={20} />
              <span className="text-xs font-semibold tracking-widest uppercase">Our Purpose</span>
            </div>
            <h2 className="font-['Prata'],serif text-3xl md:text-4xl font-bold mb-4">Mission</h2>
            <p className="font-medium text-base text-neutral-800">
              Our mission is to inspire healthier communities by connecting people to real food.
            </p>
            <p className="text-neutral-600">
              We are committed to providing great-tasting, high-quality food that is cooked with
              fresh ingredients in a clean environment. We strive to give our customers an enjoyable
              experience by offering excellent service and reasonably priced meals.
            </p>
            <p className="text-neutral-600">
              Our goal is to be the go-to destination for delicious, healthy food in a relaxed
              atmosphere. We strive to create an inviting space where friends and families can come
              together for great conversation and amazing food.
            </p>
            <p className="text-neutral-600">
              At our restaurant, we are passionate about creating an unforgettable experience for our
              guests through outstanding hospitality and delicious cuisine. Our mission is to ensure
              every customer feels special, and we strive to provide a memorable dining experience!
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-2 bg-[#b38548]/10 rounded-2xl transform rotate-1" />
            <img
              src={about1}
              alt="Restaurant interior"
              className="relative rounded-xl w-full h-[400px] object-cover shadow-md"
            />
          </div>
        </div>
      </section>

      {/* 3. History Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 md:order-1">
            <div className="absolute -inset-2 bg-[#1d080f]/5 rounded-2xl transform -rotate-1" />
            <img
              src={about2}
              alt="Restaurant terrace view"
              className="relative rounded-xl w-full h-[400px] object-cover shadow-md"
            />
          </div>
          <div className="text-left text-[#1d080f] order-1 md:order-2 space-y-4">
            <div className="flex items-center gap-2 text-[#b38548] mb-1">
              <HistoryIcon size={20} />
              <span className="text-xs font-semibold tracking-widest uppercase">Our Heritage</span>
            </div>
            <h2 className="font-['Prata'],serif text-3xl md:text-4xl font-bold">History</h2>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#b38548]">
              Eurasia <span className="text-neutral-500 font-normal">(Europe + Asia)</span>
            </p>
            <p className="text-sm md:text-base leading-relaxed text-neutral-700">
              Eurasia is a fine-dining restaurant located in Banay-Banay, San Jose, Batangas,
              specifically on the 5th Floor of the ARADA VIRTUCIO Building.
            </p>
            <p className="text-sm md:text-base leading-relaxed text-neutral-700">
              It was built in 2024 as a gift from the loving parents of the owner.
            </p>
            <p className="text-sm md:text-base leading-relaxed text-neutral-700">
              Eurasia offers a unique combination of European and Asian cuisine, providing customers
              with a diverse dining experience.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}