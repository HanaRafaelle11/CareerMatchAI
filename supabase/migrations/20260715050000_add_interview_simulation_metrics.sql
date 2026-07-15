-- 20260715050000_add_interview_simulation_metrics.sql

alter table public.interview_simulations 
  add column if not exists tokens_used integer default 0,
  add column if not exists estimated_cost numeric(10,6) default 0.000000,
  add column if not exists duration_seconds integer default 0;
