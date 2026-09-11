import { Component, input, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import * as echarts from 'echarts/core';
import { GaugeChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { PrivacyService } from '../../../../../core/services/privacy.service';

echarts.use([GaugeChart, TooltipComponent, CanvasRenderer]);

const MASK = '\u2022\u2022\u2022\u2022';

@Component({
  selector: 'app-week-gauge',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './week-gauge.html',
  styleUrl: './week-gauge.scss',
})
export class WeekGaugeComponent {
  cap = input(0);
  spent = input(0);

  private privacy = inject(PrivacyService);

  chartOptions = computed<EChartsOption>(() => {
    const hide = this.privacy.hiddenFor('challenge');
    const cap = this.cap();
    const spent = this.spent();
    const over = spent > cap;
    const ratio = cap > 0 ? Math.min(spent / cap, 1) : 0;
    const color = over ? '#cf6679' : ratio >= 0.8 ? '#ffb74d' : '#03dac6';

    return {
      series: [
        {
          type: 'gauge',
          radius: '100%',
          startAngle: 220,
          endAngle: -40,
          min: 0,
          max: cap > 0 ? cap : 1,
          pointer: { show: false },
          progress: {
            show: true,
            width: 14,
            itemStyle: { color },
            roundCap: true,
          },
          axisLine: {
            lineStyle: { width: 14, color: [[1, '#2a2a2a']] },
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          anchor: { show: false },
          detail: {
            valueAnimation: true,
            formatter: (value: number) => (hide ? MASK : `${Math.round(value)}`),
            color: '#ffffff',
            fontSize: 20,
            fontWeight: 700,
            offsetCenter: [0, '35%'],
          },
          title: {
            show: true,
            offsetCenter: [0, '-5%'],
            color: '#9e9e9e',
            fontSize: 11,
          },
          data: [{ value: Math.round(spent), name: '/ cap' }],
        },
      ],
    };
  });
}