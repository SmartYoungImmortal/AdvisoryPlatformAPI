export interface PublicServiceDocument {
  id: string;
  advisorId: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceSatang: number;
  durationMinutes: number;
  screeningRequired: boolean;
  trialEnabled: boolean;
  trialDurationMinutes: number | null;
}
