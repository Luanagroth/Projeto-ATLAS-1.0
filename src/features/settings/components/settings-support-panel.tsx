"use client";

import { Check, LifeBuoy, Mail, MessageCircleMore, Phone } from "lucide-react";
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

export function SettingsSupportPanel() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [channelNumber, setChannelNumber] = useState(SUPPORT_PHONE);
  const [copied, setCopied] = useState(false);

  const composedMessage = useMemo(() => {
    return [
      "Olá, equipe Atlas!",
      subject ? `Assunto: ${subject}` : null,
      message ? `Mensagem: ${message}` : null,
      "",
      "Preciso de ajuda com as configurações do sistema.",
    ]
      .filter(Boolean)
      .join("\n");
  }, [message, subject]);

  const mailtoHref = `mailto:${encodeURIComponent(SUPPORT_EMAIL)}?subject=${encodeURIComponent(
    subject || "Suporte Atlas",
  )}&body=${encodeURIComponent(composedMessage)}`;

  const resolvedPhone = digitsOnly(channelNumber) || SUPPORT_PHONE;
  const whatsappHref = `https://wa.me/${resolvedPhone}?text=${encodeURIComponent(
    composedMessage,
  )}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(composedMessage);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <LifeBuoy className="size-5 text-muted-foreground" />
        <h2 className="text-base font-semibold">Suporte</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Use este espaço para abrir contato com a equipe responsável quando precisar de ajuste,
        orientação ou revisão de comportamento no sistema.
      </p>

      <div className="mt-5 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="supportSubject">Assunto</Label>
            <Input
              id="supportSubject"
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Ex.: dúvida no fluxo da auditoria"
              value={subject}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportChannelNumber">Número WhatsApp/API</Label>
            <Input
              id="supportChannelNumber"
              onChange={(event) => setChannelNumber(event.target.value)}
              placeholder="+55 (11) 99999-9999"
              value={channelNumber}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="supportMessage">Mensagem</Label>
            <Textarea
              id="supportMessage"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Explique o problema ou melhoria desejada"
              value={message}
            />
          </div>
        </div>

        <div className="rounded-md border bg-muted/20 p-4">
          <p className="text-sm font-medium">Prévia do pedido</p>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-sm text-muted-foreground">
            {composedMessage}
          </pre>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Button asChild className="justify-start gap-2" variant="outline">
            <a href={mailtoHref}>
              <Mail className="size-4" />
              Enviar por email
            </a>
          </Button>
          <Button asChild className="justify-start gap-2" variant="outline">
            <a href={whatsappHref} rel="noreferrer" target="_blank">
              <MessageCircleMore className="size-4" />
              Abrir WhatsApp/API
            </a>
          </Button>
          <Button className="justify-start gap-2" onClick={handleCopy} variant="secondary">
            {copied ? <Check className="size-4" /> : <Phone className="size-4" />}
            {copied ? "Copiado" : "Copiar mensagem"}
          </Button>
        </div>

        <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Canais configurados</p>
          <p className="mt-1">Email: {SUPPORT_EMAIL}</p>
          <p>WhatsApp/API atual: +{resolvedPhone}</p>
          <p className="mt-2 text-xs">
            Se ainda não houver número definitivo, o painel continua operando com um destino de
            teste que pode ser trocado depois.
          </p>
        </div>
      </div>
    </section>
  );
}
