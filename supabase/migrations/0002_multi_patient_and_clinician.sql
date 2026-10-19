-- Migration 0002: Multi-patient and Clinician schema + RLS policies

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'clinician', 'admin'));
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.patient_clinician_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    clinician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(patient_id, clinician_id)
);

CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT TRUE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.patient_clinician_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own links" ON public.patient_clinician_links;
    CREATE POLICY "Users can view their own links" ON public.patient_clinician_links
        FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = clinician_id);

    DROP POLICY IF EXISTS "Clinicians or patients can insert links" ON public.patient_clinician_links;
    CREATE POLICY "Clinicians or patients can insert links" ON public.patient_clinician_links
        FOR INSERT WITH CHECK (auth.uid() = patient_id OR auth.uid() = clinician_id);

    DROP POLICY IF EXISTS "Users can update their own links" ON public.patient_clinician_links;
    CREATE POLICY "Users can update their own links" ON public.patient_clinician_links
        FOR UPDATE USING (auth.uid() = patient_id OR auth.uid() = clinician_id);
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_log;
    CREATE POLICY "Users can view own audit logs" ON public.audit_log
        FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_log;
    CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_log
        FOR INSERT WITH CHECK (auth.uid() = user_id);
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Patients and linked clinicians can view consents" ON public.consent_records;
    CREATE POLICY "Patients and linked clinicians can view consents" ON public.consent_records
        FOR SELECT USING (
            auth.uid() = patient_id OR 
            EXISTS (
                SELECT 1 FROM public.patient_clinician_links pcl 
                WHERE pcl.patient_id = consent_records.patient_id 
                AND pcl.clinician_id = auth.uid() 
                AND pcl.status = 'active'
            )
        );

    DROP POLICY IF EXISTS "Patients can manage their own consents" ON public.consent_records;
    CREATE POLICY "Patients can manage their own consents" ON public.consent_records
        FOR ALL USING (auth.uid() = patient_id);
END $$;
