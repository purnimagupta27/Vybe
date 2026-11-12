import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import RequireAuth from "./components/RequireAuth";
import RequireProfile from "./components/RequireProfile";
import { ProfileProvider } from "./lib/profile-context";
import Discover from "./pages/Discover";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";

function App() {
  return (
    <BrowserRouter>
      <ProfileProvider>
        <div className="min-h-screen bg-[#050306] text-vybe-200">
          <div className="hero-backdrop relative isolate">
            <Navbar />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route
                path="/onboarding"
                element={
                  <RequireAuth>
                    <Onboarding />
                  </RequireAuth>
                }
              />
              <Route
                path="/discover"
                element={
                  <RequireAuth>
                    <RequireProfile>
                      <Discover />
                    </RequireProfile>
                  </RequireAuth>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </ProfileProvider>
    </BrowserRouter>
  );
}

export default App;
