-- Migration: Single Source of Truth candidate cohorts view
-- Author: CareerMatchAI Reliability Engineering
-- Description: Centralizes activation classification (activated vs not_activated) in database level.

CREATE OR REPLACE VIEW view_candidate_cohorts AS
WITH candidate_activity AS (
  SELECT DISTINCT user_id FROM resume_versions
  UNION
  SELECT DISTINCT user_id FROM job_feedback
  UNION
  SELECT DISTINCT user_id FROM applications
  UNION
  SELECT DISTINCT user_id FROM resumes
)
SELECT 
  p.id AS user_id,
  p.email,
  p.full_name,
  CASE 
    WHEN ca.user_id IS NOT NULL THEN 'activated'
    ELSE 'not_activated'
  END AS cohort,
  p.created_at
FROM profiles p
LEFT JOIN candidate_activity ca ON ca.user_id = p.id;
