import { Component, input, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { TooltipComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { PrivacyService } from '../../../../../core/services/privacy.service';

echarts.use([LineChart, TooltipComponent, GridComponent, CanvasRenderer]);

const MASK = '\u2022\u2022\u2022\u2022';

@Component({
  selector: 'app-cumulative-line',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cumulative-line.html',
  styleUrl: './cumulative-line.scss',
})
export class CumulativeLineComponent {
  labels = input<string[]>([]);
  values = input<number[]>([]);

  private privacy = inject(PrivacyService);

  chartOptions = computed<EChartsOption>(() => {
    const hide = this.privacy.hiddenFor('challenge');
    const labels = this.labels();
    const values = this.values();
    const positive = values.every((v) => v >= 0);

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0];
          return hide
            ? `${p.axisValue}<br/>${p.marker}${p.seriesName}: ${MASK}`
            : `${p.axisValue}<br/>${p.marker}${p.seriesName}: $${Number(p.value).toFixed(2)}`;
        },
      },
      grid: { left: 8, right: 16, top: 8, bottom: 0, containLabel: true },
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
          formatter: (v: number) => (hide ? MASK : `$${v}`),
        },
        splitLine: { lineStyle: { color: '#2c2c2c' } },
      },
      series: [
        {
          name: 'Saved / Lost',
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            color: values.length > 0 && values[values.length - 1] < 0 ? '#cf6679' : '#ffd54f',
            width: 3,
          },
          itemStyle: {
            color: values.length > 0 && values[values.length - 1] < 0 ? '#cf6679' : '#ffd54f',
          },
          areaStyle: {
            color: positive
              ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
                  { offset: 0, color: 'rgba(255,213,79,0.25)' },
                  { offset: 1, color: 'rgba(255,213,79,0)' } ] }
              : { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
                  { offset: 0, color: 'rgba(207,102,121,0.25)' },
                  { offset: 1, color: 'rgba(207,102,121,0)' } ] },
          },
        },
      ],
    };
  });
}