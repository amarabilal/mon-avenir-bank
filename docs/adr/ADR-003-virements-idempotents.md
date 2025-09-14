# ADR-003 — Virements internes idempotents

- **Statut** : Accepté
- **Date** : 2025-09-14
- **Contexte**  
  Les virements sont **internes à la banque**. On doit garantir l’**atomicité** (tout ou rien) et l’**idempotence** (pas d’effet doublé lors de retries). Le client peut réessayer en cas de réseau.

## Décision

1. **Idempotency-Key obligatoire** : chaque appel `POST /transfers` doit porter un `Idempotency-Key: <uuid-v4>`.
2. **Clé portée par la table des transferts** avec **contrainte unique** :
   - **Scope** = `(from_account_id, idempotency_key)` — un retry du même client réutilise la clé.
3. **Transaction SQL** : on crée **DEBIT** puis **CREDIT** dans `operations` + on persiste un `internal_transfers` **dans la même transaction**.
4. **Isolation** : `SERIALIZABLE` (ou `REPEATABLE READ` + verrous explicites) + `SELECT ... FOR UPDATE` sur les 2 comptes (ordre stable par `uuid` pour éviter les deadlocks).
5. **Réponse idempotente** : si une ligne existe déjà avec la même clé → on renvoie **le même body** (201) sans dupliquer les écritures.

## Modèle (SQL indicatif)

```sql
create table internal_transfers (
  id uuid primary key,
  idempotency_key uuid not null,
  from_account_id uuid not null references accounts(id),
  to_account_id   uuid not null references accounts(id),
  amount_cents    bigint not null check (amount_cents > 0),
  currency        char(3) not null default 'EUR',
  status          text not null default 'SUCCEEDED',
  created_at      timestamptz not null default now(),
  unique (from_account_id, idempotency_key)
);
```

## Algorithme (pseudocode)

```ts
function internalTransfer(cmd){
  // Validations préalables
  assert cmd.amount_cents > 0
  assert cmd.from !== cmd.to
  assert accounts.currency === 'EUR'
  // Début transaction
  begin
    // idempotence
    if exists transfer where from=cmd.from and key=cmd.key:
      return 201, transfer_cached_response

    // Verrouiller comptes dans un ordre stable
    const [a, b] = sortById([cmd.from, cmd.to])
    select * from accounts where id in (a,b) for update

    // Solde suffisant
    if closing_balance(cmd.from) < cmd.amount_cents:
      rollback; return 422 'insufficient_funds'

    // Ledger
    insert operations(DEBIT, from, amount)
    insert operations(CREDIT, to, amount)

    // Dénormalisation (facultatif)
    update accounts set balance_cents = balance_cents - amount where id=from
    update accounts set balance_cents = balance_cents + amount where id=to

    // Trace idempotence
    insert internal_transfers(id, key, from, to, amount)

  commit
  return 201 { transferId, from, to, amount }
}
```

## Contrat d’API (exemple)

`POST /transfers`

```json
{
  "fromAccountId": "uuid",
  "toAccountId": "uuid",
  "amount": 12500
}
```

Headers : `Idempotency-Key: 9f7f3d5a-...`
Réponses :

- **201** `{id, fromAccountId, toAccountId, amount}` (créé ou **rejoué**)
- **422** `{"error":"insufficient_funds"}`
- **400** `{"error":"invalid_request"}`
- **409** si conflit de verrou / réessayer

## Sécurité & erreurs

- Rejeter toute **idempotency-key vide** / non UUID.
- **Window** : on garde les clés 24h (paramétrable).
- **Timeout** : si la transaction n’aboutit pas, on n’écrit **rien** (atomique).

## Observabilité

- Logger `transfer_id`, `idempotency_key`, `from`, `to`, `amount_cents`, `duration_ms`.
- Métriques : taux d’échec, conflits, retries, latence p95/p99.

## Tests

- Deux POST identiques avec même `Idempotency-Key` ⇒ **1 seul** DEBIT/CREDIT.
- POST sans clé ⇒ **400**.
- Solde insuffisant ⇒ **422** (aucune écriture).
- Concurrence : 2 transferts simultanés du même compte ⇒ l’un échoue proprement (verrouillage).

## Alternatives (rejetées)

- Idempotence par hash du corps sans clé explicite → fragile si horodatage/ordre change.
- Verrouillage applicatif uniquement → préférer des verrous DB pour la cohérence.

## Impacts

- Une table `internal_transfers` + index.
- Charges de concurrence maîtrisées ; retry client **sûr**.
