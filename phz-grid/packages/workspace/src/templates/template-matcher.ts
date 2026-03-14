/**
 * @phozart/workspace — Template Matcher
 *
 * Scores TemplateDefinition objects against a FieldProfile by evaluating
 * match rules. Returns sorted ScoredTemplate[] (best match first).
 */

import type { FieldProfile } from './schema-analyzer.js';
import type { TemplateDefinition, TemplateMatchRule } from '../types.js';
import type { DataSourceSchema } from '../data-adapter.js';

export interface ScoredTemplate {
  template: TemplateDefinition;
  score: number;
  matchedRationales: string[];
  profile: FieldProfile;
}

function fieldCountByType(
  profile: FieldProfile,
  type: string,
  semanticHint?: string,
): number {
  switch (type) {
    case 'number':
      if (semanticHint === 'measure') return profile.suggestedMeasures.length;
      return profile.numericFields.length;
    case 'string':
      if (semanticHint === 'dimension' || semanticHint === 'category') return profile.suggestedDimensions.length;
      return profile.categoricalFields.length;
    case 'date':
      return profile.dateFields.length;
    case 'boolean':
      return 0; // FieldProfile doesn't track booleans separately
    default:
      return 0;
  }
}

function ruleMatches(rule: TemplateMatchRule, profile: FieldProfile): boolean {
  return rule.requiredFieldTypes.every(req => {
    const count = fieldCountByType(profile, req.type, req.semanticHint);
    return count >= req.minCount;
  });
}

export function matchTemplates(
  profile: FieldProfile,
  templates: TemplateDefinition[],
): ScoredTemplate[] {
  return templates
    .map(template => {
      const totalWeight = template.matchRules.reduce((sum, r) => sum + r.weight, 0);
      if (totalWeight === 0) {
        return { template, score: 0, matchedRationales: [], profile };
      }

      let matchedWeight = 0;
      const matchedRationales: string[] = [];

      for (const rule of template.matchRules) {
        if (ruleMatches(rule, profile)) {
          matchedWeight += rule.weight;
          if (rule.rationale) matchedRationales.push(rule.rationale);
        }
      }

      return {
        template,
        score: matchedWeight / totalWeight,
        matchedRationales,
        profile,
      };
    })
    .sort((a, b) => b.score - a.score);
}
