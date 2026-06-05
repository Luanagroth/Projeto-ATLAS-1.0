import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center bg-background px-6 py-12">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <div className="max-w-2xl space-y-5">
          <p className="text-sm font-medium text-muted-foreground">
            Atlas 1.0
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Auditorias e conformidade em um painel B2B organizado.
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            A base visual do Atlas está pronta para autenticação, navegação e
            acompanhamento inicial da operação.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="h-10">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild className="h-10" variant="outline">
            <Link href="/dashboard">Abrir dashboard</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
