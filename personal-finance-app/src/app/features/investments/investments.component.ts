import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { PrivacyMaskPipe } from '../../shared/pipes/privacy-mask.pipe';
import { PrivacyToggleComponent } from '../../shared/components/privacy-toggle/privacy-toggle.component';
import { Investment } from '../../core/models/investment.model';
import { InvestmentService } from './services/investment.service';
import { InvestmentFormComponent } from './components/investment-form/investment-form.component';
import { InvestmentListComponent } from './components/investment-list/investment-list.component';
import { PortfolioAllocationComponent } from './components/portfolio-allocation/portfolio-allocation.component';
import { SectionHelpComponent } from '../../shared/components/section-help/section-help';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm-dialog.service';
import { ErrorBannerComponent } from '../../shared/components/error-banner/error-banner.component';
import { ListSkeletonComponent } from '../../shared/components/list-skeleton/list-skeleton.component';
import { toErrorMessage } from '../../shared/utils/http-error.util';

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    CurrencyFormatPipe,
    PrivacyMaskPipe,
    PrivacyToggleComponent,
    InvestmentFormComponent,
    InvestmentListComponent,
    PortfolioAllocationComponent,
    SectionHelpComponent,
    PageHeaderComponent,
    ErrorBannerComponent,
    ListSkeletonComponent,
  ],
  templateUrl: './investments.html',
  styleUrl: './investments.scss',
})
export class InvestmentsComponent {
  private investmentService = inject(InvestmentService);
  private confirm = inject(ConfirmService);

  investments = signal<Investment[]>([]);
  showForm = signal(false);
  saveError = signal<string | null>(null);
  private loadErrorDismissed = signal(false);
  readonly loading = computed(() => !this.investmentService.ready());
  readonly loadError = computed(() => {
    const err = this.investmentService.loadError();
    return !this.loadErrorDismissed() && err ? toErrorMessage(err) : null;
  });

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
    const investment = this.investments().find((i) => i.id === id);
    this.confirm
      .confirm({
        title: 'Delete investment',
        message: `Delete "${investment?.name ?? 'this investment'}"? This cannot be undone.`,
        confirmText: 'Delete',
        destructive: true,
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.investmentService.deleteInvestment(id).subscribe({
          error: (err) => this.saveError.set(toErrorMessage(err)),
        });
      });
  }

  onCancel(): void {
    this.showForm.set(false);
  }

  dismissLoadError(): void {
    this.loadErrorDismissed.set(true);
  }
}