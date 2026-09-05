import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { TooltipComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, TooltipComponent, GridComponent, CanvasRenderer]);

interface BarDatum {
  label: string;
  spent: number;
  cap: number;
}

@Component({
  selector: 'app-month-bars',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './month-bars.html',
  styleUrl: './month-bars.scss',
})
export class MonthBarsComponent {
  weeks = input<BarDatum[]>([]);

  chartOptions = computed<EChartsOption>(() => {
    const weeks = this.weeks();
    const labels = weeks.map((w) => w.label);
    const spent = weeks.map((w) => w.spent);
    const caps = weeks.map((w) => w.cap);

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
        data: ['Spent', 'Cap'],
        textStyle: { color: '#e0e0e0', fontSize: 11 },
        itemWidth: 12,
        itemHeight: 12,
        top: 0,
      },
      grid: { left: 8, right: 8, top: 34, bottom: 0, containLabel: true },
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
          name: 'Spent',
          type: 'bar',
          data: spent,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: (params: any) =>
              params.value > caps[params.dataIndex] ? '#cf6679' : '#ff6e6e',
          },
        },
        {
          name: 'Cap',
          type: 'bar',
          data: caps,
          barMaxWidth: 4,
          itemStyle: { color: '#9e9e9e', opacity: 0.5 },
        },
      ],
    };
  });
}