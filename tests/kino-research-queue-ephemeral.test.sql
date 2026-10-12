-- BUILD 04: end-to-end SQL tests on disposable PostgreSQL 16 only.
-- Run after `kino-research-queue-ephemeral-setup.sql` and the existing migration.
\set ON_ERROR_STOP on

DO $$
DECLARE n INTEGER;
BEGIN
  SELECT count(*) INTO n FROM pg_tables
  WHERE schemaname='public' AND tablename IN ('sonoraport_swarm_research_jobs','sonoraport_swarm_research_receipts');
  IF n<>2 THEN RAISE EXCEPTION 'QUEUE_TABLES_MISSING'; END IF;
  SELECT count(*) INTO n FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace
  WHERE ns.nspname='public' AND c.relname IN ('sonoraport_swarm_research_jobs','sonoraport_swarm_research_receipts') AND c.relrowsecurity;
  IF n<>2 THEN RAISE EXCEPTION 'RLS_NOT_ENABLED'; END IF;
  IF has_table_privilege('anon','public.sonoraport_swarm_research_jobs','SELECT')
     OR has_table_privilege('authenticated','public.sonoraport_swarm_research_jobs','INSERT')
     OR has_table_privilege('anon','public.sonoraport_swarm_research_receipts','SELECT')
     OR has_table_privilege('authenticated','public.sonoraport_swarm_research_receipts','INSERT')
  THEN RAISE EXCEPTION 'UNTRUSTED_ROLE_HAS_QUEUE_ACCESS'; END IF;
  IF has_function_privilege('anon','public.sonoraport_claim_research_job(text,integer)','EXECUTE')
     OR has_function_privilege('authenticated','public.sonoraport_finish_research_job(uuid,uuid,text,jsonb,text)','EXECUTE')
  THEN RAISE EXCEPTION 'UNTRUSTED_ROLE_HAS_QUEUE_RPC'; END IF;
  IF NOT has_function_privilege('service_role','public.sonoraport_claim_research_job(text,integer)','EXECUTE')
     OR NOT has_function_privilege('service_role','public.sonoraport_finish_research_job(uuid,uuid,text,jsonb,text)','EXECUTE')
  THEN RAISE EXCEPTION 'SERVICE_ROLE_MISSING_RPC'; END IF;
END $$;

SET ROLE service_role;
INSERT INTO public.sonoraport_swarm_research_jobs(task_key,lane,provider,intent,source_urls)
VALUES ('build04-ci-China','CHINA','CIPS','PUBLIC_RESEARCH','["https://www.cips.com.cn/public-one","https://www.cips.com.cn/public-two"]'::jsonb),
       ('build04-ci-Mexico','MEXICO','SPEI','PUBLIC_RESEARCH','["https://www.banxico.org.mx/public-one","https://www.banxico.org.mx/public-two"]'::jsonb);

DO $$
DECLARE a JSONB; b JSONB; c JSONB; n INTEGER;
BEGIN
  a:=public.sonoraport_claim_research_job('kino-worker-01',120);
  b:=public.sonoraport_claim_research_job('kino-worker-02',120);
  IF a IS NULL OR b IS NULL OR a->>'task_key'=b->>'task_key' THEN RAISE EXCEPTION 'JOB_CLAIMS_NOT_DISTINCT'; END IF;
  IF public.sonoraport_claim_research_job('kino-worker-03',120) IS NOT NULL THEN RAISE EXCEPTION 'DOUBLE_LEASE_CLAIM'; END IF;
  IF public.sonoraport_finish_research_job((a->>'id')::uuid,gen_random_uuid(),'RESEARCH_PIPELINE_PASSED','{}'::jsonb,NULL)
  THEN RAISE EXCEPTION 'INVALID_LEASE_TOKEN_ACCEPTED'; END IF;
  INSERT INTO public.sonoraport_swarm_research_receipts(job_id,agent_id,stage,status,evidence_digest)
  VALUES ((a->>'id')::uuid,'#281110','DISCOVERY','COMPLETED',repeat('a',64));
  IF NOT public.sonoraport_finish_research_job((a->>'id')::uuid,(a->>'lease_token')::uuid,'RESEARCH_PIPELINE_PASSED',
   '{"financialOperation":false,"productionConnected":false,"stagesCompleted":6}'::jsonb,NULL)
  THEN RAISE EXCEPTION 'VALID_LEASE_COULD_NOT_COMPLETE'; END IF;
  IF public.sonoraport_finish_research_job((a->>'id')::uuid,(a->>'lease_token')::uuid,'RESEARCH_PIPELINE_PASSED','{}'::jsonb,NULL)
  THEN RAISE EXCEPTION 'DOUBLE_FINALIZATION_ACCEPTED'; END IF;
  IF NOT public.sonoraport_finish_research_job((b->>'id')::uuid,(b->>'lease_token')::uuid,'BLOCKED','{}'::jsonb,'DOCUMENT_FETCH_FAILED')
  THEN RAISE EXCEPTION 'BLOCKED_JOB_NOT_FINALIZED'; END IF;
  SELECT count(*) INTO n FROM public.sonoraport_swarm_research_receipts WHERE job_id=(a->>'id')::uuid;
  IF n<>1 THEN RAISE EXCEPTION 'RECEIPT_NOT_PERSISTED'; END IF;
