import heroImage from '../assets/bgHero.jpg'
import logo from '../assets/logoword.png'

function AboutUs() {
  return (
    <div className="bg-white text-[#1d080f]">
      {/* Hero Header */}
      <div className="relative h-64 md:h-60 overflow-hidden shrink-0">
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-white/40" />
        <div className="relative flex h-full items-start justify-center px-4 pt-16 md:pt-20">
          <img src={logo} alt="Eurasia Restaurant" className="h-20 w-auto md:h-36" />
        </div>
      </div>

      {/* What We Offer */}
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h2 className="font-[Prata] text-2xl md:text-3xl text-[#1d080f] mb-8">What We Offer</h2>

        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-8">
          <div className="border border-neutral-200 rounded-lg px-8 py-6 flex items-center gap-3 justify-center">
            <span className="text-2xl">🍴</span>
            <span className="font-[Prata] text-[#1d080f]">European Foods</span>
          </div>
          <div className="border border-neutral-200 rounded-lg px-8 py-6 flex items-center gap-3 justify-center">
            <span className="text-2xl">🍴</span>
            <span className="font-[Prata] text-[#1d080f]">Asian Foods</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {["Takeout", "Reservations", "In-store Pickup", "Dine-in", "Outdoor Seating"].map((c) => (
            <span
              key={c}
              className="text-xs font-[Prata] border border-[#1d080f] text-[#1d080f] rounded-full px-4 py-2"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Mission */}
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-4 text-left text-sm md:text-base text-[#1d080f] leading-relaxed font-[Prata]">
          <h2 className="text-2xl md:text-3xl mb-4">Mission</h2>
          <p>Our mission is to inspire healthier communities by connecting people to real food.</p>
          <p>
            We are committed to providing great-tasting, high-quality food that is cooked with
            fresh ingredients in a clean environment. We strive to give our customers an enjoyable
            experience by offering excellent service and reasonably priced meals.
          </p>
          <p>
            Our goal is to be the go-to destination for delicious, healthy food in a relaxed
            atmosphere. We strive to create an inviting space where friends and families can come
            together for great conversation and amazing food.
          </p>
          <p>
            At our restaurant, we are passionate about creating an unforgettable experience for our
            guests through outstanding hospitality and delicious cuisine. Our mission is to ensure
            every customer feels special, and we strive to provide a memorable dining experience!
          </p>
        </div>
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop"
          alt="Restaurant interior"
          className="rounded-lg w-full h-[380px] object-cover"
        />
      </div>

      {/* History */}
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200&auto=format&fit=crop"
          alt="Restaurant terrace view"
          className="rounded-lg w-full h-[380px] object-cover order-2 md:order-1"
        />
        <div className="text-left font-[Prata] text-[#1d080f] order-1 md:order-2">
          <h2 className="text-2xl md:text-3xl mb-2">History</h2>
          <p className="text-sm italic mb-4 text-neutral-500">
            Eurasia <span>(Europe + Asia)</span>
          </p>
          <p className="text-sm md:text-base leading-relaxed mb-3">
            Eurasia is a fine-dining restaurant located in Banay-Banay, San Jose, Batangas,
            specifically on the 5th Floor of the ARADA VIRTUCIO Building.
          </p>
          <p className="text-sm md:text-base leading-relaxed mb-3">
            It was built in 2024 as a gift from the loving parents of the owner.
          </p>
          <p className="text-sm md:text-base leading-relaxed">
            Eurasia offers a unique combination of European and Asian cuisine, providing customers
            with a diverse dining experience.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AboutUs