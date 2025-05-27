
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
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Cell, TooltipProps as RechartsTooltipProps } from "recharts";
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
  "hsl(220, 70%, 50%)", // A distinct blue
  "hsl(160, 60%, 45%)", // A teal/green
  "hsl(30, 80%, 55%)",  // An orange
  "hsl(280, 60%, 60%)", // A purple
  "hsl(0, 70%, 60%)",   // A red
  "hsl(60, 70%, 45%)",  // A yellow/gold
  "hsl(200, 75%, 55%)", // Another blue
  "hsl(330, 70%, 60%)", // A pink/magenta
];

// Helper to sanitize names for use as data keys and CSS variable suffixes
const sanitizeNameForKey = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_');
};

// Helper to abbreviate long division names
const abbreviateName = (name: string): string => {
  if (name.length <= 20) return name; // Keep shorter names as is
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

  // Generic abbreviation: take first few letters of first few words
  const words = name.split(' ');
  if (words.length > 2) {
    return words.slice(0, 2).map(w => w.substring(0, Math.min(w.length, 5))).join(' ') + (words.length > 2 ? '...' : '');
  }
  return name.substring(0, 18) + "...";
};


export default function GvaChartDisplay({ data, chartType, years }: GvaChartDisplayProps) {
  if (!data.length || !years.length) {
    return <p className="text-muted-foreground">No data to display in chart. Please select a year and divisions.</p>;
  }

  const isSingleYear = years.length === 1;
  const singleYear = isSingleYear ? years[0] : null;

  let chartData: any[];
  const activeChartConfig: ChartConfig = {};

  data.forEach((division, index) => {
    const saneKey = sanitizeNameForKey(division.name);
    activeChartConfig[saneKey] = {
      label: division.name, // Full name for legend/tooltip label
      color: chartColors[index % chartColors.length],
    };
  });


  if (isSingleYear && chartType === 'bar') {
    chartData = data.map(division => {
      const yearDataEntry = division.data.find(d => d.gregorianYear === singleYear);
      return {
        name: abbreviateName(division.name), // Abbreviated for X-axis
        originalName: division.name,         // Full name for tooltips
        saneKey: sanitizeNameForKey(division.name), // Sanitized key for color/config lookup
        value: yearDataEntry?.value ?? null,
      };
    });
  } else { // For line chart or multi-year bar chart
    chartData = years.map(year => {
      const entry: { [key: string]: string | number | null } = { name: year.replace("/", "-") };
      data.forEach(division => {
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
      let tooltipContentConfig = activeChartConfig; // Default to global active config

      if (isSingleYear && chartType === 'bar' && payload[0]?.payload) {
        const itemPayload = payload[0].payload; // { name, originalName, saneKey, value, fill }
        const saneKeyForTooltip = itemPayload.saneKey;
        const fullLabelForTooltip = itemPayload.originalName;
        // item.color is the resolved color of the Cell from the chart payload
        const colorForTooltip = payload[0].color || activeChartConfig[saneKeyForTooltip]?.color;


        // Create a specific config for ChartTooltipContent for this item
        // The key 'value' must match the dataKey of the <Bar> component
        tooltipContentConfig = {
          'value': {
            label: fullLabelForTooltip, // Display full name in tooltip item list
            color: colorForTooltip,
          }
        };
      }
      // For line charts or multi-year bar charts, payload items will have dataKey set to saneKey
      // ChartTooltipContent will use activeChartConfig and correctly find config[saneKey]

      return (
        <ChartTooltipContent
          className="w-[280px] rounded-md border bg-popover p-2 shadow-lg"
          label={isSingleYear && chartType === 'bar' ? payload[0]?.payload?.originalName : label} // X-axis tick value or full name for single bar
          payload={payload.map(p => ({...p, value: p.value != null ? (p.value as number).toLocaleString() : "N/A" }))}
          config={tooltipContentConfig}
          indicator={chartType === 'line' ? 'line' : 'dot'}
        />
      );
    }
    return null;
  };
  
  const xAxisDataKey = "name"; // "name" is abbreviated division for single-year-bar, year for others

  const legendPayload = data.map(division => ({
    value: sanitizeNameForKey(division.name), // This is the key ChartLegendContent will use to lookup in activeChartConfig
    type: 'square', // Or 'line', 'circle' etc. as appropriate
    id: sanitizeNameForKey(division.name),
    color: activeChartConfig[sanitizeNameForKey(division.name)]?.color
  }));

  return (
    <ChartContainer config={activeChartConfig} className="min-h-[400px] w-full">
      {chartType === 'line' ? (
        <LineChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 70 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey={xAxisDataKey} // Year (YYYY-YY)
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            angle={-45}
            textAnchor="end"
            height={80} // Increased height for labels
            interval={0}
            tickFormatter={(value) => value.toString()}
          />
          <YAxis tickFormatter={yAxisFormatter} />
          <ChartTooltip content={<CustomTooltip />} />
          <ChartLegend content={<ChartLegendContent />} payload={legendPayload} wrapperStyle={{paddingTop: '20px'}} />
          {data.map(division => {
            const saneKey = sanitizeNameForKey(division.name);
            return (
              <Line
                key={saneKey}
                dataKey={saneKey}
                type="monotone"
                stroke={`var(--color-${saneKey})`}
                strokeWidth={2}
                dot={isSingleYear || years.length <= 5 } // Show dots if single year or few years
                activeDot={{ r: 6 }}
              />
            );
          })}
        </LineChart>
      ) : ( // Bar Chart
        <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 70 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey={xAxisDataKey} // Abbreviated Division name for single-year-bar, Year for multi-year-bar
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            angle={-45}
            textAnchor="end"
            height={80} // Increased height for labels
            interval={0}
            tickFormatter={(value) => value.toString()}
          />
          <YAxis tickFormatter={yAxisFormatter} />
          <ChartTooltip content={<CustomTooltip />} />
          <ChartLegend content={<ChartLegendContent />} payload={legendPayload} wrapperStyle={{paddingTop: '20px'}} />
          {isSingleYear && chartType === 'bar' ? (
            // Single <Bar> with <Cell> components for each division
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                 // entry.saneKey is the sanitized key for the division
                <Cell key={`cell-${index}`} fill={`var(--color-${entry.saneKey})`} name={entry.originalName} />
              ))}
            </Bar>
          ) : (
            // Grouped bar chart (X-axis is year, each bar in group is a division (identified by saneKey))
            data.map(division => {
              const saneKey = sanitizeNameForKey(division.name);
              return (
                <Bar
                  key={saneKey}
                  dataKey={saneKey}
                  fill={`var(--color-${saneKey})`}
                  radius={[4, 4, 0, 0]}
                />
              );
            })
          )}
        </BarChart>
      )}
      {/* ChartStyle component uses activeChartConfig to generate CSS color variables */}
      <ChartStyle id="gva-chart-style" config={activeChartConfig} />
    </ChartContainer>
  );
}

