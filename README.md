# Atlas 1.0

Atlas é um SaaS de auditoria, conformidade e gestão de planos de ação para consultorias, empresas auditadas e times internos de qualidade. O MVP organiza empresas, auditorias, modelos de checklist, execução de checklist, não conformidades, planos de ação, notificações e configurações administrativas em um fluxo único.

O projeto foi desenvolvido com dados reais em banco, controle de permissões por organização e uma arquitetura modular por domínio.

## Visão Geral

O Atlas 1.0 cobre o ciclo principal de conformidade:

1. Cadastrar uma empresa.
2. Criar uma auditoria vinculada à empresa.
3. Aplicar um modelo de checklist reutilizável.
4. Responder os itens da auditoria sem alterar o template original.
5. Registrar não conformidades.
6. Criar planos de ação corretivos.
7. Acompanhar status, histórico e notificações.
8. Administrar organização e usuários.

## Screenshots

### Dashboard

![Dashboard](public/screenshots/dashboard.png)

### Empresas

![Empresas](public/screenshots/companies.png)

### Auditorias

![Auditorias](public/screenshots/audits.png)

### Modelos de Checklist

![Modelos de Checklist](public/screenshots/checklist-template.png)

### Não Conformidades

![Não Conformidades](public/screenshots/non-conformities.png)

### Planos de Ação

![Planos de Ação](public/screenshots/action-plans.png)

### Notificações

![Notificações](public/screenshots/notifications.png)

### Configurações

![Configurações](public/screenshots/settings.png)

## Funcionalidades Implementadas

### Autenticação e Permissões

- Login com credenciais.
- Sessão JWT via NextAuth.
- Controle por organização.
- Perfis:
  - `ADMIN`
  - `CONSULTANT`
  - `CLIENT`
- Proteção de rotas por perfil.
- Bloqueio de acesso quando o usuário não possui vínculo ativo com a organização.

### Dashboard

- Tela inicial administrativa.
- Indicadores gerais do sistema.
- Base preparada para evolução de métricas operacionais.

### Empresas

- Listagem de empresas da organização.
- Cadastro com feedback de sucesso e erro.
- Edição de empresa.
- Exclusão permitida apenas para `ADMIN`.
- Bloqueio de exclusão quando a empresa possui auditorias vinculadas.
- Prevenção de duplicidade por CNPJ dentro da mesma organização.
- Prevenção de duplicidade por nome quando a empresa não possui CNPJ.
- Campos enriquecidos:
  - nome fantasia
  - razão social
  - tipo de documento
  - tipo jurídico
  - segmento
  - responsável
  - email
  - telefone
  - CEP
  - cidade
  - estado
  - observações
  - campos extras flexíveis
- Busca de endereço por CEP via ViaCEP.
- Máscaras e validações para CNPJ, telefone e CEP.

### Auditorias

- Listagem de auditorias da organização.
- Criação de auditoria vinculada a empresa real.
- Detalhes da auditoria.
- Status e datas.
- Responsável/criador.
- Área para aplicação de modelos de checklist.
- Placeholder para evolução de checklists e não conformidades.

### Modelos de Checklist

- Gestão de modelos reutilizáveis.
- Criação, edição, visualização e exclusão.
- Itens por modelo.
- Tipos de item:
  - `SIM_NAO`
  - `TEXTO`
  - `NUMERO`
  - `DATA`
  - `MULTIPLA_ESCOLHA`
- Opções em JSON para múltipla escolha.
- Texto de UI deixando claro que são templates aplicados dentro das auditorias.

### Execução de Checklist

- Aplicação de um modelo dentro da auditoria.
- Criação de snapshot dos itens do template.
- Preservação histórica: editar o template não altera auditorias já iniciadas.
- Respostas por tipo.
- Persistência de respostas.
- Registro de quem atualizou a resposta.

### Não Conformidades

- Criação manual de não conformidades dentro da auditoria.
- Associação opcional a item do checklist aplicado.
- Listagem geral.
- Página de detalhes.
- Edição por `ADMIN` e `CONSULTANT`.
- Exclusão apenas por `ADMIN`.
- Bloqueio de exclusão quando há planos de ação vinculados.
- Criticidade:
  - baixa
  - média
  - alta
  - crítica
- Status:
  - aberta
  - em andamento
  - resolvida

### Planos de Ação

