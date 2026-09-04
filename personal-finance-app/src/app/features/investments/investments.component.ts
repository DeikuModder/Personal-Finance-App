import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { Investment } from '../../core/models/investment.model';
import { InvestmentService } from './services/investment.service';
import { InvestmentFormComponent } from './components/investment-form/investment-form.component';
import { InvestmentListComponent } from './components/investment-list/investment-list.component';
import { PortfolioAllocationComponent } from './components/portfolio-allocation/portfolio-allocation.component';

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    CurrencyFormatPipe,
    InvestmentFormComponent,
    InvestmentListComponent,
    PortfolioAllocationComponent,
  ],
  templateUrl: './investments.html',
  styleUrl: './investments.scss',
})
export class InvestmentsComponent {
  private investmentService = inject(InvestmentService);

  investments = signal<Investment[]>([]);
  showForm = signal(false);

  constructor() {
    this.investmentService.getInvestments().subscribe((items) => {
      this.investments.set(items);
    });
  }

  getTotalValue(): number {
    return this.investmentService.getTotalValue(this.investments());
  }

  getTotalAnnualIncome(): number {
    return this.investmentService.getTotalAnnualIncome(this.investments());
  }

  getMonthlyIncome(): number {
    return this.getTotalAnnualIncome() / 12;
  }

  addInvestment(data: Omit<Investment, 'id' | 'createdAt'>): void {
    this.investmentService.addInvestment(data).subscribe(() => {
      this.showForm.set(false);
    });
  }

  onDelete(id: string): void {
    this.investmentService.deleteInvestment(id);
  }

  onCancel(): void {
    this.showForm.set(false);
  }
}