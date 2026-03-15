# Billing Schema

Este documento propõe um schema de billing para o Carrosselize usando Firestore.

Objetivos:

- manter compatibilidade com `tokensBalance`
- migrar a linguagem do produto para `credits`
- suportar assinatura mensal
- suportar compra avulsa de créditos
- permitir auditoria de saldo e consumo

## Conceitos

- `credit`: unidade de consumo do produto
- `subscription`: plano recorrente com renovação periódica
- `top-up`: compra avulsa de créditos
- `ledger`: histórico imutável de movimentações de crédito

Regra de produto sugerida:

- gerar carrossel: `1 credit`
- gerar imagem IA: `1 credit`
- editar, exportar, dashboard: `0 credits`

## Estrutura principal

### `users/{uid}`

Manter o documento do usuário como leitura rápida para UI.

Campos sugeridos:

```ts
type UserBillingSnapshot = {
  creditsBalance: number;
  tokensBalance?: number; // compat legado, espelha creditsBalance por um período
  billing?: {
    provider: "stripe";
    customerId: string | null;
    defaultCurrency: "BRL";
    country: "BR";
    taxStatus?: "individual" | "company" | null;
  };
  subscription?: {
    planId: string | null;
    status: "inactive" | "trialing" | "active" | "past_due" | "canceled";
    interval: "month" | null;
    renewsAt: FirebaseTimestamp | null;
    currentPeriodStart: FirebaseTimestamp | null;
    currentPeriodEnd: FirebaseTimestamp | null;
    cancelAtPeriodEnd: boolean;
    monthlyCredits: number;
    lastCreditGrantAt: FirebaseTimestamp | null;
  };
  usage?: {
    totalCreditsSpent: number;
    totalCarouselsGenerated: number;
    totalImagesGenerated: number;
    lastGenerationAt: FirebaseTimestamp | null;
  };
}
```

Exemplo:

```json
{
  "displayName": "Vitor Freire",
  "email": "vitorfreire419@gmail.com",
  "creditsBalance": 132,
  "tokensBalance": 132,
  "billing": {
    "provider": "stripe",
    "customerId": "cus_123",
    "defaultCurrency": "BRL",
    "country": "BR",
    "taxStatus": "individual"
  },
  "subscription": {
    "planId": "starter_monthly",
    "status": "active",
    "interval": "month",
    "renewsAt": "<timestamp>",
    "currentPeriodStart": "<timestamp>",
    "currentPeriodEnd": "<timestamp>",
    "cancelAtPeriodEnd": false,
    "monthlyCredits": 100,
    "lastCreditGrantAt": "<timestamp>"
  },
  "usage": {
    "totalCreditsSpent": 48,
    "totalCarouselsGenerated": 11,
    "totalImagesGenerated": 37,
    "lastGenerationAt": "<timestamp>"
  }
}
```

### `users/{uid}/billing_events/{eventId}`

Subcoleção imutável para auditoria e debugging. Cada evento representa uma mudança de saldo ou estado de billing.

Campos sugeridos:

```ts
type BillingEvent = {
  type:
    | "subscription_started"
    | "subscription_renewed"
    | "subscription_canceled"
    | "credits_granted"
    | "credits_spent"
    | "credits_refunded"
    | "topup_purchased"
    | "payment_failed";
  source: "app" | "stripe_webhook" | "admin";
  creditsDelta: number;
  balanceAfter: number;
  currency?: "BRL";
  amountCents?: number;
  planId?: string | null;
  packageId?: string | null;
  reason?: string | null;
  projectId?: string | null;
  slideId?: string | null;
  elementId?: string | null;
  idempotencyKey?: string | null;
  stripeEventId?: string | null;
  createdAt: FirebaseTimestamp;
  createdBy?: string | null;
}
```

Exemplos:

- assinatura renovou e adicionou `100` créditos
- geração de imagem consumiu `-1`
- compra avulsa adicionou `50`

### `billing_products/{productId}`

Catálogo público interno do app.

Campos sugeridos:

```ts
type BillingProduct = {
  kind: "subscription" | "topup";
  active: boolean;
  name: string;
  priceCents: number;
  currency: "BRL";
  credits: number;
  interval?: "month";
  stripePriceId: string;
  features?: string[];
  sortOrder: number;
}
```

Exemplos de IDs:

- `starter_monthly`
- `pro_monthly`
- `credits_50`
- `credits_150`

### `projects/{projectId}`

Não precisa virar documento de billing, mas vale guardar metadados de consumo para analytics e suporte.

Campos opcionais:

```ts
type ProjectBillingMeta = {
  generation?: {
    creditsCharged: number;
    chargedAt: FirebaseTimestamp | null;
    billingEventId: string | null;
  };
  images?: {
    totalCreditsCharged: number;
    totalImagesGenerated: number;
    lastChargedAt: FirebaseTimestamp | null;
  };
}
```

## Operações principais

### 1. Consumir crédito ao gerar carrossel

Fluxo:

1. validar autenticação
2. ler `users/{uid}.creditsBalance`
3. se saldo < custo, bloquear
4. gerar `billing_event` com `creditsDelta = -1`
5. atualizar saldo do usuário de forma transacional
6. gerar o carrossel

Observação:

- o ideal é fazer cobrança e gravação em `transaction`
- em caso de falha na geração após a cobrança, gerar `credits_refunded`

### 2. Consumir crédito ao gerar imagem

Mesmo fluxo do carrossel, mas com referência a:

- `projectId`
- `slideId`
- `elementId`

### 3. Renovar assinatura

Via webhook:

1. Stripe confirma pagamento da renovação
2. backend localiza usuário pelo `customerId`
3. adiciona `monthlyCredits`
4. atualiza `subscription.currentPeriodStart`, `currentPeriodEnd`, `renewsAt`
5. grava `subscription_renewed` + `credits_granted`

### 4. Comprar pacote avulso

Via checkout:

1. usuário compra `credits_50`
2. webhook confirma pagamento
3. backend adiciona créditos
4. grava `topup_purchased`

## Estratégia de compatibilidade

Hoje o app já usa `tokensBalance`. Para não quebrar nada:

Fase 1:

- adicionar `creditsBalance`
- manter `tokensBalance`
- espelhar os dois valores
- UI começa a mostrar `créditos`

Fase 2:

- frontend passa a ler `creditsBalance` primeiro
- `tokensBalance` vira fallback legado

Fase 3:

- parar de escrever `tokensBalance`
- manter leitura por um tempo

## Regras de consistência

- nunca confiar só no frontend para subtrair saldo
- sempre usar backend ou Cloud Function para cobrança
- todo ajuste de saldo gera `billing_event`
- usar `idempotencyKey` em webhook e geração para evitar dupla cobrança
- `creditsBalance` no usuário é snapshot rápido
- `billing_events` é a fonte auditável

## Regras de produto sugeridas

Para evitar prejuízo:

- gerar carrossel: `1 credit`
- gerar imagem em `medium`: `1 credit`
- exportar: `0`
- editar texto/posição/paleta: `0`

Mais tarde:

- imagem premium `high`: `2` ou `3 credits`
- template premium: acesso por plano, não por crédito

## O que implementar primeiro

1. adicionar `creditsBalance` ao usuário
2. criar `billing_products`
3. criar helper backend `spendCredits(uid, amount, context)`
4. cobrar em `generateCarousel`
5. cobrar em `generateImageForElement`
6. integrar Stripe checkout + webhook

