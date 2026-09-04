import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Transaction } from '../../../../core/models/transaction.model';

echarts.use([LineChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

@Component({
  selector: 'app-monthly-trend',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './monthly-trend.html',
  styleUrl: './monthly-trend.scss',
})
export class MonthlyTrendComponent {
  transactions = input<Transaction[]>([]);

  chartOptions = computed<EChartsOption>(() => {
    const income = this.transactions().filter((t) => t.type === 'income');
    const expenses = this.transactions().filter((t) => t.type === 'expense');

    const incomeData: number[] = [];
    const expenseData: number[] = [];
    const labels: string[] = [];

    for (let m = 0; m < 12; m++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - m));
      labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
      const y = date.getFullYear();
      const mo = date.getMonth();

      const monthIncome = income
        .filter((t) => {
          const d = new Date(t.date);
          return d.getFullYear() === y && d.getMonth() === mo;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const monthExpense = expenses
        .filter((t) => {
          const d = new Date(t.date);
          return d.getFullYear() === y && d.getMonth() === mo;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      incomeData.push(Math.round(monthIncome * 100) / 100);
      expenseData.push(Math.round(monthExpense * 100) / 100);
    }

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          let html = params[0]?.axisValue || '';
          for (const p of params) {
            html += `<br/>${p.marker}${p.seriesName}: $${Number(p.value).toFixed(2)}`;
          }
          return html;
        },
      },
      legend: {
        data: ['Income', 'Expenses'],
        textStyle: { color: '#e0e0e0', fontSize: 11 },
        itemWidth: 12,
        itemHeight: 12,
        top: 0,
      },
      grid: {
        left: 8,
        right: 8,
        top: 32,
        bottom: 0,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { color: '#9e9e9e', fontSize: 10 },
        axisLine: { lineStyle: { color: '#424242' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#9e9e9e',
          fontSize: 10,
          formatter: (v: number) => `$${v}`,
        },
        splitLine: { lineStyle: { color: '#2c2c2c' } },
      },
      series: [
        {
          name: 'Income',
          type: 'line',
          data: incomeData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { color: '#03dac6', width: 2 },
          itemStyle: { color: '#03dac6' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(3,218,198,0.25)' },
                { offset: 1, color: 'rgba(3,218,198,0)' },
              ],
            },
          },
        },
        {
          name: 'Expenses',
          type: 'line',
          data: expenseData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { color: '#cf6679', width: 2 },
          itemStyle: { color: '#cf6679' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(207,102,121,0.25)' },
                { offset: 1, color: 'rgba(207,102,121,0)' },
              ],
            },
          },
        },
      ],
    };
  });
}
