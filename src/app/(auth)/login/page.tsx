import { redirect } from "next/navigation";

import { getAuthSession } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
};

function getSafeCallbackUrl(callbackUrl?: string) {
  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return "/dashboard";
  }

  return callbackUrl;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getAuthSession();

  if (session?.user?.organizationId) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const callbackUrl = getSafeCallbackUrl(params?.callbackUrl);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Atlas</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Acesse sua conta
          </h1>
          <p className="text-sm text-muted-foreground">
            Entre para continuar no painel do Atlas.
          </p>
        </div>
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
