import pensionhand from '../assets/pension1.png';
import Chat from './Chat.jsx';
import Seo from '../components/Seo';


export default function Home() {

  return (
    <section id="Home"
      className="relative min-h-screen flex flex-col md:flex-row items-center justify-between 
                 px-3 md:px-5 lg:px-10 py-12 gap-12"
      style={{ background: "var(--body-color)" }}
    >
      {/* Left: Animated Hand with Label */}
      <div className="flex-1 flex flex-col items-center mb-8 md:mb-0">
        <img
          src={pensionhand}
          alt="Pension Support"
          className="w-72 md:w-96 lg:w-[420px] drop-shadow-2xl rounded-lg animate-float"
        />

        {/* Label Under Hand */}
        <div className="mt-0 flex items-center w-full max-w-xs">
          <div>
            <h4 className="text-white font-semibold text-sm">The Labu “Reiza”</h4>
            <p className="text-gray-300 text-xs">The Living Pumpkin</p>
          </div>
          <div className="flex flex-col items-center ml-4">
            <div className="w-2 h-2 rounded-full bg-white mb-0"></div>
            <div className="w-px h-10 bg-white"></div>
          </div>
        </div>
      </div>

      <Seo
        title="DCPS NPS India — Pension Support & Guidance"
        description="Support, resources and community for DCPS/NPS pension holders in India. Learn about procedures, share posts, and get help."
        ogTitle="DCPS NPS India — Pension Support & Guidance"
        ogDescription="Support, resources and community for DCPS/NPS pension holders in India. Learn about procedures, share posts, and get help."
      />

      {/* Right: Content */}
      <div className="flex-1 text-center md:text-left md:pr-6 lg:pr-10 flex flex-col">
        <h4 className="uppercase text-sm tracking-widest font-semibold text-white opacity-80">
          #NationalPensionScheme
        </h4>

        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mt-3">
          PENSION FOR <br /> <span className="text-yellow-300">DCPS/NPS</span> HOLDERS
        </h1>

        <p className="mt-5 max-w-xl text-gray-200 leading-relaxed text-justify">
          Humble appeal and humble request to all DCPS / NPS holders in India.
          You have organized various fronts, different types of agitation through
          different organizations. At various levels, even from the Chief Minister
          to the Prime Minister, correspondence was discussed. But for the last 2–3
          years we have been struggling for our old pensions in a fair way.
          Thousands of families are lying on the horizon, it is a misunderstanding
          if someone comes and leaves you with an old pension.
          Now everyone should come in and meditate and think about it.
        </p>

       
      </div>
        
      {/* Right: Chat Component */}
     <Chat />
       
    </section>
  );
}
