import { TwinData, LabResults, Vitals, Lifestyle, Profile } from '@/types';
import { generateSyntheticTwinData } from '../synthetic-generator';

export interface WearableProvider {
  id: string;
  name: string;
  fetchVitals(userId: string): Promise<Partial<Vitals>>;
  fetchLifestyle(userId: string): Promise<Partial<Lifestyle>>;
  isConnected(userId: string): Promise<boolean>;
}

export interface EHRProvider {
  id: string;
  name: string;
  fetchLabs(patientId: string): Promise<Partial<LabResults>>;
  fetchPatientProfile(patientId: string): Promise<Partial<Profile>>;
  isConnected(patientId: string): Promise<boolean>;
}

export class SyntheticDataProvider implements WearableProvider, EHRProvider {
  id = 'synthetic-default';
  name = 'Synthetic Data Provider (Default)';

  async fetchVitals(userId: string): Promise<Partial<Vitals>> {
    const data = generateSyntheticTwinData(userId);
    return data.vitals;
  }

  async fetchLifestyle(userId: string): Promise<Partial<Lifestyle>> {
    const data = generateSyntheticTwinData(userId);
    return data.lifestyle;
  }

  async fetchLabs(patientId: string): Promise<Partial<LabResults>> {
    const data = generateSyntheticTwinData(patientId);
    return data.labs;
  }

  async fetchPatientProfile(patientId: string): Promise<Partial<Profile>> {
    const data = generateSyntheticTwinData(patientId);
    return data.profile;
  }

  async isConnected(_id: string): Promise<boolean> {
    return true;
  }

  async getFullTwinData(userId: string): Promise<TwinData> {
    return generateSyntheticTwinData(userId);
  }
}

export class HealthConnectWearableProvider implements WearableProvider {
  id = 'health-connect';
  name = 'Health Connect / Apple Health / Google Fit Provider';

  async fetchVitals(_userId: string): Promise<Partial<Vitals>> {
    return {
      restingHeartRate: 72,
      bloodPressureSystolic: 122,
      bloodPressureDiastolic: 80,
      spO2: 98,
      hrvMs: 45,
    };
  }

  async fetchLifestyle(_userId: string): Promise<Partial<Lifestyle>> {
    return {
      dailySteps: 8500,
      sleepHours: 7.2,
      sleepQualityScore: 80,
      activeMinutes: 45,
    };
  }

  async isConnected(_userId: string): Promise<boolean> {
    return false;
  }
}

export class FhirR4EhrProvider implements EHRProvider {
  id = 'fhir-r4';
  name = 'FHIR R4 EHR Provider';

  async fetchLabs(_patientId: string): Promise<Partial<LabResults>> {
    return {
      hba1c: 5.8,
      fastingGlucoseMgDl: 102,
      totalCholesterolMgDl: 190,
      hdlMgDl: 48,
      ldlMgDl: 115,
      triglyceridesMgDl: 140,
      hsCrpMgL: 1.2,
      egfr: 92,
    };
  }

  async fetchPatientProfile(_patientId: string): Promise<Partial<Profile>> {
    return {
      age: 48,
      gender: 'male',
      ethnicity: 'south_asian',
      bmi: 25.4,
      isSmoker: false,
      hasHypertensionHistory: false,
      hasDiabetesHistory: false,
    };
  }

  async isConnected(_patientId: string): Promise<boolean> {
    return false;
  }
}

export const defaultDataProvider = new SyntheticDataProvider();