END $$;

DO $$
BEGIN
  BEGIN
    INSERT INTO public.sonoraport_swarm_research_jobs(task_key,lane,provider,intent,source_urls)
    VALUES ('build04-ci-invalid-intent','CHINA','CIPS','FINANCIAL_TRANSFER','["https://example.org"]'::jsonb);
    RAISE EXCEPTION 'INVALID_INTENT_WAS_ACCEPTED';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    INSERT INTO public.sonoraport_swarm_research_jobs(task_key,lane,provider,intent,source_urls)
    VALUES ('build04-ci-invalid-sources','CHINA','CIPS','PUBLIC_RESEARCH','[]'::jsonb);
    RAISE EXCEPTION 'EMPTY_SOURCES_WERE_ACCEPTED';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    INSERT INTO public.sonoraport_swarm_research_receipts(job_id,agent_id,stage,status,evidence_digest)
    SELECT id,'#281110','DISCOVERY','COMPLETED','not-a-sha256'
    FROM public.sonoraport_swarm_research_jobs WHERE task_key='build04-ci-China';
    RAISE EXCEPTION 'INVALID_DIGEST_WAS_ACCEPTED';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
RESET ROLE;

INSERT INTO public.sonoraport_swarm_research_jobs(task_key,lane,provider,intent,source_urls,max_attempts)
VALUES ('build04-ci-retry','BRAZIL','PIX','PUBLIC_RESEARCH','["https://www.bcb.gov.br/one"]'::jsonb,2);
SET ROLE service_role;
DO $$
DECLARE a JSONB;
BEGIN
  a:=public.sonoraport_claim_research_job('kino-expiration',120);
  IF a IS NULL OR a->>'task_key'<>'build04-ci-retry' THEN RAISE EXCEPTION 'RETRY_JOB_NOT_CLAIMED'; END IF;
END $$;
RESET ROLE;
UPDATE public.sonoraport_swarm_research_jobs SET lease_expires_at=now()-interval '1 second' WHERE task_key='build04-ci-retry';
SET ROLE service_role;
DO $$
DECLARE a JSONB;
BEGIN
  a:=public.sonoraport_claim_research_job('kino-expiration-retry',120);
  IF a IS NULL OR a->>'task_key'<>'build04-ci-retry' THEN RAISE EXCEPTION 'EXPIRED_LEASE_NOT_RECLAIMED'; END IF;
END $$;
RESET ROLE;
UPDATE public.sonoraport_swarm_research_jobs SET lease_expires_at=now()-interval '1 second' WHERE task_key='build04-ci-retry';
SET ROLE service_role;
DO $$
BEGIN
  IF public.sonoraport_claim_research_job('kino-expiration-no-more',120) IS NOT NULL THEN
    RAISE EXCEPTION 'RETRY_LIMIT_NOT_ENFORCED';
  END IF;
END $$;
RESET ROLE;
SELECT 'KINO_BUILD04_EPHEMERAL_DATABASE_INTEGRATION_PASSED' AS result;