- Criação de planos vinculados a não conformidades.
- Listagem geral.
- Página de detalhes.
- Edição por `ADMIN` e `CONSULTANT`.
- Exclusão apenas por `ADMIN`, com bloqueio quando há histórico de movimentação.
- Fluxo de status:
  - aberto
  - em andamento
  - aguardando revisão
  - aprovado
  - reprovado
- `CLIENT` pode executar e enviar para revisão.
- `CONSULTANT` e `ADMIN` podem aprovar ou reprovar.
- Histórico simples de movimentação.

### Notificações

- Serviço centralizado de notificações.
- Página de notificações.
- Contador no header.
- Dropdown com últimas notificações.
- Marcar como lida.
- Marcar todas como lidas.
- Eventos automáticos:
  - criação de não conformidade
  - criação de plano de ação
  - envio de plano para revisão
  - aprovação de plano
  - reprovação de plano

### Configurações

- Central administrativa da organização.
- Aba Organização:
  - nome
  - descrição
  - logo por URL
  - telefone
  - email
  - endereço
- Aba Usuários:
  - listagem por `OrganizationMembership`
  - edição de nome, email, função e senha manual pelo `ADMIN`
  - remoção de acesso sem excluir usuário físico
  - bloqueio para remover o próprio acesso
  - bloqueio para remover o último administrador
- Aba Notificações:
  - placeholder para configurações futuras.
- Aba Sistema:
  - métricas reais e clicáveis.
- Aba Suporte:
  - placeholder administrativo para contato/suporte.

## Stack Técnica

- Next.js 16
- React 19
- TypeScript
- Prisma 7
- PostgreSQL
- NextAuth
- Zod
- React Hook Form
- Tailwind CSS
- shadcn/ui
- lucide-react
- bcryptjs

## Estrutura Principal

```txt
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/
├── components/
│   ├── auth/
│   ├── dashboard/
│   ├── layout/
│   └── ui/
├── features/
│   ├── action-plans/
│   ├── audit-checklists/
│   ├── audits/
│   ├── checklists/
│   ├── companies/
│   ├── dashboard/
│   ├── non-conformities/
│   ├── notifications/
│   └── settings/
├── lib/
└── types/
```

## Como Rodar Localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as variáveis necessárias:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="sua-chave-local"
NEXTAUTH_URL="http://localhost:3000"
```

> Não versionar credenciais reais.

### 3. Rodar Prisma

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Popular dados iniciais

```bash
npm run db:seed
```

### 5. Rodar o projeto

```bash
npm run dev
```

Acesse:

```txt
http://localhost:3000
```

## Perfis de Demonstração

Após executar o seed:

```txt
ADMIN
admin@atlas.local
Admin@123

CONSULTANT
consultor@atlas.local
Consultor@123

CLIENT
cliente@atlas.local
Cliente@123
```

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run db:seed
npm run lint
```

## Validação Atual

O MVP foi testado com:

- login dos três perfis
- fluxo completo de empresas
- criação e aplicação de modelos de checklist
- execução de checklist com respostas persistidas
- criação e edição de não conformidades
- criação, revisão, aprovação e reprovação de planos de ação
- notificações
- permissões administrativas
- configurações da organização

Build e typecheck foram executados com sucesso na estabilização da versão 1.0.

## Roadmap

Próximas atualizações planejadas:

### Uploads e Anexos

- Upload real de logo.
- Upload de evidências em auditorias.
- Anexos em não conformidades.
- Documentos de apoio em planos de ação.

### Recuperação de Senha

- Fluxo real de “Esqueci minha senha”.
- Envio de email transacional.
- Token seguro de redefinição.

### Convites de Usuário

- Convite por email.
- Aceite de convite.
- Controle de status de convite.

### Automação de Não Conformidades

- Criação automática de NC a partir de respostas críticas do checklist.
- Regras configuráveis por tipo de item.
- Sugestão de severidade.

### Relatórios

- Relatório de auditoria em PDF.
- Exportação de não conformidades.
- Exportação de planos de ação.
- Indicadores por empresa, período e criticidade.

### Notificações Avançadas

- Configurações por usuário.
- Notificações por email.
- Alertas por prazo.
- Digest semanal.

### Plano de Ação Avançado

- Comentários.
- Evidências por etapa.
- Aprovação com observações.
- Reabertura de plano aprovado.

### Multiempresa e Portal Cliente

- Experiência dedicada para cliente.
- Visão filtrada por empresa.
- Acompanhamento simplificado de pendências.

## Status

```txt
Atlas 1.0: MVP funcional estabilizado.
```

