"use client";

import { Check, LifeBuoy, Mail, MessageCircleMore } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SUPPORT_EMAIL = "suporte@atlas.local";
const SUPPORT_PHONE = "5511999999999";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function ForgotPasswordRequestCard() {
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [details, setDetails] = useState("");
  const [copied, setCopied] = useState(false);

  const subject = `Redefinicao de senha - ${email || "usuario Atlas"}`;
  const message = useMemo(() => {
    return [
      "Olá, equipe Atlas!",
      "",
      "Preciso de ajuda para redefinir minha senha de acesso.",
      email ? `Email de acesso: ${email}` : "Email de acesso: não informado",
      organization ? `Organização: ${organization}` : null,
      details ? `Observações: ${details}` : null,
      "",
      "Solicito orientação para recuperar meu acesso.",
    ]
      .filter(Boolean)
      .join("\n");
  }, [details, email, organization]);

  const mailtoHref = `mailto:${encodeURIComponent(SUPPORT_EMAIL)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  const whatsappHref = `https://wa.me/${digitsOnly(SUPPORT_PHONE)}?text=${encodeURIComponent(message)}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="w-full max-w-xl rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color:rgba(194,124,58,0.12)] text-[color:var(--atlas-accent)]">
          <LifeBuoy className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recuperação de senha</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Preencha seus dados e abra o contato com o suporte. O texto já sai pronto para e-mail
            ou WhatsApp.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="recoveryEmail">Email de acesso</Label>
          <Input
            id="recoveryEmail"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@empresa.com"
            type="email"
            value={email}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recoveryOrganization">Empresa ou organização</Label>
          <Input
            id="recoveryOrganization"
            onChange={(event) => setOrganization(event.target.value)}
            placeholder="Ex.: Atlas Consultoria"
            value={organization}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recoveryDetails">Observações</Label>
          <Textarea
            id="recoveryDetails"
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Se quiser, descreva o contexto do acesso"
            value={details}
          />
        </div>

        <div className="rounded-xl border bg-muted/20 p-4">
          <p className="text-sm font-medium">Mensagem pronta</p>
          <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {message}
          </pre>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button asChild className="w-full sm:w-auto">
            <a href={mailtoHref}>
              <Mail className="size-4" />
              Enviar por email
            </a>
          </Button>
          <Button asChild className="w-full sm:w-auto" variant="outline">
            <a href={whatsappHref} rel="noreferrer" target="_blank">
              <MessageCircleMore className="size-4" />
              Falar no WhatsApp
            </a>
          </Button>
          <Button className="w-full sm:w-auto" onClick={handleCopy} variant="secondary">
            {copied ? <Check className="size-4" /> : <LifeBuoy className="size-4" />}
            {copied ? "Mensagem copiada" : "Copiar mensagem"}
          </Button>
        </div>

        <div className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Canais atuais</p>
          <p className="mt-1">Email: {SUPPORT_EMAIL}</p>
          <p>WhatsApp/API: +{SUPPORT_PHONE}</p>
        </div>

        <div className="flex justify-center">
          <Button asChild variant="ghost">
            <Link href="/login">Voltar ao login</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
