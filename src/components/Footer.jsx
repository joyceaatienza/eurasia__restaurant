import React from 'react';

function Footer() {
  return (
    <footer className="static w-full bg-[#1d080f] text-[#f1ece7] px-4 md:px-16 py-4 md:py-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-5 md:gap-8">

        {/* Contact Us Section */}
        <div className="flex flex-col items-center md:items-start w-full md:w-auto">
          <h3 className="text-xs font-[Prata] font-bold mb-2 md:mb-4">Contact Us</h3>

          <div className="grid grid-cols-2 gap-x-4 md:gap-x-12 gap-y-2 items-center w-full max-w-md md:max-w-none">

            {/* Facebook Link */}
            <a
              href="https://www.facebook.com/EaurasiaRestaurant"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-amber-300 transition"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z" />
              </svg>
              <span className="font-[Prata] text-[11px] md:text-xs">Eurasia</span>
            </a>

            {/* Phone Number */}
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.6 10.8c1.3 2.6 3.4 4.7 6 6l2-2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.8c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z" />
              </svg>
              <span className="font-[Prata] text-[11px] md:text-xs">0927 012 4998</span>
            </div>

            {/* Instagram Link */}
            <a
              href="https://www.instagram.com/eurasiarestaurant_"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-amber-300 transition"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
              <span className="font-[Prata] text-[11px] md:text-xs truncate">eurasiarestaurant_</span>
            </a>

            {/* Email Link */}
            <div className="flex items-center gap-2 min-w-0">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m3 6 9 7 9-7" />
              </svg>
              <a
                href="mailto:eurasiarestaurant01@gmail.com"
                className="font-[Prata] text-[10px] md:text-xs underline hover:text-amber-300 truncate"
              >
                eurasiarestaurant01@gmail.com
              </a>
            </div>

          </div>
        </div>

        {/* Feedback Section */}
        <div className="flex flex-col items-center md:items-end">
          <h3 className="text-xs font-[Prata] font-bold mb-2 md:mb-4">Give your feedback</h3>
          <a
            href="feedback"
            className="border border-amber-300 text-amber-300 rounded-full px-5 py-0.5 md:py-1 text-[11px] md:text-xs font-[Prata] hover:bg-amber-300 hover:text-neutral-900 transition"
          >
            Feedback
          </a>
        </div>

      </div>
    </footer>
  );
}

export default Footer;