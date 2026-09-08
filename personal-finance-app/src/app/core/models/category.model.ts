export type TransactionCategory =
  | 'salary'
  | 'freelance'
  | 'investment_income'
  | 'gifts_received'
  | 'food_dining'
  | 'groceries'
  | 'transport'
  | 'fuel'
  | 'bills_utilities'
  | 'rent_mortgage'
  | 'insurance'
  | 'entertainment'
  | 'subscriptions'
  | 'shopping'
  | 'health'
  | 'education'
  | 'personal_care'
  | 'investments'
  | 'gifts_sent'
  | 'transfer'
  | 'other';

export const INCOME_CATEGORIES: { value: TransactionCategory; label: string }[] = [
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'investment_income', label: 'Investment Income' },
  { value: 'gifts_received', label: 'Gifts Received' },
  { value: 'other', label: 'Other Income' },
];

export const EXPENSE_CATEGORIES: { value: TransactionCategory; label: string }[] = [
  { value: 'food_dining', label: 'Food & Dining' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'transport', label: 'Transport' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'bills_utilities', label: 'Bills & Utilities' },
  { value: 'rent_mortgage', label: 'Rent / Mortgage' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'health', label: 'Health' },
  { value: 'education', label: 'Education' },
  { value: 'personal_care', label: 'Personal Care' },
  { value: 'investments', label: 'Investments' },
  { value: 'gifts_sent', label: 'Gifts Sent' },
  { value: 'other', label: 'Other Expense' },
];

export const CATEGORY_ICONS: Record<TransactionCategory, string> = {
  salary: 'work',
  freelance: 'computer',
  investment_income: 'trending_up',
  gifts_received: 'redeem',
  food_dining: 'restaurant',
  groceries: 'shopping_cart',
  transport: 'directions_bus',
  fuel: 'local_gas_station',
  bills_utilities: 'receipt',
  rent_mortgage: 'home',
  insurance: 'shield',
  entertainment: 'movie',
  subscriptions: 'subscriptions',
  shopping: 'shopping_bag',
  health: 'favorite',
  education: 'school',
  personal_care: 'spa',
  investments: 'show_chart',
  gifts_sent: 'card_giftcard',
  transfer: 'swap_horiz',
  other: 'more_horiz',
};

export interface Category {
  id: string;
  label: string;
  icon: string;
  type: 'income' | 'expense';
  createdAt: string;
}

export interface CategoryOption {
  value: string;
  label: string;
  icon: string;
}

export const CUSTOM_CATEGORY_TYPE = 'custom';
export const NEW_CATEGORY_VALUE = '__new__';

export const CUSTOM_CATEGORY_ICONS: string[] = [
  'star',
  'bolt',
  'pets',
  'celebration',
  'coffee',
  'fastfood',
  'cake',
  'sports_soccer',
  'fitness_center',
  'flight',
  'hotel',
  'child_care',
  'palette',
  'music_note',
  'videogame_asset',
  'smartphone',
  'laptop',
  'local_cafe',
  'card_membership',
  'eco',
  'delete_sweep',
  'water_drop',
  'lightbulb',
  'devices',
  'volunteer_activism',
  'sentiment_satisfied',
  'kitchen',
  'logout',
];
