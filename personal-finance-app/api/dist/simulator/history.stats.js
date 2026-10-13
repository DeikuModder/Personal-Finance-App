"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeHistoryStats = computeHistoryStats;
function computeHistoryStats(params) {
    const { transactions, accounts, challenge, goals, debts, wishlist } = params;
    const buckets = new Map();
    let historyStart = '';
    let historyEnd = '';
    for (const tx of transactions) {
        if (tx.type === 'transfer')
            continue;
        const d = parseLocalDate(tx.date);
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
        let b = buckets.get(key);
        if (!b) {
            b = { key, label: monthLabel(d), year: d.getFullYear(), month: d.getMonth(), income: 0, expense: 0 };
            buckets.set(key, b);
        }
        if (tx.type === 'income')
            b.income += tx.amount;
        else
            b.expense += tx.amount;
        if (!historyStart || key < historyStart)
            historyStart = key;
        if (!historyEnd || key > historyEnd)
            historyEnd = key;
    }
    const months = [...buckets.values()].sort((a, b) => (a.key < b.key ? -1 : 1));
    const incomeMonths = months.filter((m) => m.income > 0).map((m) => ({ key: m.key, amount: m.income }));
    const incomeMean = average(incomeMonths.map((m) => m.amount));
    const incomeStd = stdDev(incomeMonths.map((m) => m.amount));
    const incomeCv = incomeMean > 0 ? incomeStd / incomeMean : 0.5;
    const spendValues = months.map((m) => m.expense);
    const spendMean = average(spendValues);
    const spendStd = stdDev(spendValues);
    const winStartKey = trailingKey(historyEnd, 11);
    const categories = computeCategories(transactions.filter((t) => t.type === 'expense'), months, winStartKey);
    const seasonality = computeSeasonality(months);
    const oneOffFlags = computeOneOffs(transactions.filter((t) => t.type === 'expense'), months, winStartKey);
    const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
    const incomeDefault = challenge && challenge.enabled && challenge.monthlyIncome > 0 ? challenge.monthlyIncome : incomeMean;
    const activeGoals = goals.filter((g) => g.status === 'active');
    const activeDebts = debts.filter((d) => d.status === 'active' && d.type === 'payable');
    const activeWishlist = wishlist.filter((w) => w.status === 'active');
    return {
        currency: 'USD',
        aiEnabled: !!(process.env.OPENROUTER_API_KEY || '').trim(),
        aiModel: process.env.SIMULATOR_AI_MODEL || 'openrouter/auto',
        monthlyIncome: { mean: incomeMean, std: incomeStd, cv: incomeCv, months: incomeMonths },
        monthlySpend: { mean: spendMean, std: spendStd, months },
        categories,
        seasonality,
        oneOffFlags,
        balances: {
            total: totalBalance,
            accounts: accounts.map((a) => ({ id: a.id, name: a.name, type: a.type, balance: a.balance })),
        },
        incomeDefault,
        goals: activeGoals,
        debts: activeDebts,
        wishlist: activeWishlist,
        historyStart,
        historyEnd,
    };
}
function computeCategories(expenses, months, winStartKey) {
    const byCat = new Map();
    for (const tx of expenses) {
        const d = parseLocalDate(tx.date);
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
        if (key < winStartKey)
            continue;
        const arr = byCat.get(tx.category) || [];
        arr.push(tx.amount);
        byCat.set(tx.category, arr);
    }
    const monthCount = Math.max(1, months.filter((m) => m.key >= winStartKey).length);
    const total = [...byCat.values()].reduce((s, arr) => s + arr.reduce((a, b) => a + b, 0), 0);
    const stats = [...byCat.entries()].map(([category, amounts]) => {
        const mean = amounts.reduce((a, b) => a + b, 0) / monthCount;
        const std = stdDev(amounts);
        const catTotal = mean * monthCount;
        return {
            category,
            monthlyMean: round2(mean),
            monthlyStd: round2(std),
            share: total > 0 ? catTotal / total : 0,
        };
    });
    stats.sort((a, b) => b.monthlyMean - a.monthlyMean);
    return stats.slice(0, 30).map((s) => ({ ...s, share: round3(s.share) }));
}
function computeSeasonality(months) {
    const sums = new Array(12).fill(0);
    const counts = new Array(12).fill(0);
    for (const m of months) {
        sums[m.month] += m.expense;
        counts[m.month] += 1;
    }
    const avgs = sums.map((s, i) => (counts[i] > 0 ? s / counts[i] : 0));
    const overall = average(avgs);
    if (overall <= 0)
        return new Array(12).fill(1);
    return avgs.map((a) => round3(a / overall));
}
function computeOneOffs(expenses, months, winStartKey) {
    const byCat = new Map();
    for (const tx of expenses) {
        const d = parseLocalDate(tx.date);
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
        if (key < winStartKey)
            continue;
        const arr = byCat.get(tx.category) || [];
        arr.push(tx.amount);
        byCat.set(tx.category, arr);
    }
    const flags = [];
    for (const [category, amounts] of byCat) {
        const mean = average(amounts);
        const std = stdDev(amounts);
        if (std <= 0 || mean <= 0)
            continue;
        for (const amount of amounts) {
            const z = (amount - mean) / std;
            if (z > 3 && amount > mean * 1.5) {
                flags.push({ key: `${category}:${amount}`, category, amount, zScore: round2(z) });
            }
        }
    }
    flags.sort((a, b) => b.amount - a.amount);
    return flags.slice(0, 8);
}
function trailingKey(endKey, backMonths) {
    if (!endKey)
        return '0000-00';
    const [y, m] = endKey.split('-').map(Number);
    const d = new Date(y, Math.max(m - 1 - backMonths, 0), 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function parseLocalDate(value) {
    const parts = String(value).split('T')[0].split('-').map(Number);
    if (parts.length >= 3 && parts[0] > 1900)
        return new Date(parts[0], parts[1] - 1, parts[2]);
    return new Date();
}
function monthLabel(d) {
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}
function pad(n) {
    return n < 10 ? `0${n}` : String(n);
}
function average(values) {
    if (values.length === 0)
        return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}
function stdDev(values) {
    const n = values.length;
    if (n < 2)
        return 0;
    const m = average(values);
    return Math.sqrt(values.reduce((s, v) => s + (v - m) * (v - m), 0) / (n - 1));
}
function round2(v) {
    return Math.round(v * 100) / 100;
}
function round3(v) {
    return Math.round(v * 1000) / 1000;
}
//# sourceMappingURL=history.stats.js.map