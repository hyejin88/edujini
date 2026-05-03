import Link from "next/link";

export function Brand({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  // 캐릭터는 정사각형 → 글자 워드마크 대비 시인성 위해 약간 더 크게
  const h = size === "sm" ? "h-7 md:h-8" : size === "lg" ? "h-10 md:h-12" : "h-8 md:h-10";
  return (
    <Link href="/" className="inline-flex items-center" aria-label="EDU Jini 홈">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/character.png" alt="EDU Jini" className={`${h} w-auto`} />
    </Link>
  );
}
