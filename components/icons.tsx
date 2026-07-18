// Jeu d'icônes minimal (trait, 24×24) — pas de dépendance externe
import type { SVGProps } from "react";

const paths: Record<string, React.ReactNode> = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 10v11h14V10" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 20c1-3.5 3.7-5.5 7-5.5s6 2 7 5.5" />
      <circle cx="17.5" cy="9.5" r="2.5" />
      <path d="M15.5 14.6c2.8.3 4.7 1.9 5.5 4.4" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  book: (
    <>
      <path d="M12 5c-2-1.5-4.5-2-8-2v16c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2V3c-3.5 0-6 .5-8 2z" />
      <path d="M12 5v16" />
    </>
  ),
  calendarX: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M16 3v4M8 3v4" />
      <path d="m10 13.5 4 4m0-4-4 4" />
    </>
  ),
  banknote: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </>
  ),
  megaphone: (
    <>
      <path d="M3 10.5v3a1 1 0 0 0 .7 1L18 19V5L3.7 9.6a1 1 0 0 0-.7.9z" />
      <path d="M18 8.5a3.5 3.5 0 0 1 0 7" />
      <path d="M7.5 15.5V20h3" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5h16v11H9l-5 4V5z" />
    </>
  ),
  idCard: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="11" r="2" />
      <path d="M5.5 16.5c.5-1.5 1.6-2.3 3-2.3s2.5.8 3 2.3" />
      <path d="M14 10h5M14 14h4" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="9" cy="6" r="2" fill="white" />
      <circle cx="15" cy="12" r="2" fill="white" />
      <circle cx="7" cy="18" r="2" fill="white" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </>
  ),
  cap: (
    <>
      <path d="M12 4 2 9l10 5 10-5-10-5z" />
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  upload: (
    <>
      <path d="M12 16V4m0 0 -4 4m4-4 4 4" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>
  ),
  printer: (
    <>
      <path d="M7 8V3h10v5" />
      <rect x="3" y="8" width="18" height="9" rx="2" />
      <path d="M7 14h10v7H7v-7z" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
};

export type IconName = keyof typeof paths;

export function Icon({
  name,
  className = "h-5 w-5",
  ...props
}: { name: IconName; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
