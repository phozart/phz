/**
 * @phozart/phz-workspace — Template Matcher
 *
 * Scores TemplateDefinition objects against a FieldProfile by evaluating
 * match rules. Returns sorted ScoredTemplate[] (best match first).
 */
function fieldCountByType(profile, type, semanticHint) {
    switch (type) {
        case 'number':
            if (semanticHint === 'measure')
                return profile.suggestedMeasures.length;
            return profile.numericFields.length;
        case 'string':
            if (semanticHint === 'dimension' || semanticHint === 'category')
                return profile.suggestedDimensions.length;
            return profile.categoricalFields.length;
        case 'date':
            return profile.dateFields.length;
        case 'boolean':
            return 0; // FieldProfile doesn't track booleans separately
        default:
            return 0;
    }
}
function ruleMatches(rule, profile) {
    return rule.requiredFieldTypes.every(req => {
        const count = fieldCountByType(profile, req.type, req.semanticHint);
        return count >= req.minCount;
    });
}
export function matchTemplates(profile, templates) {
    return templates
        .map(template => {
        const totalWeight = template.matchRules.reduce((sum, r) => sum + r.weight, 0);
        if (totalWeight === 0) {
            return { template, score: 0, matchedRationales: [], profile };
        }
        let matchedWeight = 0;
        const matchedRationales = [];
        for (const rule of template.matchRules) {
            if (ruleMatches(rule, profile)) {
                matchedWeight += rule.weight;
                if (rule.rationale)
                    matchedRationales.push(rule.rationale);
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
//# sourceMappingURL=template-matcher.js.map