"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The way around the app. On a phone, a floating bar at the bottom. On a
// laptop, a strip across the top of the window holding a segmented control;
// pages leave room for its 52px with lg top padding or margin.
const TABS = [
  { href: "/", label: "Places", match: (p: string) => p === "/", icon: PlacesIcon },
  { href: "/trips", label: "Trips", match: (p: string) => p.startsWith("/trips"), icon: TripsIcon },
  { href: "/profile", label: "Profile", match: (p: string) => p.startsWith("/profile"), icon: ProfileIcon },
];

export default function AppNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/sign-in")) return null;

  return (
    <>
      <nav
        aria-label="Main"
        className="floating fixed inset-x-4 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 mx-auto flex h-[60px] max-w-sm items-center gap-1 rounded-full p-1.5 lg:hidden"
      >
        {TABS.map(({ href, label, match, icon: Icon }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex h-full flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold ${
                active ? "pressed" : "text-secondary"
              }`}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="fixed inset-x-0 top-0 z-30 hidden h-[52px] items-center justify-center border-b border-separator bg-background px-4 lg:flex">
        <nav aria-label="Main" className="control grid w-80 grid-cols-3 rounded-segmented p-0.5">
          {TABS.map(({ href, label, match }) => (
            <Link
              key={href}
              href={href}
              aria-current={match(pathname) ? "page" : undefined}
              className="flex h-8 items-center justify-center rounded-segment text-[15px] font-medium aria-[current=page]:raised aria-[current=page]:font-semibold"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function PlacesIcon() {
  return (
    <Svg>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.800 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </Svg>
  );
}

function TripsIcon() {
  return (
    <Svg>
      <rect x="4" y="8" width="16" height="12" rx="2.5" />
      <path d="M9 8V6a1.500 1.500 0 0 1 1.500-1.500h3A1.500 1.500 0 0 1 15 6v2" />
      <path d="M4 13h16" />
    </Svg>
  );
}

function ProfileIcon() {
  return (
    <Svg>
      <circle cx="12" cy="8.500" r="3.500" />
      <path d="M5 20c.8-3.500 3.600-5.500 7-5.500s6.200 2 7 5.500" />
    </Svg>
  );
}
