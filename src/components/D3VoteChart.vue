<template>
  <div class="card card-clean border-0 shadow-sm p-4 bg-white">
    <!-- Header: Title, Real-time status, & Chart Type Switcher -->
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 border-bottom pb-3 mb-4">
      <div>
        <div class="d-flex align-items-center gap-2 mb-1">
          <h2 class="h6 fw-bold text-dark mb-0">Visualisasi Perolehan Suara (D3.js)</h2>
          <span class="badge bg-success text-white font-mono-numbers d-inline-flex align-items-center gap-1" style="font-size: 0.65rem;">
            <span class="pulse-dot"></span>
            <span>REAL-TIME D3</span>
          </span>
        </div>
        <small class="text-muted">
          Grafik interaktif D3 perolehan suara pasangan calon ketua & wakil ketua OSIS
        </small>
      </div>

      <div class="d-flex align-items-center gap-2">
        <!-- Switcher: Grafik Batang vs Grafik Lingkaran -->
        <div class="btn-group btn-group-sm p-1 rounded-3 bg-light border" role="group" aria-label="Tipe Grafik">
          <button 
            type="button" 
            class="btn btn-sm d-flex align-items-center gap-1 rounded-2 fw-semibold px-3 transition-all"
            :class="chartType === 'bar' ? 'btn-primary shadow-xs' : 'btn-light text-secondary border-0'"
            @click="setChartType('bar')"
          >
            <i class="bi bi-bar-chart-fill"></i>
            <span>Grafik Batang</span>
          </button>
          <button 
            type="button" 
            class="btn btn-sm d-flex align-items-center gap-1 rounded-2 fw-semibold px-3 transition-all"
            :class="chartType === 'donut' ? 'btn-primary shadow-xs' : 'btn-light text-secondary border-0'"
            @click="setChartType('donut')"
          >
            <i class="bi bi-pie-chart-fill"></i>
            <span>Grafik Lingkaran</span>
          </button>
        </div>

        <button 
          type="button" 
          class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
          @click="renderChart"
          title="Segarkan tampilan grafik D3"
        >
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
    </div>

    <!-- Chart Container with Tooltip -->
    <div class="position-relative w-100 chart-wrapper mb-4">
      <div ref="chartContainerRef" class="d3-chart-container w-100" style="min-height: 330px;"></div>

      <!-- Floating D3 Tooltip -->
      <div 
        ref="tooltipRef" 
        class="d3-tooltip position-absolute shadow-lg rounded-3 p-3 bg-white border pointer-events-none"
        :style="tooltipStyle"
        v-show="tooltipVisible"
      >
        <div v-if="tooltipData">
          <div class="d-flex align-items-center justify-content-between gap-2 border-bottom pb-2 mb-2">
            <span class="badge font-mono-numbers px-2 py-1" :style="{ backgroundColor: tooltipData.color, color: '#fff' }">
              PASLON {{ tooltipData.nomor_urut }}
            </span>
            <span v-if="tooltipData.isLeader && totalSuara > 0" class="badge bg-success-subtle text-success border border-success-subtle small">
              <i class="bi bi-trophy-fill me-1"></i>Unggul
            </span>
          </div>
          <div class="fw-bold text-dark mb-0 small">{{ tooltipData.nama_ketua }}</div>
          <small class="text-muted d-block mb-2">& {{ tooltipData.nama_wakil }}</small>
          <div class="d-flex align-items-baseline justify-content-between gap-3 pt-1 border-top">
            <span class="text-muted small">Perolehan Suara:</span>
            <strong class="text-dark font-mono-numbers">{{ tooltipData.total_suara }} suara ({{ tooltipData.percentage }}%)</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Interactive Candidate Cards Legend -->
    <div class="row g-2 pt-2 border-top">
      <div 
        v-for="k in candidatesWithMetrics" 
        :key="k.id"
        class="col-12 col-md-4"
      >
        <div 
          class="p-2 px-3 rounded-3 border d-flex align-items-center justify-content-between transition-all"
          :class="k.isLeader && totalSuara > 0 ? 'bg-primary-subtle bg-opacity-15 border-primary-subtle' : 'bg-light'"
          style="cursor: default;"
        >
          <div class="d-flex align-items-center gap-2 min-w-0">
            <span 
              class="rounded-circle flex-shrink-0 d-inline-block" 
              :style="{ width: '12px', height: '12px', backgroundColor: getCandidateColor(k.nomor_urut) }"
            ></span>
            <div class="text-truncate">
              <span class="fw-bold text-dark small d-block text-truncate">
                No. {{ k.nomor_urut }} - {{ k.nama_ketua }}
              </span>
              <small class="text-muted text-truncate d-block" style="font-size: 0.72rem;">
                & {{ k.nama_wakil }}
              </small>
            </div>
          </div>
          <div class="text-end font-mono-numbers flex-shrink-0 ms-2">
            <span class="fw-bold text-dark small d-block">{{ k.total_suara }} suara</span>
            <small class="text-muted" style="font-size: 0.7rem;">{{ k.percentage }}%</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import * as d3 from 'd3';
