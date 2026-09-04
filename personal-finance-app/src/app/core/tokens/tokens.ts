import { InjectionToken } from '@angular/core';
import { Repository } from '../repositories/repository.interface';

export const TRANSACTION_REPOSITORY = new InjectionToken<Repository<any>>('TransactionRepository');
export const ACCOUNT_REPOSITORY = new InjectionToken<Repository<any>>('AccountRepository');
export const BUDGET_REPOSITORY = new InjectionToken<Repository<any>>('BudgetRepository');
export const INVESTMENT_REPOSITORY = new InjectionToken<Repository<any>>('InvestmentRepository');
