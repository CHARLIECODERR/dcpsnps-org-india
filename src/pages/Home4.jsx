{ /* Home4 Component - Mission Section */ }

export default function Home4() {
  return (
    <section
      className="relative min-h-screen flex flex-col md:flex-row items-center justify-between 
                 px-6 md:px-24 lg:px-40 pt-0 pb-8 gap-12"
      style={{ background: "var(--body-color)" }}
    >
      {/* LEFT: Content */}
      <div className="w-full text-left max-w-5xl">
        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-4">
          OUR <span className="text-yellow-300">MISSION</span>
        </h1>

        {/* Paragraph */}
        <p className="text-lg text-gray-200 leading-relaxed mb-8">
          Now we will come together and give the message to the media and the governors 
          that they are going to fight together. There is no doubt that our mission is 
          going to be a success if we take our families along with us in this national 
          movement. A humble appeal to old pensioners is just a fight.
        </p>

      
      </div>
    </section>
  );
}