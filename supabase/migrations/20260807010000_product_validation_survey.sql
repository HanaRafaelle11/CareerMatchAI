-- ============================================================================
-- MIGRATION: PRODUCT VALIDATION SURVEY & FOUNDER USER CAMPAIGN (v1_founders_validation)
-- ============================================================================

-- 1. Create survey_responses Table
CREATE TABLE IF NOT EXISTS public.survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    research_cohort TEXT NOT NULL CHECK (research_cohort IN ('activated', 'not_activated', 'beta_general')),
    high_intent BOOLEAN DEFAULT false,
    channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('email', 'in_app')),
    invitation_source TEXT NOT NULL DEFAULT 'dashboard_modal' CHECK (invitation_source IN ('email_campaign', 'dashboard_modal', 'manual_admin')),
    survey_version TEXT NOT NULL DEFAULT 'v1_founders_validation',
    
    q1_acquisition TEXT,
    q2_goal TEXT,
    q3_previous_method TEXT,
    q4_valued_feature TEXT,
    q4_why TEXT,
    q5_had_match TEXT,
    q5_match_changed_view TEXT,
    q6_biggest_benefit TEXT,
    q7_improvements TEXT,
    q8_pro_intent TEXT,
    q9_fair_price TEXT,
    q10_subscription_driver TEXT,
    q11_nps INTEGER CHECK (q11_nps >= 0 AND q11_nps <= 10),
    q12_interview_opt_in TEXT,
    q13_pmf_missing_feature TEXT,
    q14_value_moment TEXT,
    q15_main_difficulty TEXT,
    q16_urgency TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create research_contacts Table (LGPD Compliant with UNIQUE user_id)
CREATE TABLE IF NOT EXISTS public.research_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    whatsapp_phone TEXT,
    permission_status TEXT NOT NULL DEFAULT 'granted' CHECK (permission_status IN ('granted', 'revoked', 'pending')),
    permission_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create giveaway_participants Table (7-Day PRO Giveaway)
CREATE TABLE IF NOT EXISTS public.giveaway_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    survey_response_id UUID REFERENCES public.survey_responses(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'eligible' CHECK (status IN ('eligible', 'selected', 'confirmed', 'granted')),
    participated_at TIMESTAMPTZ DEFAULT NOW(),
    winner_selected_at TIMESTAMPTZ,
    granted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create survey_email_campaigns Table
CREATE TABLE IF NOT EXISTS public.survey_email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    cohort TEXT NOT NULL CHECK (cohort IN ('activated', 'not_activated', 'beta_general')),
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'responded')),
    last_email_type TEXT NOT NULL DEFAULT 'initial_invite' CHECK (last_email_type IN ('initial_invite', 'reminder_7_days', 'final_reminder')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    reminder_sent_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    days_since_last_activity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create survey_events Table (Question Drop-Off Heatmap)
CREATE TABLE IF NOT EXISTS public.survey_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    question_number INTEGER,
    question_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_events ENABLE ROW LEVEL SECURITY;

-- Survey Responses RLS
CREATE POLICY "Users can insert their own survey response"
    ON public.survey_responses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own survey response"
    ON public.survey_responses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all survey responses"
    ON public.survey_responses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.email ILIKE 'hana%')
        )
    );

-- Research Contacts RLS
CREATE POLICY "Users can insert/update their own research contacts"
    ON public.research_contacts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all research contacts"
    ON public.research_contacts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.email ILIKE 'hana%')
        )
    );

-- Giveaway Participants RLS
CREATE POLICY "Users can insert/view their own giveaway entry"
    ON public.giveaway_participants FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage giveaway participants"
    ON public.giveaway_participants FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.email ILIKE 'hana%')
        )
    );

-- Survey Email Campaigns RLS
CREATE POLICY "Admin can manage survey email campaigns"
    ON public.survey_email_campaigns FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.email ILIKE 'hana%')
        )
    );

-- Survey Events RLS
CREATE POLICY "Users can insert survey events"
    ON public.survey_events FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Admin can view all survey events"
    ON public.survey_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.email ILIKE 'hana%')
        )
    );
