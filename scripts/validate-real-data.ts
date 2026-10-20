/**
 * Validates VitaTwin's cardiovascular model against REAL patient data.
 *
 * Dataset: UCI Heart Disease, Cleveland Clinic cohort (Detrano et al., Am J
 * Cardiol 1989;64:304-310; Janosi, Steinbrunn, Pfisterer, Detrano). 303 real,
 * de-identified patients referred for coronary angiography. Licence CC BY 4.0.
 * Label: angiographic coronary disease (>50% diameter narrowing).
 *
 * In the commonly mirrored CSV used here the `target` column is inverted
 * (0 = disease), which we verify below by checking that diseased patients
 * are older and have a lower maximum heart rate.
 *
 * Run:  npm run validate     (writes src/data/validation.json)
 *
 * Honest scope: this measures DISCRIMINATION of the risk score on a small,
 * non-Indian, referral cohort whose outcome is prevalent angiographic CAD,
 * not 10-year event calibration. HDL and smoking are not recorded, so the
 * model runs with population-typical HDL and smoker = unknown (false).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { aucRoc, cvdRiskPercent, type CvdInputs } from "../src/services/risk-models";

const here = dirname(fileURLToPath(import.meta.url));
const csvPath = resolve(here, "../data/uci-cleveland-heart.csv");
const outPath = resolve(here, "../src/data/validation.json");

interface Row {
  age: number;
  sex: number;
  trestbps: number;
  chol: number;
  fbs: number;
  thalach: number;
  disease: boolean;
}

function loadRows(): Row[] {
  const lines = readFileSync(csvPath, "utf8").trim().split(/\r?\n/);
  const header = lines[0].split(",");
  const idx = (name: string) => header.indexOf(name);
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map(Number);
    return {
      age: cells[idx("age")],
      sex: cells[idx("sex")],
      trestbps: cells[idx("trestbps")],
      chol: cells[idx("chol")],
      fbs: cells[idx("fbs")],
      thalach: cells[idx("thalach")],
      disease: cells[idx("target")] === 0,
    };
  });
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Deterministic PRNG so the committed report is reproducible. */
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function bootstrapCi(scores: number[], labels: boolean[], runs = 1000): [number, number] {
  const rnd = lcg(20261020);
  const n = scores.length;
  const aucs: number[] = [];
  for (let r = 0; r < runs; r += 1) {
    const s: number[] = [];
    const l: boolean[] = [];
    for (let i = 0; i < n; i += 1) {
      const j = Math.floor(rnd() * n);
      s.push(scores[j]);
      l.push(labels[j]);
    }
    const a = aucRoc(s, l);
    if (Number.isFinite(a)) aucs.push(a);
  }
  aucs.sort((a, b) => a - b);
  return [aucs[Math.floor(aucs.length * 0.025)], aucs[Math.floor(aucs.length * 0.975)]];
}

/** Standardised logistic regression by batch gradient descent. */
function fitLogistic(X: number[][], y: number[], epochs = 1500, lr = 0.1): number[] {
  const d = X[0].length;
  const w = new Array(d + 1).fill(0);
  for (let e = 0; e < epochs; e += 1) {
    const grad = new Array(d + 1).fill(0);
    for (let i = 0; i < X.length; i += 1) {
      let z = w[0];
      for (let j = 0; j < d; j += 1) z += w[j + 1] * X[i][j];
      const err = 1 / (1 + Math.exp(-z)) - y[i];
      grad[0] += err;
      for (let j = 0; j < d; j += 1) grad[j + 1] += err * X[i][j];
    }
    for (let j = 0; j <= d; j += 1) w[j] -= (lr * grad[j]) / X.length + (j > 0 ? 0.001 * w[j] : 0);
  }
  return w;
}

function crossValidatedLogisticAuc(rows: Row[], folds = 5): number {
  const feats = (r: Row) => [r.age, r.sex, r.trestbps, r.chol, r.fbs];
  const order = rows.map((_, i) => i);
  const rnd = lcg(7);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const scores: number[] = new Array(rows.length).fill(0);
  for (let f = 0; f < folds; f += 1) {
    const test = order.filter((_, k) => k % folds === f);
    const train = order.filter((_, k) => k % folds !== f);
    const Xtr = train.map((i) => feats(rows[i]));
    const mu = Xtr[0].map((_, j) => mean(Xtr.map((x) => x[j])));
    const sd = Xtr[0].map((_, j) => Math.sqrt(mean(Xtr.map((x) => (x[j] - mu[j]) ** 2))) || 1);
    const norm = (x: number[]) => x.map((v, j) => (v - mu[j]) / sd[j]);
    const w = fitLogistic(Xtr.map(norm), train.map((i) => (rows[i].disease ? 1 : 0)));
    for (const i of test) {
      const x = norm(feats(rows[i]));
      scores[i] = w[0] + x.reduce((acc, v, j) => acc + v * w[j + 1], 0);
    }
  }
  return aucRoc(scores, rows.map((r) => r.disease));
}

