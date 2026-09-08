type IconProps = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function MailIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5,6.5 L12,13 L20.5,6.5" />
    </svg>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5.5,3.5 h3 l1.5,4 -2,1.5 a12,12 0 0 0 6.5,6.5 l1.5,-2 4,1.5 v3 a2,2 0 0 1 -2.2,2 A17,17 0 0 1 3.5,5.7 a2,2 0 0 1 2,-2.2 Z" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6,9 L12,15 L18,9" />
    </svg>
  );
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12,21 C12,21 19,14.5 19,10 a7,7 0 1 0 -14,0 C5,14.5 12,21 12,21 Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

export function PackageIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3.5,7.5 L12,3 L20.5,7.5 L20.5,16.5 L12,21 L3.5,16.5 Z" />
      <path d="M3.5,7.5 L12,12 L20.5,7.5 M12,12 v9" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.3,15.3 L21,21" />
    </svg>
  );
}

export function PlaneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M21,15.5 v-2 l-8,-5 V4 a1.5,1.5 0 0 0 -3,0 v4.5 l-8,5 v2 l8,-2.5 V18 l-2.5,1.5 V21 l3.5,-1 l3.5,1 v-1.5 L13,18 v-5.5 Z" />
    </svg>
  );
}

export function ShipIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3,17 L5,10 h14 l2,7" />
      <path d="M7,10 V5 h6 v5" />
      <path d="M2,20 c1.5,1.3 3,1.3 4.5,0 c1.5,1.3 3,1.3 4.5,0 c1.5,1.3 3,1.3 4.5,0 c1.5,1.3 3,1.3 4.5,0" />
    </svg>
  );
}

export function TruckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="1.5" y="7" width="12" height="9" />
      <path d="M13.5,10 h4 l3.5,3.5 V16 h-7.5 Z" />
      <circle cx="6" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </svg>
  );
}

export function ShieldCheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12,3 L19,6 v5.5 c0,4.5 -3,7.5 -7,8.5 c-4,-1 -7,-4 -7,-8.5 V6 Z" />
      <path d="M9,12 l2.2,2.2 L16,9.5" />
    </svg>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5,12 h17 M12,3.5 c3,3 3,14 0,17 c-3,-3 -3,-14 0,-17 Z" />
    </svg>
  );
}

export function BuildingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="4" y="3" width="16" height="18" />
      <path d="M8,7 h2 M14,7 h2 M8,11 h2 M14,11 h2 M8,15 h2 M14,15 h2" />
      <path d="M10,21 v-4 h4 v4" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3,20 c0,-3.5 2.7,-6 6,-6 c3.3,0 6,2.5 6,6" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.5,14.2 c2.6,0.4 4.5,2.4 4.5,5.3" />
    </svg>
  );
}

export function BriefcaseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="2.5" y="7.5" width="19" height="12" rx="1.5" />
      <path d="M8,7.5 V5.5 a1.5,1.5 0 0 1 1.5,-1.5 h5 a1.5,1.5 0 0 1 1.5,1.5 v2" />
      <path d="M2.5,13 h19" />
    </svg>
  );
}

export function FileIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6,2.5 h9 l4.5,4.5 v14 a1,1 0 0 1 -1,1 h-12.5 a1,1 0 0 1 -1,-1 v-17.5 a1,1 0 0 1 1,-1 Z" />
      <path d="M15,2.5 v4.5 h4.5" />
      <path d="M8.5,13 h7 M8.5,16.5 h7 M8.5,9.5 h3" />
    </svg>
  );
}

export function PercentIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5,19 L19,5" />
      <circle cx="7" cy="7" r="2.4" />
      <circle cx="17" cy="17" r="2.4" />
    </svg>
  );
}

export function IdCardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="1.8" />
      <circle cx="8" cy="11" r="2.1" />
      <path d="M4.8,16.3 c0.5,-1.8 2,-2.7 3.2,-2.7 c1.2,0 2.7,0.9 3.2,2.7" />
      <path d="M14,9 h4.3 M14,12 h4.3 M14,15 h2.8" />
    </svg>
  );
}

export function AwardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="9" r="5.3" />
      <path d="M9,13.5 L7.5,21 L12,18.5 L16.5,21 L15,13.5" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12,7 v5.5 l3.8,2.2" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5,20 c0,-4.1 3.4,-6.8 7.5,-6.8 c4.1,0 7.5,2.7 7.5,6.8" />
    </svg>
  );
}

export function HandshakeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M1.5,11 L5,7.5 h3.2 l3.3,3 M22.5,11 L19,7.5 h-3.2 l-2,1.8" />
      <path d="M4.5,10.5 L9,15 a1.6,1.6 0 0 0 2.3,0 a1.6,1.6 0 0 0 2.3,0 a1.6,1.6 0 0 0 2.2,-0.1 L19.5,10.5" />
      <path d="M9.3,13.2 L11.5,11.2 M13,15 L15.3,12.8" />
    </svg>
  );
}

export function HeadsetIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4,13 v-1 a8,8 0 0 1 16,0 v1" />
      <rect x="2.5" y="13" width="4.5" height="6" rx="1.5" />
      <rect x="17" y="13" width="4.5" height="6" rx="1.5" />
      <path d="M19.3,19 v1.2 a2,2 0 0 1 -2,2 h-3.8" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="1.8" />
      <path d="M7.5,10.5 V7 a4.5,4.5 0 0 1 9,0 v3.5" />
      <circle cx="12" cy="15" r="1.6" />
      <path d="M12,16.6 v2" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4,12.5 L9.5,18 L20,6" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4,12 h16 M13,5 l7,7 -7,7" />
    </svg>
  );
}

export function TwitterIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M22,5.9c-.7.3-1.5.5-2.3.7.8-.5,1.5-1.3,1.7-2.3-.8.5-1.7.8-2.6,1a4.1,4.1,0,0,0-7,3.7A11.6,11.6,0,0,1,3.4,4.6a4.1,4.1,0,0,0,1.3,5.5,4.1,4.1,0,0,1-1.9-.5v.1a4.1,4.1,0,0,0,3.3,4,4.1,4.1,0,0,1-1.9.1,4.1,4.1,0,0,0,3.9,2.9A8.3,8.3,0,0,1,2,18.4a11.6,11.6,0,0,0,6.3,1.8c7.5,0,11.7-6.3,11.7-11.7v-.5C21,7.3,21.6,6.7,22,5.9Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkedinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <rect x="3" y="3" width="18" height="18" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="7.1" cy="8.1" r="1.3" />
      <rect x="6" y="10.5" width="2.3" height="7.5" />
      <path d="M11.2,10.5 h2.2 v1.2 c0.5,-0.9 1.5,-1.4 2.6,-1.4 c2.1,0 3,1.3 3,3.7 v4 h-2.3 v-3.6 c0,-1.1 -0.4,-1.8 -1.4,-1.8 c-0.8,0 -1.3,0.5 -1.5,1 c-0.1,0.2 -0.1,0.5 -0.1,0.8 v3.6 h-2.3 c0,-0.1 0,-6.6 0,-7.5 Z" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.5,21.4 v-6.9 h2.3 l0.35,-2.7 h-2.65 v-1.7 c0,-0.8 0.2,-1.3 1.35,-1.3 h1.4 V6.4 c-0.25,0 -1.1,-0.1 -2,-0.1 c-2,0 -3.4,1.2 -3.4,3.5 v2 H8.6 v2.7 h2.3 v6.9 Z" />
    </svg>
  );
}
