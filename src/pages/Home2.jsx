import pensionJar from '../assets/pension2.png';
{ /* Pension Section Component */ }
export default function PensionSection() {
  return (
        <section
    className="relative min-h-screen flex flex-col md:flex-row-reverse items-center justify-between 
                px-6 md:px-24 lg:px-40 py-12 gap-1"
    style={{ background: "var(--body-color)" }}
    >
      {/* RIGHT: Pension Jar Image */}
      <div className="flex-1 flex flex-col items-center md:items-end mb-6 md:mb-0">
        <img
          src={pensionJar}
          alt="Pension Jar"
          className="w-72 md:w-96 lg:w-[420px] drop-shadow-2xl animate-float 
                      transition-transform duration-500"
        />

        {/* Label */}
        <div className="mt-2 flex items-center w-full max-w-xs justify-end">
          <div className="flex flex-col items-end text-right">
            <h4 className="text-white font-semibold text-sm">Adino & Grahami</h4>
            <p className="text-gray-300 text-xs">No words can describe them</p>
          </div>
          <div className="flex flex-col items-center ml-3">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <div className="w-px h-10 bg-white"></div>
          </div>
        </div>
      </div>

      {/* LEFT: Content */}
      <div className="flex-1 text-center md:text-left md:pr-6 lg:pr-10 max-w-xl">
        <h4 className="uppercase text-sm tracking-widest font-semibold text-white opacity-80">
          #NationalPensionSystem
        </h4>

        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mt-3">
          DEFINED <span className="text-yellow-300">CONTRIBUTION</span> <br /> PENSION SCHEME
        </h1>

        <p className="mt-5 text-gray-200 leading-relaxed text-justify">
          Old pensions are possible only if all unions fight together. The only idea behind
          establishing an organization is to provide old pension to the DCPS/NPS holders and
          keep the heirs struggling till they are compensated by providing financial assistance
          to the deceased employees. We will also be supporting employees who are struggling
          within the country and on the border who cannot organize.
        </p>

       
      </div>
    </section>
  );
}
