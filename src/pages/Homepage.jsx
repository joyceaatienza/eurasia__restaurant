import logo from '../assets/logopic2.png'
import bg from '../assets/bg.jpg'
import bakedSalmon from '../assets/bakedSalmon2.png'
import bbqRibs from '../assets/texas-bbq-ribs2.png'
import norwegianSalmon from '../assets/norwegian-salmon2.png'
import chickenBbq from '../assets/chicken-bbq2.png'
import tuttoMare from '../assets/tutto-mare2.png'
import carneSupreme from '../assets/carne-supreme2.png'
import alTonno from '../assets/al-tonno2.png'
import margherita from '../assets/margherita2.png'
import mexicana from '../assets/mexicana.png'
import pepperoni from '../assets/pepperoni2.png'
import quatroFormaggi from '../assets/quatro-formaggi2.png'

import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";

function FindUs() {
  const address = "5th Floor ARADA VIRTUCIO Building, Banay-Banay, San Jose, Batangas";
  const encodedAddress = encodeURIComponent(address);

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 bg-[#fdfbf7]">
      {/* Map Embed */}
      <div className="h-[450px] md:h-auto min-h-[400px]">
        <iframe
          title="Eurasia Restaurant Location"
          src={`https://www.google.com/maps?q=${encodedAddress}&z=17&output=embed`}          
          className="w-full h-full"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* Location Details */}
     <div className="flex flex-col justify-center items-start text-left px-8 md:px-16 py-16 bg-[#fdfbf7]">
       <h2 className="font-[Prata] font-bold text-xl md:text-2xl text-[#1d080f] mb-8"
       style={{ WebkitTextStroke: '0.6px #1d080f' }}>
        Find Us
        </h2>
        
        <p className="font-[Prata] text-[11px] md:text-xs text-[#1d080f] mb-1 leading-relaxed">
          5th Floor, ARADA VIRTUCIO Building
          </p>
        <p className="font-[Prata] text-[11px] md:text-xs text-[#1d080f] mb-4 leading-relaxed">
            Banay-Banay, San Jose, Batangas
          </p>

        <a
          href={`https://maps.app.goo.gl/Zbj7QZiMJdfBg7Rr6`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-fit border border-[#1d080f] text-[#1d080f] px-8 py-3 font-[Prata] text-xs tracking-wider hover:bg-[#1d080f] hover:text-white transition duration-300"
        >
          Get Directions
        </a>
      </div>
    </section>
  );
}

function Homepage() {
  const bestSellers = [
    {
      name: 'Baked Salmon',
      price: 'Php. 755',
      desc: 'Herb-roasted salmon served with fresh mixed greens',
      img: bakedSalmon,
      position: 'object-bottom',
    },
    {
      name: 'Texas BBQ Ribs',
      price: 'Php. 876',
      desc: 'Slow cooked marinated 300 grams Baby back ribs served with potato wedges, pesto tossed veggies and coleslaw',
      img: bbqRibs,
      position: 'object-bottom',
    },
    {
      name: 'Norwegian Salmon',
      price: 'Php. 1490',
      desc: 'Baked 200 grams salmon filet served with steamed vegetables, lemon butter capers sauce',
      img: norwegianSalmon,
      position: 'object-bottom',
    },
    {
      name: 'Texas Chicken BBQ',
      price: 'Php. 599',
      desc: 'Strip of chicken breast with olives and bell peppers drizzled with barbeque sauce',
      img: chickenBbq,
      position: 'object-bottom',
    },
    {
      name: 'Al Tonno',
      price: 'Php. 578',
      desc: 'Tuna chunks, bell pepper, olives, onion served with lemon wedges on the side',
      img: alTonno,
      position: 'object-bottom',
    },
     {
      name: 'Mexicana',
      price: 'Php. 704',
      desc: 'Chili con carne, bell peppers, and choppped fesh jalapenos',
      img: mexicana,
      position: 'object-bottom',
    },
    {
      name: 'Tutto Mare',
      price: 'Php. 578',
      desc: 'Calamari, shrimp, tuna, bell peppers, and onion',
      img: tuttoMare,
      position: 'object-bottom',
    },
     {
      name: 'Pepperoni',
      price: 'Php. 578',
      desc: 'Pomodoro sauce, cheddar, and mozzarella cheese',
      img: pepperoni,
      position: 'object-bottom',
    },
    {
      name: 'Margherita',
      price: 'Php. 578',
      desc: 'Fresh slice tomato, basil leaves, mozzarella cheese drizzled with pesto sauce',
      img: margherita,
      position: 'object-bottom',
    },
     {
      name: 'Quatro Formaggi',
      price: 'Php. 693',
      desc: 'Béchamel, mozzarella, cheddar, Swiss cheese and parmesan',
      img: quatroFormaggi,
      position: 'object-bottom',
    },
    {
      name: 'Carne Supreme',
      price: 'Php. 711',
      desc: 'Chili con carne, bacon, Italian sausage, bell peppers, onions, and olives',
      img: carneSupreme,
      position: 'object-bottom',
    },
  ]

  const scrollRef = useRef(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch("/api/reviews")
      .then(res => res.json())
      .then(data => setReviews(data));
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = 340;
      scrollRef.current.scrollBy({
        left: direction === "next" ? amount : -amount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative h-[500px] flex flex-col items-center justify-center text-center overflow-hidden">
        <img src={bg} alt="Restaurant interior" className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/60" />

        <div className="relative z-10 flex flex-col items-center">
         <img src={logo} alt="Eurasia Restaurant" className="w-64 md:w-96 h-auto mb-6 md:mb-8" />
         <p className="mt-4 md:mt-6 text-xs md:text-base text-[#1d080f] font-[Prata] px-6">
          5th Floor ARADA VIRTUCIO Building, Banay-Banay, San Jose, Batangas
          </p>
          <p className="text-xs md:text-base text-[#1d080f] font-serif px-6">
            [Weekdays] 11:00am-10:00pm &nbsp;|&nbsp; [Weekends] 10:00am-10:00pm
            </p>
              <Link
            to="/reservation"
            className="mt-5 px-5 py-2 bg-[#1d080f] text-[#f1ece7] font-[Prata] tracking-wide rounded-sm hover:bg-[#6a2420] transition-colors shadow-sm"
          >
            Reserve a Table
          </Link>
        </div>
      </div>

      {/* Best Seller Section */}
      <div className="max-w-6xl mx-auto px-6 py-11">
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="h-px flex-1 bg-neutral-300" />
          <h2 className="text-7xl font-[Prata] tracking-wide text-[#1d080f]"
          style={{ WebkitTextStroke: '0.5px #1d080f' }}
          >
            BEST SELLERS
            </h2>
          <div className="h-px flex-1 bg-neutral-300" />
        </div>

        <div className="relative">
          {/* Prev Arrow */}
          <button
            onClick={() => scroll("prev")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 shadow-md w-10 h-10 rounded-full hover:bg-white transition flex items-center justify-center text-xl"
          >
            ‹
          </button>

          {/* Scrollable Cards */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scroll-smooth no-scrollbar"
          >
            {bestSellers.map((item, i) => (
              <div
                key={i}
                className="relative min-w-[320px] h-[420px] flex-shrink-0 rounded-lg overflow-hidden group"
              >
              <img
              src={item.img}
              alt={item.name}
              className={`absolute inset-0 w-full h-full object-cover ${item.position} group-hover:scale-105 transition duration-300`}
              />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-[Prata] font-semibold mb-1">{item.name}</h3>
                  <p className="text-sm text-neutral-200">{item.price}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Next Arrow */}
          <button
            onClick={() => scroll("next")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 shadow-md w-10 h-10 rounded-full hover:bg-white transition flex items-center justify-center text-xl"
          >
            ›
          </button>
        </div>
        <div className="flex justify-center mt-12">
          <Link
          to="/menu"
          className="border border-[#1d080f] text-[#1d080f] px-5 py-2 text-xs font-[Prata] hover:bg-[#1d080f] hover:text-white transition inline-flex items-center gap-2"
          >
            See Full Menu <span aria-hidden>→</span>
            </Link>
            </div>
      </div>

    <section className="relative bg-[#1d080f] text-[#f1ece7] py-24 px-6 flex flex-col items-center justify-center text-center">
  <div className="w-px h-10 bg-amber-500 mb-10" />
        <p className="font-serif italic text-lg md:text-lg max-w-lg leading-relaxed mb-20">
          No reviews yet — be the first to share your experience.
        </p>

        <div className="flex items-end justify-end gap-2 py-18">
          <span className="w-2 h-2 rounded-full bg-neutral-500" />
          <span className="w-2 h-2 rounded-full bg-neutral-500" />
          <span className="w-2 h-2 rounded-full bg-neutral-500" />
        </div>
      </section>

      <FindUs />
    </div>
  )
}

export default Homepage