import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← 홈으로
          </Link>
          <Brand />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/character.png"
          alt=""
          className="mx-auto mb-6 h-32 w-32 opacity-90"
        />
        <h1 className="mb-3 text-3xl font-bold text-foreground">
          페이지를 찾을 수 없어요
        </h1>
        <p className="mb-8 text-base text-muted-foreground">
          주소가 틀렸거나 페이지가 옮겨졌을 수 있어요.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/">
            <Button size="lg" className="min-h-[48px] bg-primary hover:bg-primary/90">
              홈으로
            </Button>
          </Link>
          <Link href="/library?grade=3&subject=수학&mode=comp">
            <Button size="lg" variant="outline" className="min-h-[48px] border-2">
              초3 단원 학습 보기
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
