
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
  data: GvaIndustrialDivision[]; // Data is pre-filtered for selected divisions. For line chart, includes all years. For bar chart, single year.
  chartType: ChartType;
  years: string[]; // For line chart, all available years. For bar chart, single selected year array like ["2022/23"].
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
    return <p className="text-muted-foreground">No data to display in chart. Please select divisions and ensure data exists for the selected year (for bar chart) or any year (for line chart).</p>;
  }

  // For bar chart, 'years' will be a single element array. For line chart, it's all available years.
  const isSingleYearModeForBarChart = chartType === 'bar' && years.length === 1;
  const singleYearForBarChart = isSingleYearModeForBarChart ? years[0] : null;

  let chartData: any[];
  const activeChartConfig: ChartConfig = {};

  // Populate chartConfig based on the divisions present in `data`
  data.forEach((division, index) => {
    const saneKey = sanitizeNameForKey(division.name);
    activeChartConfig[saneKey] = {
      label: division.name, // Full name for legend/tooltip label
      color: chartColors[index % chartColors.length],
    };
  });


  if (isSingleYearModeForBarChart && singleYearForBarChart) {
    // Bar chart data: X-axis = division, Y-axis = value for that single year
    chartData = data.map(division => {
      // `division.data` for bar chart mode is already filtered to the single selected year in MainDashboard
      const yearDataEntry = division.data.find(d => d.gregorianYear === singleYearForBarChart);
      return {
        name: abbreviateName(division.name), // Abbreviated for X-axis
        originalName: division.name,         // Full name for tooltips
        saneKey: sanitizeNameForKey(division.name), // Sanitized key for color/config lookup
        value: yearDataEntry?.value ?? null,
      };
    });
  } else { // For line chart (multi-year)
    // Line chart data: X-axis = year, Y-axis = value, each line is a division
    chartData = years.map(year => { // `years` is allGregorianYears for line chart
      const entry: { [key: string]: string | number | null } = { name: year.replace("/", "-") }; // X-axis value is the year
      data.forEach(division => { // `data` contains all divisions, each with all its year data
        const yearData = division.data.find(d => d.gregorianYear === year);
        entry[sanitizeNameForKey(division.name)] = yearData?.value ?? null; // Each division becomes a key in the entry
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
        
        tooltipLabel = fullLabelForTooltip; // Main title of tooltip is the full division name

        tooltipContentConfig = {
          'value': { // 'value' matches the dataKey of the <Bar>
            label: fullLabelForTooltip, // This label is for the item in the list within the tooltip
            color: colorForTooltip,
          }
        };
      }
      // For line charts, 'label' is the year (X-axis tick value).
      // `payload` items will have `dataKey` set to `saneKey` of the division.
      // `ChartTooltipContent` will use `activeChartConfig` and find `config[saneKey]` for each line item.

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
  
  const xAxisDataKey = "name"; // "name" is abbreviated division for single-year-bar, or year for line chart

  const legendPayload = Object.keys(activeChartConfig).map(saneKey => ({
    value: saneKey,
    type: 'square', 
    id: saneKey,
    color: activeChartConfig[saneKey]?.color
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
            height={80}
            interval={0} // Show all year ticks for line chart if space allows, or adjust as needed
            tickFormatter={(value) => value.toString()}
          />
          <YAxis tickFormatter={yAxisFormatter} />
          <ChartTooltip content={<CustomTooltip />} />
          <ChartLegend content={<ChartLegendContent />} payload={legendPayload} wrapperStyle={{paddingTop: '20px'}} />
          {/* data for LineChart has one object per year, with keys for each division's value in that year */}
          {/* activeChartConfig keys are sanitized division names */}
          {Object.keys(activeChartConfig).map(saneKey => {
            return (
              <Line
                key={saneKey}
                dataKey={saneKey} // This saneKey must exist in each object of chartData for line chart
                type="monotone"
                stroke={`var(--color-${saneKey})`}
                strokeWidth={2}
                dot={years.length <= 5 } // Show dots if few years, consider for line chart with many years
                activeDot={{ r: 6 }}
              />
            );
          })}
        </LineChart>
      ) : ( // Bar Chart (assumed to be singleYearModeForBarChart)
        <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 70 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey={xAxisDataKey} // Abbreviated Division name for single-year-bar
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
          <ChartLegend content={<ChartLegendContent />} payload={legendPayload} wrapperStyle={{paddingTop: '20px'}} />
          {isSingleYearModeForBarChart ? (
            // Single <Bar> with <Cell> components for each division
            // chartData for single year bar chart has: { name (abbr), originalName, saneKey, value }
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`var(--color-${entry.saneKey})`} name={entry.originalName} />
              ))}
            </Bar>
          ) : (
            // This case (multi-year bar chart) is not explicitly handled by current UI,
            // but if data were structured for it, it would be:
            Object.keys(activeChartConfig).map(saneKey => {
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
      <ChartStyle id="gva-chart-style" config={activeChartConfig} />
    </ChartContainer>
  );
}

    