import type { Kandidat } from '../types';
import { realtimeService } from '../services/realtime';

interface Props {
  candidates: Kandidat[];
  totalVotes?: number;
}

const props = withDefaults(defineProps<Props>(), {
  candidates: () => [],
  totalVotes: 0
});

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const chartType = ref<'bar' | 'donut'>('bar');
const chartContainerRef = ref<HTMLDivElement | null>(null);
const tooltipRef = ref<HTMLDivElement | null>(null);

const tooltipVisible = ref(false);
const tooltipData = ref<any>(null);
const tooltipStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' });

let resizeObserver: ResizeObserver | null = null;
let unbindRealtime: (() => void) | null = null;

// Palette Warna Paslon Standar eOSIS
const COLOR_PALETTE = [
  '#2563eb', // Paslon 1 - Royal Blue
  '#059669', // Paslon 2 - Emerald Green
  '#d97706', // Paslon 3 - Amber / Gold
  '#7c3aed', // Paslon 4 - Violet
  '#db2777'  // Paslon 5 - Pink
];

function getCandidateColor(nomorUrut: number): string {
  const idx = Math.max(0, nomorUrut - 1);
  return COLOR_PALETTE[idx % COLOR_PALETTE.length];
}

const totalSuara = computed(() => {
  if (props.totalVotes && props.totalVotes > 0) return props.totalVotes;
  return props.candidates.reduce((sum, c) => sum + (c.total_suara || 0), 0);
});

const maxVotes = computed(() => {
  return Math.max(...props.candidates.map(c => c.total_suara || 0), 0);
});

const candidatesWithMetrics = computed(() => {
  const total = totalSuara.value;
  return props.candidates.map(c => {
    const suara = c.total_suara || 0;
    const percentage = total > 0 ? ((suara / total) * 100).toFixed(1) : '0.0';
    const isLeader = suara > 0 && suara === maxVotes.value;
    return {
      ...c,
      percentage,
      isLeader,
      color: getCandidateColor(c.nomor_urut)
    };
  });
});

function setChartType(type: 'bar' | 'donut') {
  chartType.value = type;
  nextTick(() => {
    renderChart();
  });
}

/**
 * Rendering Utama D3.js (Grafik Batang atau Grafik Lingkaran)
 */
function renderChart() {
  if (!chartContainerRef.value) return;

  const container = chartContainerRef.value;
  // Bersihkan SVG lama
  d3.select(container).selectAll('*').remove();

  const rect = container.getBoundingClientRect();
  const width = Math.max(rect.width, 300);
  const height = 330;

  if (chartType.value === 'bar') {
    renderBarChart(container, width, height);
  } else {
    renderDonutChart(container, width, height);
  }
}

/**
 * D3.js: DIAGRAM BATANG (BAR CHART) REAL-TIME
 */
