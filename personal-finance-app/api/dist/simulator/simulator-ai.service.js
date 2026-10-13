"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulatorAiService = void 0;
const common_1 = require("@nestjs/common");
let SimulatorAiService = class SimulatorAiService {
    constructor() {
        this.logger = new common_1.Logger('SimulatorAiService');
        this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    }
    available() {
        return !!(process.env.OPENROUTER_API_KEY || '').trim();
    }
    model() {
        return process.env.SIMULATOR_AI_MODEL || 'openrouter/auto';
    }
    async interpret(text, scenario, stats) {
        const system = [
            'You are the scenario interpreter for a personal-finance Monte Carlo simulator.',
            'Translate the user\'s free-text intention into structured changes to the simulation parameters.',
            'monthOffset is the 0-based index of the month inside the forecast (the first forecast month is 0).',
            'savingsRate is a fraction in 0..1 of monthly income set aside as savings.',
            'fixedSavings is an absolute amount saved every month; prefer savingsRate and clear "fixedSavings" when the user speaks in percentages, and vice versa.',
            'categoryMultipliers is a map of category name to a multiplier (>1 spend more, <1 spend less). Only include categories actually mentioned.',
            'inflationDrift is the annual percent growth of spending.',
            'One-time purchases go into oneOffs.',
            'Respond ONLY with valid JSON: {"patch": { "$field": value, ... }, "clear": ["field", ...], "message": "one-line plain summary of what changed"}.',
            'Only include keys in "patch" that should change. Any field listed in "clear" is reset to the engine default.',
        ].join(' ');
        const user = [
            'Current assumptions:',
            JSON.stringify(this.compactScenario(scenario)),
            'User history summary (aggregates only):',
            JSON.stringify(this.statsSummary(stats)),
            'User message:',
            text,
        ].join('\n');
        const raw = await this.chat(system, user);
        return this.parse(raw, { patch: {}, clear: [], message: '' });
    }
    async report(stats, result, scenario) {
        const system = [
            'You are a financial coach explaining a Monte Carlo forecast to the user.',
            'Every figure you mention must come from the provided engine output — never invent numbers.',
            'P50 = middle estimate, P25/P75 = range, P5/P95 = tails. A negative balance probability means a chance the user\'s cash runs out.',
            'Refer to percentiles in plain language ("likely", "expected", "up to").',
            'Respond ONLY with valid JSON:',
            '{"summary": "2-4 sentences", "highlights": ["..."], "risks": ["..."], "topLevers": ["..."]}',
            'topLevers = the 3 most impactful things the user could change (saving rate, a category multiplier, an expense reduction).',
        ].join(' ');
        const user = [
            'Current assumptions:',
            JSON.stringify(this.compactScenario(scenario)),
            'Monte Carlo engine output:',
            JSON.stringify({
                horizonMonths: result.horizonMonths,
                startMonth: result.startMonth,
                totals: result.totals,
                goalProbability: result.goalProbability,
                negativeBalanceProbability: result.negativeBalanceProbability,
                month: result.month.map((m) => ({
                    m: m.label,
                    spent: m.spent,
                    saved: m.saved,
                    balance: m.balance,
                })),
                categories: result.categories,
            }),
        ].join('\n');
        const raw = await this.chat(system, user);
        return this.parse(raw, { summary: '', highlights: [], risks: [], topLevers: [] });
    }
    async chat(system, user) {
        const key = (process.env.OPENROUTER_API_KEY || '').trim();
        if (!key) {
            throw new common_1.BadRequestException('AI is not configured: set OPENROUTER_API_KEY to enable it.');
        }
        let lastError = null;
        for (let attempt = 0; attempt < 2; attempt++) {
            let res;
            try {
                res = await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${key}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: this.model(),
                        messages: [
                            { role: 'system', content: system },
                            { role: 'user', content: user },
                        ],
                        temperature: 0.3,
                        max_tokens: 1200,
                        response_format: { type: 'json_object' },
                    }),
                    signal: AbortSignal.timeout(45000),
                });
            }
            catch (err) {
                lastError = `network: ${err}`;
                continue;
            }
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                lastError = `status ${res.status}: ${text.slice(0, 300)}`;
                if (attempt === 0 && res.status >= 400)
                    continue;
                break;
            }
            const body = await res.json().catch(() => null);
            const content = body?.choices?.[0]?.message?.content;
            if (typeof content === 'string' && content.trim()) {
                return content;
            }
            lastError = 'empty response body';
            if (attempt === 0)
                continue;
            break;
        }
        this.logger.warn(`OpenRouter failed on ${this.model()}: ${lastError}`);
        if (lastError && lastError.startsWith('status 4')) {
            throw new common_1.ServiceUnavailableException('The AI model returned an error. Please try again.');
        }
        throw new common_1.ServiceUnavailableException('The AI model returned an empty response. Please try again.');
    }
    parse(raw, defaults) {
        let data = null;
        const cleaned = raw
            .replace(/```json\s*/gi, '')
            .replace(/```[a-z]*/gi, '')
            .trim();
        try {
            data = JSON.parse(cleaned);
        }
        catch {
            const start = cleaned.indexOf('{');
            const end = cleaned.lastIndexOf('}');
            if (start >= 0 && end > start) {
                try {
                    data = JSON.parse(cleaned.slice(start, end + 1));
                }
                catch {
                    data = null;
                }
            }
        }
        if (!data || typeof data !== 'object') {
            throw new common_1.ServiceUnavailableException('The AI model returned malformed JSON.');
        }
        for (const key of Object.keys(defaults)) {
            data[key] = data[key] ?? defaults[key];
        }
        return data;
    }
    compactScenario(scenario) {
        const out = {};
        for (const k of Object.keys(scenario || {})) {
            const v = scenario[k];
            if (v !== undefined && v !== null)
                out[k] = v;
        }
        return out;
    }
    statsSummary(stats) {
        return {
            monthlyIncome: {
                mean: round2(stats.monthlyIncome.mean),
                cv: round2(stats.monthlyIncome.cv),
                months: stats.monthlyIncome.months.slice(-6),
            },
            monthlySpend: { mean: round2(stats.monthlySpend.mean), std: round2(stats.monthlySpend.std) },
            categories: stats.categories.slice(0, 12).map((c) => ({
                category: c.category,
                monthlyMean: c.monthlyMean,
                share: c.share,
            })),
            seasonality: stats.seasonality,
            oneOffFlags: stats.oneOffFlags.slice(0, 5),
            balance: round2(stats.balances.total),
            goals: stats.goals.length,
            debts: stats.debts.length,
            wishlist: stats.wishlist.length,
            historyStart: stats.historyStart,
            historyEnd: stats.historyEnd,
        };
    }
};
exports.SimulatorAiService = SimulatorAiService;
exports.SimulatorAiService = SimulatorAiService = __decorate([
    (0, common_1.Injectable)()
], SimulatorAiService);
function round2(v) {
    return Math.round(v * 100) / 100;
}
//# sourceMappingURL=simulator-ai.service.js.map