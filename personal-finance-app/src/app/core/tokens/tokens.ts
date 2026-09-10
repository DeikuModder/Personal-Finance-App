import { InjectionToken } from '@angular/core';
import { Repository } from '../repositories/repository.interface';

export const TRANSACTION_REPOSITORY = new InjectionToken<Repository<any>>('TransactionRepository');
export const ACCOUNT_REPOSITORY = new InjectionToken<Repository<any>>('AccountRepository');
export const BUDGET_REPOSITORY = new InjectionToken<Repository<any>>('BudgetRepository');
export const BUDGET_ITEM_REPOSITORY = new InjectionToken<Repository<any>>('BudgetItemRepository');
export const CATEGORY_REPOSITORY = new InjectionToken<Repository<any>>('CategoryRepository');
export const INVESTMENT_REPOSITORY = new InjectionToken<Repository<any>>('InvestmentRepository');
export const DEBT_REPOSITORY = new InjectionToken<Repository<any>>('DebtRepository');
export const GOAL_REPOSITORY = new InjectionToken<Repository<any>>('GoalRepository');
export const WISHLIST_REPOSITORY = new InjectionToken<Repository<any>>('WishlistRepository');