function renderBarChart(container: HTMLDivElement, width: number, height: number) {
  const margin = { top: 35, right: 25, bottom: 50, left: 55 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append('svg')
    .attr('width', '100%')
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('style', 'overflow: visible; font-family: inherit;');

  // Definisikan Gradients untuk tiap Paslon
  const defs = svg.append('defs');
  candidatesWithMetrics.value.forEach(c => {
    const gradId = `bar-gradient-${c.nomor_urut}`;
    const gradient = defs.append('linearGradient')
      .attr('id', gradId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', c.color)
      .attr('stop-opacity', 0.95);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', d3.color(c.color)?.darker(0.35)?.toString() || c.color)
      .attr('stop-opacity', 1);
  });

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Scales
  const x0 = d3.scaleBand()
    .domain(candidatesWithMetrics.value.map(c => `Paslon ${c.nomor_urut}`))
    .range([0, innerWidth])
    .padding(0.35);

  const maxVal = d3.max(candidatesWithMetrics.value, d => d.total_suara) || 10;
  // Beri headroom 20% di atas agar label angka tidak terpotong
  const yMax = Math.ceil(maxVal * 1.25) || 10;

  const y = d3.scaleLinear()
    .domain([0, yMax])
    .nice()
    .range([innerHeight, 0]);

  // Horizontal Grid Lines
  g.append('g')
    .attr('class', 'grid-lines')
    .call(
      d3.axisLeft(y)
        .ticks(5)
        .tickSize(-innerWidth)
        .tickFormat(() => '')
    )
    .call(grid => grid.select('.domain').remove())
    .call(grid => grid.selectAll('line')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-dasharray', '3,3')
    );

  // X Axis
  const xAxis = g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x0));

  xAxis.select('.domain').attr('stroke', '#cbd5e1');
  xAxis.selectAll('text')
    .attr('fill', '#334155')
    .attr('font-size', '12px')
    .attr('font-weight', '600')
    .attr('dy', '1.2em');

  // Y Axis
  const yAxis = g.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d3.format(',d')(d as number)));

  yAxis.select('.domain').attr('stroke', '#cbd5e1');
  yAxis.selectAll('text')
    .attr('fill', '#64748b')
    .attr('font-size', '11px')
    .attr('font-family', 'monospace');

  // Y Axis Title Label
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -42)
    .attr('x', -innerHeight / 2)
    .attr('text-anchor', 'middle')
    .attr('fill', '#64748b')
    .attr('font-size', '11px')
    .attr('font-weight', '500')
    .text('Jumlah Suara Sah');

  // Bar Groups
  const barGroups = g.selectAll('.bar-group')
    .data(candidatesWithMetrics.value)
    .enter()
    .append('g')
    .attr('class', 'bar-group')
    .attr('transform', d => `translate(${x0(`Paslon ${d.nomor_urut}`)},0)`);

  // Rect Bars dengan animasi transisi D3
  const bars = barGroups.append('rect')
    .attr('width', x0.bandwidth())
    .attr('x', 0)
    .attr('y', innerHeight)
    .attr('height', 0)
    .attr('rx', 6)
    .attr('ry', 6)
    .attr('fill', d => `url(#bar-gradient-${d.nomor_urut})`)
    .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))')
    .style('cursor', 'pointer');

  bars.transition()
    .duration(700)
    .ease(d3.easeCubicOut)
    .attr('y', d => y(d.total_suara))
    .attr('height', d => Math.max(0, innerHeight - y(d.total_suara)));

  // Value Labels on Top of Bars (Suara & Persentase)
  const labels = barGroups.append('text')
    .attr('x', x0.bandwidth() / 2)
    .attr('y', innerHeight)
    .attr('text-anchor', 'middle')
    .attr('fill', '#0f172a')
    .attr('font-size', '12px')
    .attr('font-weight', '700')
    .attr('font-family', 'monospace')
    .attr('opacity', 0);

  labels.append('tspan')
    .attr('x', x0.bandwidth() / 2)
    .attr('dy', '-12px')
    .text(d => `${d.total_suara} suara`);

  labels.append('tspan')
    .attr('x', x0.bandwidth() / 2)
    .attr('dy', '14px')
    .attr('font-size', '11px')
    .attr('fill', '#64748b')
    .attr('font-weight', '500')
    .text(d => `(${d.percentage}%)`);

  labels.transition()
    .duration(750)
    .delay(200)
    .ease(d3.easeCubicOut)
    .attr('y', d => y(d.total_suara) - 6)
    .attr('opacity', 1);

  // Interaktivitas Hover (Tooltip & Opacity)
  barGroups
    .on('mouseenter', (event, d) => {
      d3.select(event.currentTarget).select('rect')
        .transition().duration(150)
        .attr('opacity', 0.85)
        .attr('transform', 'scale(1.02, 1) translate(-1, 0)');

      showTooltip(event, d, container);
    })
    .on('mousemove', (event, d) => {
      moveTooltip(event, container);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).select('rect')
        .transition().duration(150)
        .attr('opacity', 1)
        .attr('transform', 'none');

      hideTooltip();
    });
}

/**
 * D3.js: DIAGRAM LINGKARAN / DONUT (DONUT CHART) REAL-TIME
 */
