
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
  data: GvaIndustrialDivision[]; // Data is pre-filtered for selected divisions AND selected year(s)
  chartType: ChartType;
  years: string[]; // Will typically be a single year array like ["2022/23"]
}

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(220, 70%, 50%)",
  "hsl(160, 60%, 45%)",
  "hsl(30, 80%, 55%)",
];


export default function GvaChartDisplay({ data, chartType, years }: GvaChartDisplayProps) {
  if (!data.length || !years.length) {
    return <p className="text-muted-foreground">No data to display in chart. Please select a year and divisions.</p>;
  }

  // If only one year is selected and chartType is 'bar', transform data for better bar chart display
  // X-axis: Divisions, Y-axis: Value
  // `data` prop already contains GvaIndustrialDivision items, each with a `data` array
  // that should contain at most one GvaYearValue entry (for the selected year).
  const isSingleYear = years.length === 1;
  const singleYear = isSingleYear ? years[0] : null;

  let chartData;
  let chartConfig: ChartConfig = {};

  if (isSingleYear && chartType === 'bar') {
    chartData = data.map(division => {
      const yearDataEntry = division.data.find(d => d.gregorianYear === singleYear);
      return {
        name: division.name, // Division name for X-axis
        value: yearDataEntry?.value ?? null,
      };
    });
    // Config for single year bar chart (each bar is a division)
    data.forEach((division, index) => {
      chartConfig[division.name] = {
        label: division.name,
        color: chartColors[index % chartColors.length],
      };
    });

  } else { // For line chart or multi-year bar chart (or single year line chart)
    chartData = years.map(year => {
      const entry: { [key: string]: string | number | null } = { name: year.replace("/", "-") };
      data.forEach(division => {
        // division.data here is already filtered to the selected year(s)
        const yearData = division.data.find(d => d.gregorianYear === year);
        entry[division.name] = yearData?.value ?? null;
      });
      return entry;
    });
    // Config for multi-item series (each line/bar group member is a division)
    data.forEach((division, index) => {
      chartConfig[division.name] = {
        label: division.name,
        color: chartColors[index % chartColors.length],
      };
    });
  }


  const yAxisFormatter = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: RechartsTooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      let tooltipConfig = chartConfig;
      // For single year bar chart, the payload 'name' is the division name, which is the key in chartConfig.
      // For other charts, payload 'name' is the division name, also key in chartConfig.
      // The `label` is the x-axis value (year or division name).
      // Payload items are series.
      
      // If single year bar chart, payload is simpler: [{ name: 'value', value: 123, ...rest of payload for that division }]
      // The `label` is the division name.
      // We need to map this back to a config that ChartTooltipContent understands.
      if (isSingleYear && chartType === 'bar') {
        // `label` is the division name.
        // `payload[0].name` is 'value'.
        // We need to provide a config where the key matches payload[0].name or payload[0].dataKey
        const currentDivisionConfig = chartConfig[label as string]; // label is division name
        if (currentDivisionConfig) {
           tooltipConfig = {
             'value': { // dataKey for the bar
               label: label as string, // Division name
               color: currentDivisionConfig.color,
             }
           }
        }
      }


      return (
        <ChartTooltipContent
          className="w-[250px] rounded-md border bg-popover p-2 shadow-lg"
          label={label} // Year (for line/multi-year-bar) or Division Name (for single-year-bar)
          payload={payload.map(p => ({...p, value: p.value != null ? (p.value as number).toLocaleString() : "N/A" }))}
          config={tooltipConfig}
          indicator={chartType === 'line' ? 'line' : 'dot'}
        />
      );
    }
    return null;
  };
  
  // Determine XAxis dataKey based on chart configuration
  const xAxisDataKey = (isSingleYear && chartType === 'bar') ? "name" : "name"; // "name" is division for single-year-bar, year for others

  return (
    <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
      {chartType === 'line' ? (
        // Line chart for single year will show points for each division at that year.
        // Or trends if multiple years are passed (not the case with slider)
        <LineChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 50 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey={xAxisDataKey} // Year
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
          {/* If single year line chart, `data` contains selected divisions.
              `chartData` is [{name: 'year', DivA: val, DivB: val}]
              So, map through `data` (selected divisions) to create lines.
          */}
          {data.map(division => (
            <Line
              key={division.name}
              dataKey={division.name} // This corresponds to keys in chartData objects
              type="monotone"
              stroke={`var(--color-${division.name})`}
              strokeWidth={2}
              dot={isSingleYear} // Show dots if single year, otherwise lines might be too busy with dots
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      ) : ( // Bar Chart
        <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 50 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey={xAxisDataKey} // Division name for single-year-bar, Year for multi-year-bar
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
          {isSingleYear && chartType === 'bar' ? (
            // Single bar for each division. `chartData` is [{name: Division, value: GVA}]
            // `chartConfig` keys are division names. We need one <Bar> component.
            // This assumes recharts can use the color from chartConfig based on the 'name' field if fill is not explicitly set by dataKey.
            // Better to map through divisions and assign fill.
            // No, for this structure, a single <Bar dataKey="value" /> is enough if fill is handled by config.
            // Recharts <Bar> does not automatically pick color from config based on `name` of data item.
            // It uses the `fill` prop or color from `chartConfig` if `dataKey` matches a config key.
            // So, we need one bar with dataKey "value" and iterate for different fills if we want different colors per bar (division).
            // This is not how it works. For distinct bars, each needs its own <Bar> or use grouped bars.
            // The current structure {name: Division, value: GVA}, allows a single <Bar dataKey="value">.
            // To color each bar differently, we'd need to customize the <Bar> component's `fill` or use cells.
            // Let's use individual <Bar> components for each division for single year bar chart.
            data.map(division => (
               <Bar
                key={division.name}
                dataKey="value" // This will pick 'value' from chartData where name === division.name
                name={division.name} // Important for tooltip and legend linkage
                fill={`var(--color-${division.name})`}
                radius={[4, 4, 0, 0]}
              />
            ))
          ) : (
            // Grouped bar chart (X-axis is year, each bar in group is a division)
            data.map(division => (
              <Bar
                key={division.name}
                dataKey={division.name} // This corresponds to keys in chartData objects
                fill={`var(--color-${division.name})`}
                radius={[4, 4, 0, 0]}
              />
            ))
          )}
        </BarChart>
      )}
      <ChartStyle id="gva-chart-style" config={chartConfig} />
    </ChartContainer>
  );
}
