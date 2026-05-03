import Link from "next/link";

export function Brand({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const h = size === "sm" ? "h-5 md:h-6" : size === "lg" ? "h-8 md:h-10" : "h-6 md:h-7";
  return (
    <Link href="/" className="inline-flex items-center" aria-label="EDU Jini 홈">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-wordmark.png" alt="EDU Jini" className={`${h} w-auto`} />
    </Link>
  );
}
