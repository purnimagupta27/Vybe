import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AudioLines, LogOut, User, Users } from "lucide-react";
import { authClient, signInWithGoogle } from "../lib/auth-client";
import { useProfile } from "../lib/profile-context";

export default function Navbar() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const { profile } = useProfile();

  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  const joinWithGoogle = async () => {
    setError(null);
    setSigningIn(true);

    const signInError = await signInWithGoogle();

    /* On success the client redirects to Google, so we only get here when
       something failed. */
    if (signInError) {
      setSigningIn(false);
      setError(signInError);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await authClient.signOut();
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  const avatarUrl = profile?.image ?? user?.image ?? null;
  const initial = user?.name?.trim().charAt(0).toUpperCase() || "V";

  return (
    <nav className="relative z-30 flex h-16 translate-y-2 items-center justify-between px-6 sm:px-10">
      <Link to="/" className="group ml-2 flex select-none items-center gap-2 sm:ml-4">
        <AudioLines
          className="h-7 w-7 text-vybe-gold transition-transform duration-300 group-hover:scale-110"
          strokeWidth={2.5}
        />
        <span className="text-xl font-bold tracking-[0.2em] text-white/80">
          VYBE
        </span>
      </Link>

      <div className="mr-2 flex items-center gap-4 sm:mr-8">
        {user && (
          <Link
            to="/connections"
            aria-label="Connections"
            className="group relative flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/5 text-white/70 transition-all duration-200 hover:border-white/50 hover:bg-white/10 hover:text-white hover:scale-105 focus:outline-none focus:ring-2 focus:ring-vybe-gold/50"
          >
            <Users aria-hidden className="size-[18px]" />
            <span className="pointer-events-none absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-lg border border-white/15 bg-[#0e0914]/95 px-2.5 py-1 text-[11px] text-white/80 opacity-0 shadow-xl backdrop-blur-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
              Connections
            </span>
          </Link>
        )}

        <div className="relative" ref={menuRef}>
        {user ? (
          <div>
            <div className="group relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              aria-label="User menu"
              className="group flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/25 bg-white/5 transition-all duration-200 hover:border-white/50 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-vybe-gold/50"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.name ?? "Profile"}
                  className="size-full object-cover"
                />
              ) : (
                <span className="font-heading text-sm font-semibold text-vybe-gold">
                  {initial}
                </span>
              )}
            </button>

            {!dropdownOpen && (
              <span className="pointer-events-none absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-lg border border-white/15 bg-[#0e0914]/95 px-2.5 py-1 text-[11px] text-white/80 opacity-0 shadow-xl backdrop-blur-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                Profile
              </span>
            )}
            </div>

            {dropdownOpen && (
              <div
                role="menu"
                className="menu-pop absolute right-0 top-full mt-3 w-60 overflow-hidden rounded-2xl border border-white/12 bg-white/[0.06] p-1.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
              >
                <div className="flex items-center gap-3 px-2 py-2">
                  <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-vybe-gold/25 bg-white/5">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="font-heading text-sm font-semibold text-vybe-gold">
                        {initial}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-sm font-semibold text-white/90">
                      {user.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] leading-tight text-white/40">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="mx-1.5 my-1 border-t border-white/[0.07]" />

                <Link
                  to="/profile"
                  role="menuitem"
                  onClick={() => setDropdownOpen(false)}
                  className="group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
                >
                  <User className="size-4 text-white/40 transition-colors group-hover:text-vybe-gold" />
                  <span>View profile</span>
                </Link>

                <div className="mx-1.5 my-1 border-t border-white/[0.07]" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="group flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] text-rose-300/90 transition-colors hover:bg-rose-500/10 hover:text-rose-200 disabled:cursor-wait disabled:opacity-60"
                >
                  {signingOut ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-rose-400/20 border-t-rose-400" />
                  ) : (
                    <LogOut className="size-4 text-rose-400/70 transition-colors group-hover:text-rose-300" />
                  )}
                  <span>{signingOut ? "Logging out…" : "Log out"}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={joinWithGoogle}
              disabled={signingIn}
              className="cursor-pointer rounded-full border border-white/25 px-6 py-2 text-sm font-medium text-white/90 transition-[background-color,border-color] duration-200 hover:border-white/40 hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
            >
              {signingIn ? "Joining..." : "Join"}
            </button>
            {error && (
              <p className="max-w-[240px] text-right text-xs text-red-400">
                {error}
              </p>
            )}
          </div>
        )}
        </div>
      </div>

      {signingOut && (
        <div
          aria-live="polite"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="size-7 animate-spin rounded-full border-2 border-white/20 border-t-vybe-gold mb-3" />
          <p className="text-sm font-medium text-white/80">Logging out…</p>
        </div>
      )}
    </nav>
  );
}
