import type { PatientProfile, TwinVitals, WearableSample } from '@/types/twin';
import { generateDemoBundle } from '@/lib/data';

export interface WearableProvider {
  id: string;
  name: string;
  fetchVitals(userId: string): Promise<Partial<TwinVitals>>;
  fetchSamples(userId: string): Promise<WearableSample[]>;
  isConnected(userId: string): Promise<boolean>;
}

export interface EHRProvider {
  id: string;
  name: string;
  fetchPatientProfile(patientId: string): Promise<Partial<PatientProfile>>;
  isConnected(patientId: string): Promise<boolean>;
}

export class SyntheticDataProvider implements WearableProvider, EHRProvider {
  id = 'synthetic-default';
  name = 'Synthetic Data Provider (Default)';

  async fetchVitals(userId: string): Promise<Partial<TwinVitals>> {
    const bundle = generateDemoBundle();
    return bundle.twinState.currentVitals;
  }

  async fetchSamples(userId: string): Promise<WearableSample[]> {
    const bundle = generateDemoBundle();
    return bundle.wearables;
  }

  async fetchPatientProfile(patientId: string): Promise<Partial<PatientProfile>> {
    const bundle = generateDemoBundle();
    return bundle.profile;
  }

  async isConnected(id: string): Promise<boolean> {
    return true;
  }
}

export const defaultDataProvider = new SyntheticDataProvider();
