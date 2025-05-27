
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
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Cell, TooltipProps as RechartsTooltipProps, ReferenceLine, Label as RechartsLabel } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import type { ChartType, GvaIndustrialDivision } from '@/types';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface GvaChartDisplayProps {
  data: GvaIndustrialDivision[];
  chartType: ChartType;
  years: string[]; // For line chart: allGregorianYears. For bar chart: [selectedYear]
  highlightYear?: string; // The globally selected year from the slider, for highlighting
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
  "hsl(280, 60%, 60%)",
  "hsl(0, 70%, 60%)",
  "hsl(60, 70%, 45%)",
  "hsl(200, 75%, 55%)",
  "hsl(330, 70%, 60%)",
];

const sanitizeNameForKey = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_');
};

const abbreviateName = (name: string): string => {
  if (name.length <= 20) return name;
  const abbreviations: Record<string, string> = {
    "Agriculture, forestry and fishing": "Agri, Forest, Fish",
    "Mining and quarrying": "Mining & Quarrying",
    "Manufacturing": "Manufacturing",
    "Electricity and gas": "Electricity & Gas",
    "Water supply; sewerage and waste management": "Water & Waste Mgmt",
    "Construction": "Construction",
    "Wholesale and retail trade; repair of motor vehicles and motorcycles": "Wholesale/Retail Trade",
    "Transportation and storage": "Transport & Storage",
    "Accommodation and food service activities": "Accommodation & Food",
    "Information and communication": "Info & Comms",
    "Financial and insurance activities": "Finance & Insurance",
    "Real estate activities": "Real Estate",
    "Professional, scientific and technical activities": "Professional Services",
    "Administrative and support service activities": "Admin Services",
    "Public administration and defence; compulsory social security": "Public Admin & Defence",
    "Education": "Education",
    "Human health and social work activities": "Health & Social Work",
    "Other Services": "Other Services",
    "Total Agriculture, Forestry and Fishing": "Total Agri.",
    "Total Non-Agriculture": "Total Non-Agri.",
    "Gross Domestic Product (GDP) at basic prices": "GDP (Basic Prices)",
    "Taxes less subsidies on products": "Taxes less Subsidies",
    "Gross Domestic Product (GDP)": "Total GDP",
  };
  if (abbreviations[name]) return abbreviations[name];
  const words = name.split(' ');
  if (words.length > 2) {
    return words.slice(0, 2).map(w => w.substring(0, Math.min(w.length, 5))).join(' ') + (words.length > 2 ? '...' : '');
  }
  return name.substring(0, 18) + "...";
};


