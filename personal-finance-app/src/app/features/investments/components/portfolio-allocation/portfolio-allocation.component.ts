import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Investment } from '../../../../core/models/investment.model';

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

@Component({
  selector: 'app-portfolio-allocation',
  standalone: true,
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './portfolio-allocation.html',
  styleUrl: './portfolio-allocation.scss',
})
export class PortfolioAllocationComponent {
  investments = input<Investment[]>([]);

  private getValue(investment: Investment): number {
    const shares = investment.shares ?? 1;
    return investment.currentPrice * shares;
  }

  chartOptions = computed<EChartsOption>(() => {
    const data = this.investments()
      .map((i) => ({
        name: i.symbol || i.name,
        value: Math.round(this.getValue(i) * 100) / 100,
      }))
      .sort((a, b) => b.value - a.value);

    const total = data.reduce((sum, d) => sum + d.value, 0);

    if (total <= 0) {
      return {
        title: {
          text: 'No portfolio allocation',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#9e9e9e', fontSize: 13, fontWeight: 'normal' },
        },
      };
    }

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ${c} ({d}%)',
      },
      legend: {
        show: data.length <= 6,
        orient: 'vertical',
        right: 0,
        top: 'middle',
        textStyle: { color: '#e0e0e0', fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
      },
      series: [
        {
          name: 'Portfolio',
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
              formatter: '{b}\n${c}',
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