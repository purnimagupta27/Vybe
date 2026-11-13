import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import RequireAuth from "./components/RequireAuth";
import RequireGuest from "./components/RequireGuest";
import RequireProfile from "./components/RequireProfile";
import { ProfileProvider } from "./lib/profile-context";
import Discover from "./pages/Discover";
import Connections from "./pages/Connections";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import UserProfile from "./pages/UserProfile";

function App() {
  return (
    <BrowserRouter>
      <ProfileProvider>
        <div className="min-h-screen bg-[#050306] text-vybe-200">
          <div className="hero-backdrop relative isolate min-h-screen">
            <Navbar />
            <Routes>
              <Route
                path="/"
                element={
                  <RequireGuest>
                    <Landing />
                  </RequireGuest>
                }
              />
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
              <Route
                path="/connections"
                element={
                  <RequireAuth>
                    <RequireProfile>
                      <Connections />
                    </RequireProfile>
                  </RequireAuth>
                }
              />
              <Route
                path="/profile/edit"
                element={
                  <RequireAuth>
                    <RequireProfile>
                      <ProfileEdit />
                    </RequireProfile>
                  </RequireAuth>
                }
              />
              <Route
                path="/profile/:userId"
                element={
                  <RequireAuth>
                    <RequireProfile>
                      <UserProfile />
                    </RequireProfile>
                  </RequireAuth>
                }
              />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <Profile />
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
