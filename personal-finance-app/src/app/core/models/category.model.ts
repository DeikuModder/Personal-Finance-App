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
  other: 'more_horiz',
};
