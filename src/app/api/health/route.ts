import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return NextResponse.json(
    {
      status: 'ok',
      service: 'VitaTwin API Engine',
      version: '2.1.0',
      modelVersion: '2.1.0',
      timestamp: new Date().toISOString(),
      mode: 'synthetic-default',
      syntheticMode: true,
      supabaseConfigured,
      environment: process.env.NODE_ENV || 'production',
      features: {
        multiPatient: true,
        clinicianPortal: true,
        calibratedRiskModels: true,
        i18nSupport: ['en', 'hi'],
      },
    },
    { status: 200 }
  );
}
