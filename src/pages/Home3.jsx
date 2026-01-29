import pension3 from '../assets/pension3.png'; // <-- replace with your actual image path

{ /* Home3 Component/NPS Page */}
export default function Home3() {
  return (
   <section
      className="relative min-h-screen flex flex-col md:flex-row items-center justify-between 
                 px-6 md:px-24 lg:px-40 py-8 gap-8"
      style={{ background: "var(--body-color)" }}
    >
      {/* LEFT: Pension Illustration */}
      <div className="flex-1 flex flex-col items-center md:items-start mb-8 md:mb-0">
        <img
          src={pension3}
          alt="National Pension System"
          className="w-72 md:w-96 lg:w-[420px] drop-shadow-2xl animate-float"
        />
        {/* Label Under Image */}
        <div className="mt-2 flex items-center w-full max-w-xs">
          <div>
            <h4 className="text-white font-semibold text-sm">Captain Sem</h4>
            <p className="text-gray-300 text-xs">Veteran Spooky Ghost</p>
          </div>
          <div className="flex flex-col items-center ml-4">
            <div className="w-2 h-2 rounded-full bg-white mb-0"></div>
            <div className="w-px h-10 bg-white"></div>
          </div>
        </div>
      </div>

      {/* RIGHT: Content */}
      <div className="flex-1 text-center md:text-left md:pr-6 lg:pr-10 flex flex-col">
        <h4 className="uppercase text-sm tracking-widest font-semibold text-white opacity-80">
          #PensionSystem
        </h4>

        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mt-3">
          NATIONAL PENSION <br /> SYSTEM <span className="text-yellow-300">(NPS)</span>
        </h1>

        <p className="mt-5 text-gray-200 leading-relaxed text-justify max-w-xl">
          All the organizations have done remarkable work till date. Stay in the 
          organization you are in, but everyone should come together as well and humbly 
          request and urge all the office bearers and DPS / NPS holders that, as a start, 
          we should fast for one day at a time in front of the Tehsil / Collector office 
          all over the country at the same time. All the unions of your district should 
          attend and make a single statement and submit the name and signature of the 
          office bearers and give it to the Tahsildar / Collector in the hands of the 
          women representative.
        </p>

        
      </div>
    </section>
  );
}
