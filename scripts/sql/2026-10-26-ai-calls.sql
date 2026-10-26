-- AI potrošnja: jedan redak po zahtjevu prema AI modelu (samo metapodaci, nikad tekst).
-- Aditivno i bezopasno za ponovno pokretanje (ADR-026): ne dira postojeće tablice. Primjenjuje Leon ručno
-- (Neon SQL editor ili psql), ne preko db:push. Bez ove tablice igra radi isto; ispis "[ai-usage]" u logu Vercela
-- bilježi pozive i prije toga.
-- world_id i company_id namjerno nisu strani ključevi: brisanje igre ne smije brisati povijest troška.

BEGIN;

CREATE TABLE IF NOT EXISTS ai_calls (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  job                 text NOT NULL,            -- character | judge | mentor
  action              text NOT NULL,            -- lik, sudac, mentor-pitanje, mentor-razgovor, mentor-osvrt, agencija, prijedlog
  provider            text NOT NULL,            -- anthropic | groq | mistral
  model               text NOT NULL,
  input_tokens        integer,                  -- ukupno ulaz; cache čitanje i pisanje su dijelovi toga
  cached_input_tokens integer,
  cache_write_tokens  integer,
  output_tokens       integer,
  cost_usd            numeric(14, 8),           -- stvarni trošak (0 na Groq besplatnom planu)
  list_cost_usd       numeric(14, 8),           -- isti poziv po cjeniku
  duration_ms         integer NOT NULL,
  ok                  boolean NOT NULL,
  error               text,                     -- HTTP status ili klasa greške, nikad poruka
  fallback_used       boolean NOT NULL DEFAULT false,
  world_id            uuid,
  company_id          uuid
);

CREATE INDEX IF NOT EXISTS ai_calls_created_at_idx ON ai_calls (created_at);
CREATE INDEX IF NOT EXISTS ai_calls_world_id_idx ON ai_calls (world_id);

COMMIT;
