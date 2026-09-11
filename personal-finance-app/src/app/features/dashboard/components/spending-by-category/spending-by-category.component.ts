import { Component, input, computed, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Transaction } from '../../../../core/models/transaction.model';
import { CategoryService } from '../../../../core/services/category.service';
import { PrivacyService } from '../../../../core/services/privacy.service';

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

const MASK = '\u2022\u2022\u2022\u2022';

@Component({
  selector: 'app-spending-by-category',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spending-by-category.html',
  styleUrl: './spending-by-category.scss',
})
export class SpendingByCategoryComponent {
  private categoryService = inject(CategoryService);
  private privacy = inject(PrivacyService);
  transactions = input<Transaction[]>([]);

  private labels = signal<Record<string, string>>({});

  constructor() {
    this.labels.set({ ...this.categoryService.labels });
    this.categoryService.getCategories().subscribe(() => {
      this.labels.set({ ...this.categoryService.labels });
    });
  }

  chartOptions = computed<EChartsOption>(() => {
    const hide = this.privacy.hiddenFor('transactions');
    const expenses = this.transactions().filter((t) => t.type === 'expense');
    const byCategory = new Map<string, number>();

    for (const t of expenses) {
      const current = byCategory.get(t.category) || 0;
      byCategory.set(t.category, current + t.amount);
    }

    const data = [...byCategory.entries()]
      .map(([category, value]) => ({
        name: this.labels()[category] || category,
        value: Math.round(value * 100) / 100,
      }))
      .sort((a, b) => b.value - a.value);

    if (data.length === 0) {
      return {
        title: {
          text: 'No expenses this period',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#9e9e9e', fontSize: 13, fontWeight: 'normal' },
        },
      };
    }

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) =>
          hide ? `${params.name}: ${MASK} ({d}%)` : `${params.name}: $${Number(params.value).toFixed(2)} ({d}%)`,
      },
      legend: {
        show: data.length <= 5,
        orient: 'vertical',
        right: 0,
        top: 'middle',
        textStyle: { color: '#e0e0e0', fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
      },
      series: [
        {
          name: 'Spending',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['38%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#1e1e1e',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              formatter: (params: any) =>
                hide ? `${params.name}\n${MASK}` : `${params.name}\n$${Number(params.value).toFixed(2)}`,
              color: '#ffffff',
            },
          },
          data,
        },
      ],
      color: [
        '#ff6e6e', '#03dac6', '#cf6679', '#ffb74d', '#4fc3f7',
        '#aed581', '#f06292', '#ba68c8', '#4db6ac', '#ffd54f',
      ],
    };
  });
}
