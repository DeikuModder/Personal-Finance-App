import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { STOCK_CATALOG, Stock } from '../../data/stock-catalog';
import { MarketDataService } from '../../services/market-data.service';
import { Investment } from '../../../../core/models/investment.model';

@Component({
  selector: 'app-investment-form',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './investment-form.html',
  styleUrl: './investment-form.scss',
})
export class InvestmentFormComponent {
  saved = output<Omit<Investment, 'id' | 'createdAt'>>();
  cancelled = output<void>();

  private marketDataService = inject(MarketDataService);

  catalog = STOCK_CATALOG;
  selectedSymbol = signal<string>('');
  shares = signal<number>(1);
  currentPrice = signal<number>(0);
  purchasePrice = signal<number>(0);
  dividendPerShare = signal<number>(0);

  loading = signal(false);
  hasKey = this.marketDataService.hasKey();

  onSymbolChange(symbol: string): void {
    this.selectedSymbol.set(symbol);
  }

  fetchData(): void {
    const symbol = this.selectedSymbol();
    if (!symbol || !this.hasKey) return;
    this.loading.set(true);
    this.marketDataService.getMarketData(symbol).subscribe({
      next: (data) => {
        if (data) {
          this.currentPrice.set(data.currentPrice);
          this.dividendPerShare.set(data.trailingAnnualDividend);
          this.purchasePrice.set(this.purchasePrice() || data.currentPrice);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onSubmit(): void {
    const symbol = this.selectedSymbol();
    if (!symbol) return;
    const shares = this.shares();
    if (shares <= 0) return;

    const stock: Stock | undefined = this.catalog.find((s) => s.symbol === symbol);

    this.saved.emit({
      name: stock ? stock.name : symbol,
      type: stock ? (stock.type === 'etf' ? 'bond' : 'stock') : 'other',
      symbol,
      shares,
      purchasePrice: this.purchasePrice(),
      currentPrice: this.currentPrice() || this.purchasePrice(),
      dividendPerShare: this.dividendPerShare(),
      lastUpdated: new Date().toISOString(),
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}