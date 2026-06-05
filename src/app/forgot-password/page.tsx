import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          Recuperação de senha
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          A recuperação automática será implementada futuramente. Por enquanto,
          solicite a redefinição manual ao administrador da sua organização.
        </p>
        <Button asChild className="mt-6">
          <Link href="/login">Voltar ao login</Link>
        </Button>
      </section>
    </main>
  );
}