function renderDonutChart(container: HTMLDivElement, width: number, height: number) {
  const margin = 20;
  const radius = Math.min(width, height) / 2 - margin;
  const innerRadius = radius * 0.58;

  const svg = d3.select(container)
    .append('svg')
    .attr('width', '100%')
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('style', 'overflow: visible; font-family: inherit;');

  const g = svg.append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);

  // Jika belum ada suara yang masuk sama sekali (0 total suara)
  if (totalSuara.value === 0) {
    const emptyArc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .startAngle(0)
      .endAngle(2 * Math.PI);

    g.append('path')
      .attr('d', emptyArc as any)
      .attr('fill', '#f1f5f9')
      .attr('stroke', '#e2e8f0');

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('font-size', '16px')
      .attr('font-weight', '700')
      .attr('fill', '#94a3b8')
      .text('0 Suara');

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.4em')
      .attr('font-size', '11px')
      .attr('fill', '#94a3b8')
      .text('Belum ada suara masuk');
    return;
  }

  // D3 Pie Generator
  const pie = d3.pie<any>()
    .value(d => Math.max(d.total_suara, 0.001)) // hindari 0 mutlak untuk irisan
    .sort(null)
    .padAngle(0.03);

  // D3 Arc Generator
  const arc = d3.arc<any>()
    .innerRadius(innerRadius)
    .outerRadius(radius)
    .cornerRadius(6);

  const arcHover = d3.arc<any>()
    .innerRadius(innerRadius)
    .outerRadius(radius + 8)
    .cornerRadius(6);

  const pieData = pie(candidatesWithMetrics.value);

  // Slices
  const slices = g.selectAll('.donut-slice')
    .data(pieData)
    .enter()
    .append('g')
    .attr('class', 'donut-slice');

  // Paths dengan animasi transisi D3 tween
  const paths = slices.append('path')
    .attr('fill', d => d.data.color)
    .attr('stroke', '#ffffff')
    .attr('stroke-width', 2)
    .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))')
    .style('cursor', 'pointer');

  paths.transition()
    .duration(750)
    .attrTween('d', function(d: any) {
      const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return function(t: number) {
        return arc(interpolate(t)) as string;
      };
    });

  // Label Persentase di Luar/Dalam Irisan
  const labelArc = d3.arc<any>()
    .innerRadius(radius * 0.76)
    .outerRadius(radius * 0.76);

  slices.append('text')
    .attr('transform', d => `translate(${labelArc.centroid(d)})`)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .attr('fill', '#ffffff')
    .attr('font-size', '12px')
    .attr('font-weight', '700')
    .attr('font-family', 'monospace')
    .attr('opacity', 0)
    .text(d => Number(d.data.percentage) >= 8 ? `${d.data.percentage}%` : '')
    .transition()
    .duration(800)
    .delay(200)
    .attr('opacity', 1);

  // Teks Donut Center (Total Suara Masuk)
  const centerTextGroup = g.append('g').attr('class', 'donut-center-text');

  centerTextGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.2em')
    .attr('font-size', '24px')
    .attr('font-weight', '800')
    .attr('fill', '#0f172a')
    .attr('font-family', 'monospace')
    .text(totalSuara.value.toLocaleString('id-ID'));

  centerTextGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '1.3em')
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .attr('fill', '#64748b')
    .attr('letter-spacing', '0.04em')
    .text('SUARA SAH MASUK');

  // Interaktivitas Hover
  slices
    .on('mouseenter', (event, d) => {
      d3.select(event.currentTarget).select('path')
        .transition().duration(200)
        .attr('d', arcHover as any);

      showTooltip(event, d.data, container);
    })
    .on('mousemove', (event) => {
      moveTooltip(event, container);
    })
    .on('mouseleave', (event, d) => {
      d3.select(event.currentTarget).select('path')
        .transition().duration(200)
        .attr('d', arc as any);

      hideTooltip();
    });
}

/**
 * Tooltip Position Helpers
 */
function showTooltip(event: MouseEvent, data: any, container: HTMLElement) {
  tooltipData.value = data;
  tooltipVisible.value = true;
  moveTooltip(event, container);
}

function moveTooltip(event: MouseEvent, container: HTMLElement) {
  const containerRect = container.getBoundingClientRect();
  const mouseX = event.clientX - containerRect.left;
  const mouseY = event.clientY - containerRect.top;

  // Tempatkan tooltip di dekat kursor mouse secara presisi
  const tooltipWidth = 230;
  const isRightSide = mouseX + tooltipWidth + 20 > containerRect.width;

  const left = isRightSide ? mouseX - tooltipWidth - 12 : mouseX + 16;
  const top = Math.max(10, mouseY - 50);

  tooltipStyle.value = {
    left: `${left}px`,
    top: `${top}px`
  };
}

function hideTooltip() {
  tooltipVisible.value = false;
  tooltipData.value = null;
}

// Watch kandidat untuk auto-update grafik D3 secara real-time
watch(
  () => props.candidates,
  () => {
    nextTick(() => {
      renderChart();
    });
  },
  { deep: true }
);

onMounted(() => {
  renderChart();

  // Dengarkan siaran real-time setiap kali seorang siswa berhasil memberikan suara
  unbindRealtime = realtimeService.onVoteEvent(() => {
    emit('refresh');
    nextTick(() => {
      renderChart();
    });
  });

  // Responsive Resize Observer
  if (chartContainerRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      renderChart();
    });
    resizeObserver.observe(chartContainerRef.value);
  }
});

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (unbindRealtime) unbindRealtime();
});
</script>

<style scoped>
.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #ffffff;
  display: inline-block;
  animation: pulseAnimation 1.5s infinite;
}

@keyframes pulseAnimation {
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.7; }
}

.d3-chart-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.d3-tooltip {
  min-width: 220px;
  max-width: 260px;
  z-index: 100;
  transition: transform 0.08s ease-out, opacity 0.15s ease;
  pointer-events: none;
}

.transition-all {
  transition: all 0.2s ease;
}

.shadow-xs {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
</style>
