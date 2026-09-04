import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-net-worth-card',
  standalone: true,
  imports: [RouterLink, MatIconModule, CurrencyFormatPipe],
  templateUrl: './net-worth-card.html',
  styleUrl: './net-worth-card.scss',
})
export class NetWorthCardComponent {
  accountsTotal = input(0);
  investmentsValue = input(0);
  investmentsIncome = input(0);

  getNetWorth(): number {
    return this.accountsTotal() + this.investmentsValue();
  }
}