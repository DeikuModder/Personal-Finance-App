import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiKeyService } from './api-key.service';

export interface MarketData {
  currentPrice: number;
  trailingAnnualDividend: number;
  name: string;
}

interface QuoteResponse {
  'Global Quote': {
    '05. price': string;
    '01. symbol': string;
  };
}

interface MonthlyResponse {
  'Monthly Adjusted Time Series'?: Record<
    string,
    { '7. dividend amount': string }
  >;
}

@Injectable({ providedIn: 'root' })
export class MarketDataService {
  private http = inject(HttpClient);
  private apiKeyService = inject(ApiKeyService);

  private baseUrl = 'https://www.alphavantage.co/query';

  hasKey(): boolean {
    return this.apiKeyService.hasKey();
  }

  getMarketData(symbol: string): Observable<MarketData | null> {
    const key = this.apiKeyService.getKey();
    if (!key) {
      return of(null);
    }

    const quote$ = this.http
      .get<QuoteResponse>(this.baseUrl, {
        params: { function: 'GLOBAL_QUOTE', symbol, apikey: key },
      })
      .pipe(
        catchError(() => of(null as QuoteResponse | null))
      );

    const dividends$ = this.http
      .get<MonthlyResponse>(this.baseUrl, {
        params: {
          function: 'TIME_SERIES_MONTHLY_ADJUSTED',
          symbol,
          apikey: key,
        },
      })
      .pipe(
        catchError(() => of(null as MonthlyResponse | null))
      );

    return forkJoin([quote$, dividends$]).pipe(
      map(([quote, monthly]) => {
        const price = parseFloat(quote?.['Global Quote']?.['05. price'] ?? '');
        if (!isFinite(price) || price <= 0) {
          return null;
        }

        const series = monthly?.['Monthly Adjusted Time Series'];
        let trailingDividend = 0;
        if (series) {
          const dates = Object.keys(series).sort((a, b) => (a < b ? -1 : 1));
          const lastTwelve = dates.slice(-12);
          for (const date of lastTwelve) {
            const amount = parseFloat(series[date]['7. dividend amount'] ?? '0');
            if (isFinite(amount)) {
              trailingDividend += amount;
            }
          }
        }

        return {
          currentPrice: Math.round(price * 100) / 100,
          trailingAnnualDividend: Math.round(trailingDividend * 100) / 100,
          name: quote?.['Global Quote']?.['01. symbol'] ?? symbol,
        };
      })
    );
  }
}