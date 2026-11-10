import Navbar from "./components/Navbar";
import Hero from "./components/Hero";

function App() {
  return (
    <div className="min-h-screen bg-[#050306] text-vybe-200">
      {/* One shared backdrop surfaces both the navbar and the page body */}
      <div className="hero-backdrop relative isolate">
        <Navbar />
        <Hero />
      </div>
    </div>
  );
}

export default App;
