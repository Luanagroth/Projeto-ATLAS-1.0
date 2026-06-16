"use client";

import { Copy, Mail, MessageCircleMore } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SettingsInvitePanelProps = {
  organizationName?: string;
};

const DEFAULT_INVITE_EMAIL = "convites@atlas.local";
const DEFAULT_WHATSAPP_PHONE = "5511999999999";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function SettingsInvitePanel({
  organizationName = "sua empresa",
}: SettingsInvitePanelProps) {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const message = useMemo(() => {
    const lines = [
      `Olá${contactName ? `, ${contactName}` : ""}!`,
      `Estou te enviando um convite de acesso à área do cliente da ${companyName || organizationName}.`,
      "Por lá você poderá acompanhar a auditoria, responder plano de ação, anexar evidências e consultar documentos.",
      notes ? `Observação: ${notes}` : null,
      "Se precisar, me responda por aqui que eu finalizo seu acesso.",
    ].filter(Boolean);

    return lines.join("\n\n");
  }, [companyName, contactName, notes, organizationName]);

  const mailSubject = `Convite de acesso - ${companyName || organizationName}`;
  const resolvedEmail = email.trim() || DEFAULT_INVITE_EMAIL;
  const mailHref = `mailto:${encodeURIComponent(resolvedEmail)}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(message)}`;

  const resolvedPhone = digitsOnly(phone) || DEFAULT_WHATSAPP_PHONE;
  const whatsappHref = `https://wa.me/${resolvedPhone}?text=${encodeURIComponent(message)}`;

  async function copyMessage() {
    await navigator.clipboard.writeText(message);
  }

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Convite de acesso da empresa</h2>
          <p className="text-sm text-muted-foreground">
            Gere uma mensagem pronta para enviar por e-mail ou WhatsApp.
          </p>
        </div>
        <span className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
          Fluxo compartilhável
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="inviteCompany">Empresa</Label>
            <Input
              id="inviteCompany"
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Nome da empresa"
              value={companyName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inviteContact">Contato</Label>
            <Input
              id="inviteContact"
              onChange={(event) => setContactName(event.target.value)}
              placeholder="Nome do responsável"
              value={contactName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inviteEmail">Email</Label>
            <Input
              id="inviteEmail"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="contato@empresa.com"
              type="email"
              value={email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invitePhone">WhatsApp</Label>
            <Input
              id="invitePhone"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(00) 00000-0000"
              value={phone}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="inviteNotes">Mensagem extra</Label>
            <Textarea
              id="inviteNotes"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Opcional: inclua instruções específicas"
              value={notes}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-md border bg-background p-4">
            <p className="text-sm font-medium">Prévia do convite</p>
            <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {message}
            </pre>
          </div>

          <div className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
            <p>
              Email de destino: <span className="font-medium text-foreground">{resolvedEmail}</span>
            </p>
            <p className="mt-1">
              WhatsApp/API: <span className="font-medium text-foreground">+{resolvedPhone}</span>
            </p>
            {!email.trim() ? (
              <p className="mt-2 text-xs">
                Sem e-mail informado, o sistema usa um endereço fictício de teste para montar o
                convite.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button asChild className="w-full sm:w-auto" size="sm">
              <a href={mailHref}>
                <Mail className="size-4" />
                Abrir email
              </a>
            </Button>
            <Button asChild className="w-full sm:w-auto" size="sm" variant="outline">
              <a href={whatsappHref} rel="noreferrer" target="_blank">
                <MessageCircleMore className="size-4" />
                Abrir WhatsApp
              </a>
            </Button>
            <Button className="w-full sm:w-auto" onClick={copyMessage} size="sm" variant="ghost">
              <Copy className="size-4" />
              Copiar texto
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
