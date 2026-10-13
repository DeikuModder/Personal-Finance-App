export interface NavItem {
  route: string;
  icon: string;
  label: string;
  superadmin?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const DASHBOARD: NavItem = { route: '/dashboard', icon: 'dashboard', label: 'Home' };
export const TRANSACTIONS: NavItem = { route: '/transactions', icon: 'receipt_long', label: 'Activity' };
export const ADD: NavItem = { route: '/add', icon: 'add', label: 'Add' };
export const BUDGETS: NavItem = { route: '/budgets', icon: 'savings', label: 'Budgets' };
export const DEBTS: NavItem = { route: '/debts', icon: 'credit_score', label: 'Debts' };
export const GOALS: NavItem = { route: '/goals', icon: 'flag', label: 'Goals' };
export const WISHLIST: NavItem = { route: '/wishlist', icon: 'favorite', label: 'Wishlist' };
export const ACCOUNTS: NavItem = { route: '/accounts', icon: 'account_balance_wallet', label: 'Accounts' };
export const INVESTMENTS: NavItem = { route: '/investments', icon: 'show_chart', label: 'Investments' };
export const CHALLENGE: NavItem = { route: '/challenge', icon: 'sports_esports', label: 'Challenge' };
export const CHAT: NavItem = { route: '/chat', icon: 'smart_toy', label: 'Chat' };
export const SIMULATOR: NavItem = { route: '/simulator', icon: 'query_stats', label: 'Simulator' };
export const DEV: NavItem = { route: '/dev', icon: 'code', label: 'Dev', superadmin: true };
export const SETTINGS: NavItem = { route: '/settings', icon: 'settings', label: 'Settings' };

export const TABS: { item: NavItem; raised?: boolean }[] = [
  { item: DASHBOARD },
  { item: TRANSACTIONS },
  { item: ADD, raised: true },
  { item: BUDGETS },
  { item: ACCOUNTS },
];

export const NAV_GROUPS: NavGroup[] = [
  { label: 'Core', items: [DASHBOARD, TRANSACTIONS, ADD] },
  { label: 'Planning', items: [BUDGETS, DEBTS, GOALS, WISHLIST, SIMULATOR] },
  { label: 'Assets', items: [ACCOUNTS, INVESTMENTS] },
  { label: 'Extras', items: [CHALLENGE, CHAT, DEV] },
];

export const MORE_GROUPS: NavGroup[] = [
  { label: 'Planning', items: [DEBTS, GOALS, WISHLIST, SIMULATOR] },
  { label: 'Assets', items: [INVESTMENTS] },
  { label: 'Extras', items: [CHALLENGE, CHAT, DEV] },
];

/** Filters NavGroups down to what a given role may see. */
export function visibleGroups(groups: NavGroup[], isSuper: boolean): NavGroup[] {
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.superadmin || isSuper) }))
    .filter((g) => g.items.length > 0);
}