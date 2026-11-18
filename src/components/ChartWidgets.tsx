import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface MonthlyTrendChartProps {
  labels: string[];
  counts: number[];
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ labels, counts }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Jumlah Insiden',
            data: counts,
            borderColor: '#10B981',
            backgroundColor: gradient,
            borderWidth: 2.5,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#0B1930',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0B1930',
            borderColor: '#25416E',
            borderWidth: 1,
            titleColor: '#F8FAFC',
            bodyColor: '#CBD5E1',
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(37, 65, 110, 0.35)' },
            ticks: { color: '#94A3B8', font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(37, 65, 110, 0.35)' },
            ticks: {
              color: '#94A3B8',
              stepSize: 1,
              font: { size: 11 },
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [labels, counts]);

  return (
    <div className="relative h-48 w-full" data-testid="chart-monthly-trend">
      <canvas ref={canvasRef} aria-label="Grafik Tren Kejadian Insiden Bulanan" />
    </div>
  );
};

interface AccidentTypeDoughnutProps {
  labels: string[];
  counts: number[];
}

export const AccidentTypeDoughnutChart: React.FC<AccidentTypeDoughnutProps> = ({
  labels,
  counts,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const palette = ['#10B981', '#38BDF8', '#F59E0B', '#EF4444', '#A78BFA', '#2DD4BF'];

    chartRef.current = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['Tidak Ada Data'],
        datasets: [
          {
            data: counts.length > 0 ? counts : [1],
            backgroundColor: counts.length > 0 ? palette.slice(0, labels.length) : ['#1E3558'],
            borderColor: '#11223E',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#CBD5E1',
              boxWidth: 10,
              boxHeight: 10,
              padding: 10,
              font: { size: 11 },
            },
          },
          tooltip: {
            backgroundColor: '#0B1930',
            borderColor: '#25416E',
            borderWidth: 1,
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [labels, counts]);

  return (
    <div className="relative h-48 w-full" data-testid="chart-accident-type">
      <canvas ref={canvasRef} aria-label="Grafik Distribusi Tipe Kecelakaan" />
    </div>
  );
};

interface CauseCorrelationBarProps {
  d1Count: number;
  d2Count: number;
}

export const CauseCorrelationBarChart: React.FC<CauseCorrelationBarProps> = ({
  d1Count,
  d2Count,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Kondisi Berbahaya (Kode D1)', 'Tindakan Berbahaya (Kode D2)'],
        datasets: [
          {
            label: 'Temuan Faktor Kausal RCA',
            data: [d1Count, d2Count],
            backgroundColor: ['#10B981', '#F59E0B'],
            borderRadius: 6,
            barPercentage: 0.48,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0B1930',
            borderColor: '#25416E',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#CBD5E1', font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(37, 65, 110, 0.35)' },
            ticks: { color: '#94A3B8', stepSize: 1, font: { size: 11 } },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [d1Count, d2Count]);

  return (
    <div className="relative h-44 w-full" data-testid="chart-d1-d2">
      <canvas ref={canvasRef} aria-label="Grafik Korelasi Penyebab Langsung Kode D1 vs Kode D2" />
    </div>
  );
};

interface BodyPartHorizontalBarProps {
  labels: string[];
  counts: number[];
}

export const BodyPartHorizontalBarChart: React.FC<BodyPartHorizontalBarProps> = ({
  labels,
  counts,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['Tidak Ada Data'],
        datasets: [
          {
            label: 'Jumlah Kasus',
            data: counts.length > 0 ? counts : [0],
            backgroundColor: '#38BDF8',
            borderRadius: 5,
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0B1930',
            borderColor: '#25416E',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: 'rgba(37, 65, 110, 0.35)' },
            ticks: { color: '#94A3B8', stepSize: 1, font: { size: 11 } },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#CBD5E1', font: { size: 11 } },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [labels, counts]);

  return (
    <div className="relative h-44 w-full" data-testid="chart-body-parts">
      <canvas ref={canvasRef} aria-label="Grafik Distribusi Bagian Tubuh yang Cidera" />
    </div>
  );
};
