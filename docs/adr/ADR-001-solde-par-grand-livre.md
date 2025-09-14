# ADR-001 — Stratégie de solde par grand livre (ledger)

- **Statut** : Accepté
- **Date** : 2025-09-14
- **Contexte**  
  Le sujet impose : _« Solde = Σ crédits − Σ débits »_ et des virements atomiques. On veut une base **auditable**, **simple à tester**, et **indépendante** des frameworks.  
  Le domaine contient `Account`, `Operation(kind=DEBIT|CREDIT)`, `Money`, et des Use Cases (ex. `InternalTransfer`).

## Décision

1. **Solde dérivé du grand livre** : l’état source de vérité est la table `operations` (écritures immuables).  
   Le solde d’un compte = somme des **CREDIT** − somme des **DEBIT**.
2. **Opérations immuables** : aucune mise à jour/suppression ; seules des écritures compensatoires (storno) sont autorisées.
3. **Dénormalisation facultative** : un champ `accounts.balance_cents` peut être maintenu **en cache** (vu performance), mais le **ledger reste l’autorité**.
4. **Monnaie** : stockage en **centimes (entiers)**, `EUR` comme devise unique.

## Modèle (SQL indicatif)

```sql
create table accounts (
  id                  uuid primary key,
  owner_id            uuid not null,
  iban                text unique not null,
  type                text not null check (type in ('CURRENT','SAVINGS')),
  name                text not null,
  status              text not null default 'ACTIVE',
  balance_cents       bigint not null default 0, -- dénormalisation facultative
  currency            char(3) not null default 'EUR',
  created_at          timestamptz not null default now()
);

create table operations (
  id                  uuid primary key,
  account_id          uuid not null references accounts(id),
  kind                text not null check (kind in ('DEBIT','CREDIT')),
  amount_cents        bigint not null check (amount_cents > 0),
  currency            char(3) not null default 'EUR',
  meta                jsonb not null default '{}'::jsonb, -- transfer_id, order_id, etc.
  created_at          timestamptz not null default now()
);

create index idx_ops_account_created_at on operations(account_id, created_at);
```

## Calcul du solde

- **Autoritaire** (requête) :

  ```sql
  select coalesce(sum(case when kind='CREDIT' then amount_cents else -amount_cents end),0) as balance_cents
  from operations where account_id = $1;
  ```

- **Dénormalisé** (maintenu en transaction) : à chaque écriture, on ajuste `accounts.balance_cents`.
  En cas d’écart (rare), on recalcule depuis `operations`.

## Invariants & règles

- Montants strictement **positifs** ; aucune opération 0 ou négative.
- Mono-devise (EUR) ; conversions interdites dans V1.
- Aucune écriture sans lien métier (`meta` doit tracer l’origine : transfer_id, interest_id, …).
- **Cohérence** : pour un virement interne, on crée 2 écritures dans une **même transaction** :
  - DEBIT du compte source,
  - CREDIT du compte cible.

## Exemple (virement 12€)

- `op1` : DEBIT 1200 (compte A)
- `op2` : CREDIT 1200 (compte B)

## Cas limites

- **Compte bloqué** ⇒ refus d’écriture.
- **Découvert** : non autorisé (v1) ⇒ refuser si `solde < montant`.
- **Même compte source=dest** ⇒ refuser (sans effet).

## Tests (exemples)

- Création 3 crédits et 2 débits ⇒ solde attendu = ΣC − ΣD.
- Virement : après transaction, somme des soldes globaux **inchangée**.
- Refus si solde insuffisant (aucune écriture créée).

## Alternatives étudiées (rejetées)

- Stocker uniquement un champ `balance` mutable (perte d’audit) → ❌
- Double-entrée stricte (comptabilité générale) → surdimensionné pour V1.

## Impacts

- Requêtes solde faciles ; batch de réconciliation possible (script).
- Migration ultérieure vers Event Sourcing facilitée (ledger déjà en place).
