export type Language = 'en' | 'hi';

export interface Translations {
  clinicalOverview: string;
  patientProfile: string;
  vitalsAndMetrics: string;
  riskAssessment: string;
  whatIfSimulator: string;
  medicalDisclaimer: string;

  lowRisk: string;
  moderateRisk: string;
  highRisk: string;
  criticalRisk: string;
  cardiovascularRisk: string;
  diabetesRisk: string;

  simulatorTitle: string;
  baseline: string;
  simulatedOutcome: string;
  adjustParameters: string;
  applySimulation: string;
  resetSimulation: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    clinicalOverview: "Clinical Overview",
    patientProfile: "Patient Profile",
    vitalsAndMetrics: "Vitals & Biometric Metrics",
    riskAssessment: "Calibrated Risk Assessment",
    whatIfSimulator: "What-If Counterfactual Simulator",
    medicalDisclaimer: "Notice: VitaTwin operates on synthetic default data for clinical decision support simulation. Not intended for direct diagnostic rely without physician oversight.",

    lowRisk: "Low Risk",
    moderateRisk: "Moderate Risk",
    highRisk: "High Risk",
    criticalRisk: "Critical Risk",
    cardiovascularRisk: "Cardiovascular Disease Risk",
    diabetesRisk: "Type 2 Diabetes Risk",

    simulatorTitle: "Intervention Counterfactual Engine",
    baseline: "Baseline Patient State",
    simulatedOutcome: "Simulated Trajectory",
    adjustParameters: "Adjust Biomarkers & Lifestyle",
    applySimulation: "Run Counterfactual",
    resetSimulation: "Reset to Baseline",
  },
  hi: {
    clinicalOverview: "नैदानिक अवलोकन (Clinical Overview)",
    patientProfile: "रोगी प्रोफ़ाइल (Patient Profile)",
    vitalsAndMetrics: "महत्वपूर्ण लक्षण एवं बायोट्रैकर",
    riskAssessment: "जोखिम मूल्यांकन (Risk Assessment)",
    whatIfSimulator: "व्हाट-इफ़ सिमुलेटर (What-If Simulator)",
    medicalDisclaimer: "सूचना: वीटाट्विन नैदानिक निर्णय सहायता सिमुलेशन के लिए सिंथेटिक डेटा पर काम करता है। चिकित्सक की देखरेख के बिना प्रत्यक्ष निदान के लिए उपयोग न करें।",

    lowRisk: "कम जोखिम (Low Risk)",
    moderateRisk: "मध्यम जोखिम (Moderate Risk)",
    highRisk: "उच्च जोखिम (High Risk)",
    criticalRisk: "गंभीर जोखिम (Critical Risk)",
    cardiovascularRisk: "हृदय रोग जोखिम (Cardiovascular Risk)",
    diabetesRisk: "टाइप 2 मधुमेह जोखिम (Diabetes Risk)",

    simulatorTitle: "इंटरवेंशन काउंटरफैक्चुअल इंजन",
    baseline: "आधारभूत रोगी स्थिति (Baseline)",
    simulatedOutcome: "सिम्युलेटेड परिणाम (Simulated Outcome)",
    adjustParameters: "बायोमार्कर और जीवनशैली समायोजित करें",
    applySimulation: "सिमुलेशन चलाएं",
    resetSimulation: "पुनः सेट करें",
  },
};

export function getTranslation(lang: Language = 'en'): Translations {
  return translations[lang] || translations.en;
}