export default function GvaChartDisplay({ data, chartType, years, highlightYear }: GvaChartDisplayProps) {
  if (!data.length || !years.length) {
    return <p className="text-muted-foreground">No data to display. Please select divisions and ensure data exists.</p>;
  }

  const isSingleYearModeForBarChart = chartType === 'bar' && years.length === 1;
  const singleYearForBarChart = isSingleYearModeForBarChart ? years[0] : null;

  let chartData: any[];
  const activeChartConfig: ChartConfig = {};

  data.forEach((division, index) => {
    const saneKey = sanitizeNameForKey(division.name);
    activeChartConfig[saneKey] = {
      label: division.name,
      color: chartColors[index % chartColors.length],
    };
  });

  if (isSingleYearModeForBarChart && singleYearForBarChart) {
    chartData = data.map(division => {
      const yearDataEntry = division.data.find(d => d.gregorianYear === singleYearForBarChart);
      return {
        name: abbreviateName(division.name),
        originalName: division.name,
        saneKey: sanitizeNameForKey(division.name),
        value: yearDataEntry?.value ?? null,
      };
    });
  } else { // For line chart (multi-year)
    // `years` prop is allGregorianYears for line chart
    chartData = years.map(year => {
      const entry: { [key: string]: string | number | null } = { name: year.replace("/", "-") };
      data.forEach(division => { // `data` contains all selected divisions, each with all its year data
        const yearData = division.data.find(d => d.gregorianYear === year);
        entry[sanitizeNameForKey(division.name)] = yearData?.value ?? null;
      });
      return entry;
    });
  }

  const yAxisFormatter = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: RechartsTooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      let tooltipContentConfig = activeChartConfig;
      let tooltipLabel = label;

      if (isSingleYearModeForBarChart && payload[0]?.payload) {
        const itemPayload = payload[0].payload;
        const saneKeyForTooltip = itemPayload.saneKey;
        const fullLabelForTooltip = itemPayload.originalName;
        const colorForTooltip = payload[0].color || activeChartConfig[saneKeyForTooltip]?.color;
        
        tooltipLabel = fullLabelForTooltip;
        tooltipContentConfig = {
          'value': {
            label: fullLabelForTooltip,
            color: colorForTooltip,
          }
        };
      }

      return (
        <ChartTooltipContent
          className="w-[280px] rounded-md border bg-popover p-2 shadow-lg"
          label={tooltipLabel} 
          payload={payload.map(p => ({...p, value: p.value != null ? (p.value as number).toLocaleString() : "N/A" }))}
          config={tooltipContentConfig}
          indicator={chartType === 'line' ? 'line' : 'dot'}
        />
      );
    }
    return null;
  };
  
  const xAxisDataKey = "name"; 

  const legendPayload = Object.keys(activeChartConfig).map(saneKey => ({
    value: saneKey, // This should be the key used in data, Recharts legend will look up label in config
    type: 'square', 
    id: saneKey,
    color: activeChartConfig[saneKey]?.color
  }));

  const highlightYearFormatted = highlightYear ? highlightYear.replace("/", "-") : null;

  return (
    <ChartContainer config={activeChartConfig} className="min-h-[400px] w-full">
      {chartType === 'line' ? (
        <LineChart accessibilityLayer data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 70 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey={xAxisDataKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={'preserveStartEnd'} // Show ticks for all years, or adjust for many years
            tickFormatter={(value) => value.toString()}
          />
          <YAxis tickFormatter={yAxisFormatter} />
          <ChartTooltip content={<CustomTooltip />} />
          <ChartLegend content={<ChartLegendContent />} payload={legendPayload} wrapperStyle={{paddingTop: '20px'}} />
          {Object.keys(activeChartConfig).map(saneKey => (
            <Line
              key={saneKey}
              dataKey={saneKey}
              type="monotone"
              stroke={`var(--color-${saneKey})`}
              strokeWidth={2}
              dot={years.length <= 10} // Show dots if few years, adjust as needed
              activeDot={{ r: 6 }}
              connectNulls // Connect lines even if there are null values
            />
          ))}
          {highlightYearFormatted && (
            <ReferenceLine x={highlightYearFormatted} stroke="hsl(var(--accent))" strokeDasharray="4 4">
              <RechartsLabel 
                value={`Slider: ${highlightYearFormatted}`} 
                position="insideTopRight" 
                fill="hsl(var(--accent-foreground))" 
                fontSize={10}
                offset={10}
              />
            </ReferenceLine>
          )}
        </LineChart>
      ) : ( 
        <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 70 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey={xAxisDataKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tickFormatter={(value) => value.toString()}
          />
          <YAxis tickFormatter={yAxisFormatter} />
          <ChartTooltip content={<CustomTooltip />} />
          {/* Bar chart usually doesn't need a complex legend if colors are per bar category directly */}
          {/* However, if we want to show it, use legendPayload similar to line chart */}
          {/* <ChartLegend content={<ChartLegendContent />} payload={legendPayload} wrapperStyle={{paddingTop: '20px'}} /> */}
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`var(--color-${entry.saneKey})`} name={entry.originalName} />
            ))}
          </Bar>
        </BarChart>
      )}
      <ChartStyle id="gva-chart-style" config={activeChartConfig} />
    </ChartContainer>
  );
}
