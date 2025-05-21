"use client";

import React from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, TooltipProps as RechartsTooltipProps } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import type { ChartType, GvaIndustrialDivision } from '@/types';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface GvaChartDisplayProps {
  data: GvaIndustrialDivision[];
  chartType: ChartType;
  years: string[];
}

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))", 
  "hsl(var(--accent))",
  "hsl(220, 70%, 50%)", // Additional distinct colors
  "hsl(160, 60%, 45%)",
  "hsl(30, 80%, 55%)",
];


export default function GvaChartDisplay({ data, chartType, years }: GvaChartDisplayProps) {
  if (!data.length || !years.length) {
    return <p className="text-muted-foreground">No data to display in chart. Please select years and divisions.</p>;
  }

  const chartData = years.map(year => {
    const entry: { [key: string]: string | number | null } = { name: year.replace("/","-") }; // Use "YYYY-YY" format for XAxis
    data.forEach(division => {
      const yearData = division.data.find(d => d.gregorianYear === year);
      entry[division.name] = yearData?.value ?? null;
    });
    return entry;
  });

  const chartConfig = data.reduce((config, division, index) => {
    config[division.name] = {
      label: division.name,
      color: chartColors[index % chartColors.length],
    };
    return config;
  }, {} as ChartConfig);
  

  const yAxisFormatter = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };
  
  const CustomTooltip = ({ active, payload, label }: RechartsTooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <ChartTooltipContent
          className="w-[250px] rounded-md border bg-popover p-2 shadow-lg"
          label={label}
          payload={payload.map(p => ({...p, value: p.value != null ? (p.value as number).toLocaleString() : "N/A" }))}
          config={chartConfig}
          indicator={chartType === 'line' ? 'line' : 'dot'}
        />
      );
    }
    return null;
  };

  return (
    <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
      {chartType === 'line' ? (
        <LineChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 50 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0} 
            tickFormatter={(value) => value.toString()}
          />
          <YAxis tickFormatter={yAxisFormatter} />
          <ChartTooltip content={<CustomTooltip />} />
          <ChartLegend content={<ChartLegendContent wrapperStyle={{paddingTop: '20px'}} />} />
          {data.map(division => (
            <Line
              key={division.name}
              dataKey={division.name}
              type="monotone"
              stroke={`var(--color-${division.name})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      ) : (
        <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 50 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
            tickFormatter={(value) => value.toString()}
          />
          <YAxis tickFormatter={yAxisFormatter} />
          <ChartTooltip content={<CustomTooltip />} />
          <ChartLegend content={<ChartLegendContent wrapperStyle={{paddingTop: '20px'}}/>} />
          {data.map(division => (
            <Bar
              key={division.name}
              dataKey={division.name}
              fill={`var(--color-${division.name})`}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      )}
      <ChartStyle id="gva-chart-style" config={chartConfig} />
    </ChartContainer>
  );
}
