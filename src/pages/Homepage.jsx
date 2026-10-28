import heroVideo from '../assets/eurasia-bg.mp4'
import bgPoster from '../assets/bg.jpg'
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
import { getReviews } from "../utils/reviewsStore";
import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";

function FindUs() {
  const address = "5th Floor ARADA VIRTUCIO Building, Banay-Banay, San Jose, Batangas";
  const encodedAddress = encodeURIComponent(address);

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 bg-[#fdfbf7]">
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

      <div className="flex flex-col justify-center items-start text-left px-8 md:px-16 py-16 bg-[#fdfbf7]">
        <h2 className="font-[Prata] font-bold text-xl md:text-2xl text-[#1d080f] mb-8" style={{ WebkitTextStroke: '0.6px #1d080f' }}>
          Find Us
        </h2>

        <p className="font-[Prata] text-[11px] md:text-xs text-[#1d080f] mb-1 leading-relaxed">
          5th Floor, ARADA VIRTUCIO Building
        </p>
        <p className="font-[Prata] text-[11px] md:text-xs text-[#1d080f] mb-4 leading-relaxed">
          Banay-Banay, San Jose, Batangas
        </p>

        <a href="https://maps.app.goo.gl/Zbj7QZiMJdfBg7Rr6" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-fit border border-[#1d080f] text-[#1d080f] px-8 py-3 font-[Prata] text-xs tracking-wider hover:bg-[#1d080f] hover:text-white transition duration-300">
          Get Directions
        </a>
      </div>
    </section>
  );
}

function ReviewsSection({ reviews }) {
  const [current, setCurrent] = useState(0);

  return (
    <section className="relative bg-[#1d080f] text-[#f1ece7] py-24 px-6 flex flex-col items-center justify-center text-center">
      <div className="w-px h-10 bg-amber-500 mb-10" />

      {reviews.length === 0 ? (
        <p className="font-serif italic text-lg md:text-lg max-w-lg leading-relaxed">
          No reviews yet — be the first to share your experience.
        </p>
      ) : (
        <>
          <div className="max-w-xl mb-4">
            <p className="font-serif italic text-lg md:text-lg leading-relaxed">
              "{reviews[current].message}"
            </p>
            <div className="flex justify-center gap-1 mt-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={star <= reviews[current].rating ? "text-amber-400" : "text-neutral-600"}
                  style={{ fontSize: 16 }}
                >
                  ★
                </span>
              ))}
            </div>
            <p className="mt-3 font-[Prata] text-sm text-amber-300">— {reviews[current].name}</p>
          </div>

          <div className="flex items-center justify-center gap-2 py-6">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Review ${i + 1}`}
                className={`w-2 h-2 rounded-full transition ${
                  i === current ? "bg-amber-400" : "bg-neutral-500"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Homepage() {
  const bestSellers = [
    { name: 'Baked Salmon', price: 'Php. 755', img: bakedSalmon, position: 'object-bottom' },
    { name: 'Texas BBQ Ribs', price: 'Php. 876', img: bbqRibs, position: 'object-bottom' },
    { name: 'Norwegian Salmon', price: 'Php. 1490', img: norwegianSalmon, position: 'object-bottom' },
    { name: 'Texas Chicken BBQ', price: 'Php. 599', img: chickenBbq, position: 'object-bottom' },
    { name: 'Al Tonno', price: 'Php. 578', img: alTonno, position: 'object-bottom' },
    { name: 'Mexicana', price: 'Php. 704', img: mexicana, position: 'object-bottom' },
    { name: 'Tutto Mare', price: 'Php. 578', img: tuttoMare, position: 'object-bottom' },
    { name: 'Pepperoni', price: 'Php. 578', img: pepperoni, position: 'object-bottom' },
    { name: 'Margherita', price: 'Php. 578', img: margherita, position: 'object-bottom' },
    { name: 'Quatro Formaggi', price: 'Php. 693', img: quatroFormaggi, position: 'object-bottom' },
    { name: 'Carne Supreme', price: 'Php. 711', img: carneSupreme, position: 'object-bottom' },
  ]

  const loopedItems = [...bestSellers, ...bestSellers, ...bestSellers];

  const scrollRef = useRef(null);
  const isJumping = useRef(false);
  const videoRef = useRef(null);
  const [reviews, setReviews] = useState([]);
  const [showPlayBtn, setShowPlayBtn] = useState(false);

  useEffect(() => {
    getReviews()
      .then(setReviews)
      .catch(() => setReviews([]));
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.play().catch(() => {
      // iOS Safari blocked autoplay — show a styled play button instead
      setShowPlayBtn(true);
    });
  }, []);

  const handlePlayBtn = () => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
    setShowPlayBtn(false);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollLeft = el.scrollWidth / 3;
      });
    }
  }, []);

  const CARD_WIDTH = 320 + 24;

  const handleScrollEnd = () => {
    const el = scrollRef.current;
    if (!el || isJumping.current) return;

    const oneSet = el.scrollWidth / 3;

    if (el.scrollLeft >= oneSet * 2) {
      isJumping.current = true;
      el.style.scrollBehavior = "auto";
      el.scrollLeft -= oneSet;
      el.style.scrollBehavior = "";
      isJumping.current = false;
    } else if (el.scrollLeft <= oneSet * 0.5) {
      isJumping.current = true;
      el.style.scrollBehavior = "auto";
      el.scrollLeft += oneSet;
      el.style.scrollBehavior = "";
      isJumping.current = false;
    }
  };

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;

    el.scrollBy({
      left: direction === "next" ? CARD_WIDTH : -CARD_WIDTH,
      behavior: "smooth",
    });

    setTimeout(handleScrollEnd, 400);
  };

  return (
    <div className="bg-white">
      <div className="relative h-[500px] flex flex-col items-center justify-center text-center overflow-hidden">
        <video
          ref={videoRef}
          src={heroVideo}
          poster={bgPoster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" />

        {/* Play button overlay — only shown when iOS Safari blocks autoplay */}
        {showPlayBtn && (
          <button
            onClick={handlePlayBtn}
            aria-label="Play video"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              background: "rgba(29, 8, 15, 0.45)",
              border: "none",
              cursor: "pointer",
              zIndex: 10,
            }}
          >
            {/* Circle with triangle */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(245, 233, 216, 0.15)",
                border: "2px solid rgba(245, 233, 216, 0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(4px)",
              }}
            >
              {/* Triangle play icon */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: "14px solid transparent",
                  borderBottom: "14px solid transparent",
                  borderLeft: "24px solid rgba(245, 233, 216, 0.9)",
                  marginLeft: 6,
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "'Prata', serif",
                fontSize: 13,
                color: "rgba(245, 233, 216, 0.85)",
                letterSpacing: "0.1em",
              }}
            >
              Tap to play
            </span>
          </button>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-11">
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="h-px flex-1 bg-neutral-300" />
          <h2 className="text-7xl font-[Prata] tracking-wide text-[#1d080f]" style={{ WebkitTextStroke: '0.5px #1d080f' }}>
            BEST SELLERS
          </h2>
          <div className="h-px flex-1 bg-neutral-300" />
        </div>

        <div className="relative">
          <button
            onClick={() => scroll("prev")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 shadow-md w-10 h-10 rounded-full hover:bg-white transition flex items-center justify-center text-xl"
          >
            ‹
          </button>

          <div
            ref={scrollRef}
            onScroll={() => {
              clearTimeout(scrollRef.current._t);
              scrollRef.current._t = setTimeout(handleScrollEnd, 100);
            }}
            className="flex gap-6 overflow-x-auto scroll-smooth no-scrollbar"
          >
            {loopedItems.map((item, i) => (
              <div key={i} className="relative min-w-[320px] h-[420px] flex-shrink-0 rounded-lg overflow-hidden group">
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

          <button
            onClick={() => scroll("next")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 shadow-md w-10 h-10 rounded-full hover:bg-white transition flex items-center justify-center text-xl"
          >
            ›
          </button>
        </div>

        <div className="flex justify-center mt-12">
          <Link to="/menu" className="border border-[#1d080f] text-[#1d080f] px-5 py-2 text-xs font-[Prata] hover:bg-[#1d080f] hover:text-white transition inline-flex items-center gap-2">
            See Full Menu <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      <ReviewsSection reviews={reviews} />
      <FindUs />
    </div>
  )
}

export default Homepage