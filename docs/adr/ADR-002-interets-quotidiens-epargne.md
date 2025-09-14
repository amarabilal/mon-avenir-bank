# ADR-002 — Rémunération quotidienne des comptes épargne

- **Statut** : Accepté
- **Date** : 2025-09-14
- **Contexte**  
  Le sujet impose une **rémunération quotidienne** au **taux en vigueur** fixé par l’administrateur, avec **notification** lors d’un changement. On doit spécifier le calcul, l’arrondi et l’instant d’application.

## Décision

1. **Base de calcul** : ACT/365 simple (pas bissextile-spécifique en V1).  
   Taux journalier = `taux_annuel / 365`.
2. **Instant** : les intérêts du jour **J** sont calculés à **J+1 00:05 Europe/Paris** sur le **solde de clôture de J** (après toutes écritures de J).
3. **Arrondi** : calcul en **centimes** avec arrondi **au centime supérieur si ≥ 0.5** (half up).
4. **Idempotence du job** : une seule application par (account_id, date).
5. **Changement de taux** : `SavingsRate(value, effectiveFrom)` — le taux **en vigueur** pour le jour J est le dernier taux dont `effectiveFrom ≤ J 00:00:00`. Une **notification** est envoyée à chaque détenteur lors de l’update.

## Schéma & tables

```sql
create table savings_rates (
  id uuid primary key,
  value_bps integer not null,  -- base points: 1% = 100 bps
  effective_from date not null -- prise d'effet 00:00 Europe/Paris
);

create table daily_interest (
  id uuid primary key,
  account_id uuid not null references accounts(id),
  day date not null, -- jour rémunéré
  rate_bps integer not null,
  interest_cents bigint not null check (interest_cents >= 0),
  created_at timestamptz not null default now(),
  unique (account_id, day)
);
```

## Formules

- `taux_journalier (d)` = `rate_bps(d) / 100 / 365`
- `interet_cents (d)` = `round_half_up( balance_cents_J * rate_bps / (365*100) )`

> On évite les flottants : on manipule des entiers (centimes, bps).

## Algorithme (pseudocode)

```ts
for each savingsAccount as a:
  const d = today - 1 (Europe/Paris)
  if daily_interest.exists(a.id, d) return // idempotent
  const rate = getRateAt(d) // last rate with effectiveFrom <= d
  const balance = getClosingBalanceCents(a.id, d)
  const interest = roundHalfUp(balance * rate.bps / (365*100))
  if (interest > 0) {
    // écriture CREDIT sur le ledger épargne
    createOperation(a.id, 'CREDIT', interest, { kind: 'DAILY_INTEREST', day: d })
  }
  insert daily_interest(a.id, d, rate.bps, interest)
```

## Changement de taux & notification

- Route admin : `POST /admin/savings-rate { valuePercent }`
- Écrit `savings_rates(effective_from = today)` et **publie** `Notification{ userId, type:'SAVINGS_RATE_CHANGED', payload:{value} }`.
- **Effet** sur calcul : **dès le lendemain** (J+1).

## Exemples

- Solde 10 000€ (1 000 000 cents), taux 3.00% (300 bps)
  `interest = round(1_000_000 * 300 / 36_500) = round(8.219…) = 8 cents` par jour.
- Taux modifié à 3.20% le 10/10 → rémunération à **3.20% dès le 11/10**.

## Cas limites

- Solde négatif (non autorisé en épargne) → aucun intérêt.
- Compte fermé le jour J → pas de rémunération pour J+1.
- Changement de taux multiple le même jour → on conserve le **dernier** `effectiveFrom ≤ J`.

## Tests attendus

- Taux constant sur une semaine : somme(J) conforme.
- Taux changeant : bascule au bon jour.
- Idempotence : 2 exécutions du job pour (account, J) ne doublent pas l’intérêt.

## Alternatives (rejetées)

- ACT/360 → plus agressif, non justifié ici.
- Intérêts intrajournaliers → surcomplexifie les règles.

## Impacts

- Job planifié (cron 00:05 Europe/Paris).
- Nécessite un **Notifier adapter** (mock en S3, provider plus tard).
