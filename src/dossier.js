import { baseSummary } from "./model.js";

export function buildDossier(base, crackResult, extra = {}) {
  return {
    schema: "coc-attack-dossier/v1",
    purpose: "Expose a base model, uncertainty assumptions, Monte Carlo results, and executable attack sequence to a text LLM for critique and parameter adjustment.",
    epistemicStatus: {
      simulator: "proxy, not a byte-for-byte reproduction of Clash of Clans combat mechanics",
      screenshotExtraction: extra.extractionStatus || "manual-or-unverified",
      instruction: "Treat percentages as model outputs, not guarantees. Optimize robustness and identify hidden-state branches."
    },
    base: {
      meta: base.meta,
      summary: baseSummary(base),
      structures: base.structures
    },
    crack: crackResult,
    reviewerContract: {
      task: "Review the top candidate attack, identify likely failure modes, and propose bounded parameter changes or contingency branches.",
      allowedPlanFields: ["strategy","angle","offset","corridorWidth","funnelBias","spellDepth","reserve","abilityTempo"],
      outputPreference: "Return analysis plus a machine-readable proposal object. Do not claim certainty beyond the simulator evidence."
    }
  };
}

export function buildReviewPrompt(dossier) {
  return `You are the tactical reviewer for a Clash-style Monte Carlo attack planner.\n\nThe simulator is deliberately separate from your reasoning. You may propose changes, but you do not mutate state. Review the evidence, reason about pathing and hidden-state risk, and return a concise recommendation with a bounded plan patch and contingency notes.\n\nATTACK DOSSIER:\n${JSON.stringify(dossier, null, 2)}`;
}