function main() {
  const rows = loadRows();
  const diseased = rows.filter((r) => r.disease);
  const healthy = rows.filter((r) => !r.disease);

  // Guard: the label direction must be clinically sensible.
  if (!(mean(diseased.map((r) => r.age)) > mean(healthy.map((r) => r.age)) &&
        mean(diseased.map((r) => r.thalach)) < mean(healthy.map((r) => r.thalach)))) {
    throw new Error("Label direction check failed: dataset target encoding is not as expected.");
  }

  const labels = rows.map((r) => r.disease);
  const toInputs = (r: Row): CvdInputs => ({
    age: r.age,
    sex: r.sex === 1 ? "Male" : "Female",
    totalCholesterol: r.chol,
    hdl: r.sex === 1 ? 45 : 55, // not recorded in the dataset: sex-typical value
    systolicBp: r.trestbps,
    onBpTreatment: false,
    smoker: false, // not recorded
    diabetes: r.fbs === 1, // fasting glucose >120 mg/dL as proxy
    southAsian: true,
  });
  const twinScores = rows.map((r) => cvdRiskPercent(toInputs(r)));
  const ageScores = rows.map((r) => r.age);

  const twinAuc = aucRoc(twinScores, labels);
  const [lo, hi] = bootstrapCi(twinScores, labels);

  // Risk quartiles
  const sorted = [...twinScores].sort((a, b) => a - b);
  const cuts = [0.25, 0.5, 0.75].map((q) => sorted[Math.floor(sorted.length * q)]);
  const quartile = (s: number) => (s < cuts[0] ? 0 : s < cuts[1] ? 1 : s < cuts[2] ? 2 : 3);
  const quartiles = [0, 1, 2, 3].map((q) => {
    const members = rows.filter((_, i) => quartile(twinScores[i]) === q);
    const lows = members.length ? Math.min(...members.map((_, k) => twinScores[rows.indexOf(members[k])])) : 0;
    const highs = members.length ? Math.max(...members.map((_, k) => twinScores[rows.indexOf(members[k])])) : 0;
    return {
      quartile: `Q${q + 1}`,
      n: members.length,
      riskRange: `${lows.toFixed(1)}–${highs.toFixed(1)}%`,
      observedDiseasePct: Math.round((members.filter((m) => m.disease).length / members.length) * 1000) / 10,
    };
  });

  // ROC curve points
  const thresholds = [...new Set(twinScores)].sort((a, b) => b - a);
  const roc = [{ fpr: 0, tpr: 0 }];
  const P = diseased.length;
  const N = healthy.length;
  for (const t of thresholds) {
    let tp = 0;
    let fp = 0;
    twinScores.forEach((s, i) => {
      if (s >= t) {
        if (labels[i]) tp += 1;
        else fp += 1;
      }
    });
    roc.push({ fpr: Math.round((fp / N) * 1000) / 1000, tpr: Math.round((tp / P) * 1000) / 1000 });
  }
  roc.push({ fpr: 1, tpr: 1 });
  const rocThin = roc.filter((_, i) => i % Math.max(1, Math.floor(roc.length / 60)) === 0 || i === roc.length - 1);

  const operating = (cut: number) => {
    let tp = 0, fp = 0, fn = 0, tn = 0;
    twinScores.forEach((s, i) => {
      const flagged = s >= cut;
      if (flagged && labels[i]) tp += 1;
      else if (flagged) fp += 1;
      else if (labels[i]) fn += 1;
      else tn += 1;
    });
    return {
      cutoffPct: cut,
      sensitivity: Math.round((tp / (tp + fn)) * 1000) / 10,
      specificity: Math.round((tn / (tn + fp)) * 1000) / 10,
      flaggedPct: Math.round(((tp + fp) / rows.length) * 1000) / 10,
    };
  };

  const report = {
    generatedAt: new Date().toISOString().slice(0, 10),
    dataset: {
      name: "UCI Heart Disease — Cleveland Clinic cohort",
      citation:
        "Detrano R, et al. International application of a new probability algorithm for the diagnosis of coronary artery disease. Am J Cardiol 1989;64:304-310. UCI Machine Learning Repository, CC BY 4.0.",
      url: "https://archive.ics.uci.edu/dataset/45/heart+disease",
      n: rows.length,
      disease: P,
      noDisease: N,
      prevalencePct: Math.round((P / rows.length) * 1000) / 10,
      meanAgeDisease: Math.round(mean(diseased.map((r) => r.age)) * 10) / 10,
      meanAgeNoDisease: Math.round(mean(healthy.map((r) => r.age)) * 10) / 10,
    },
    models: [
      {
        id: "vitatwin",
        label: "VitaTwin CVD score (Framingham 2008, South-Asian adjusted)",
        auc: Math.round(twinAuc * 1000) / 1000,
        ci95: [Math.round(lo * 1000) / 1000, Math.round(hi * 1000) / 1000],
        note: "Used exactly as shipped. HDL set to a sex-typical value and smoking unknown because neither is recorded.",
      },
      {
        id: "age",
        label: "Age alone (baseline)",
        auc: Math.round(aucRoc(ageScores, labels) * 1000) / 1000,
        note: "The simplest sensible comparator.",
      },
      {
        id: "logistic",
        label: "Logistic regression refit on this cohort (5-fold CV)",
        auc: Math.round(crossValidatedLogisticAuc(rows) * 1000) / 1000,
        note: "Age, sex, BP, cholesterol and fasting glucose; an upper reference for what these five inputs can achieve here.",
      },
    ],
    quartiles,
    operatingPoints: [operating(7.5), operating(20)],
    roc: rocThin,
    limitations: [
      "Outcome is prevalent angiographic coronary disease in a referral cohort, not incident 10-year events.",
      "Cleveland patients are mostly US-based; no South-Asian cohort was available under an open licence.",
      "HDL and smoking are missing, which understates what the model can do with full inputs.",
      "n = 303; confidence intervals are wide. This is a sanity check on discrimination, not a clinical validation.",
    ],
  };

  writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ models: report.models, quartiles, operatingPoints: report.operatingPoints }, null, 2));
}

main();
