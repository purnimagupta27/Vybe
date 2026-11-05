import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Feed from "./pages/Feed";

/* Tiny path router for now: the Google OAuth callback lands on /feed.
   When routes multiply, swap this for a real router. */
function App() {
  const onFeed = window.location.pathname === "/feed";

  return (
    <div className="min-h-screen bg-[#050306] text-vybe-200">
      {/* One shared backdrop surfaces both the navbar and the page body */}
      <div className={onFeed ? "relative isolate" : "hero-backdrop relative isolate"}>
        <Navbar />
        {onFeed ? <Feed /> : <Hero />}
      </div>
    </div>
  );
}

export default App;
