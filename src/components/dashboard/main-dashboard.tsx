
"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, BarChart2, Download, LineChart as LineChartIcon, Loader2, Sparkles, TableIcon, Play, Pause } from 'lucide-react'; // Renamed LineChart import

import type { ChartType, GvaIndustrialDivision as GvaDivisionType } from '@/types';
import { gvaData, allGregorianYears, allIndustrialDivisions, getNumericYear } from '@/data/gva-data';
import { summarizeInsights, type SummarizeInsightsInput } from '@/ai/flows/summarize-insights';
import { useToast } from "@/hooks/use-toast";

import FiltersPanel from './filters-panel';
import GvaTableDisplay from './gva-table-display';
import GvaChartDisplay from './gva-chart-display';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const initialDivisions = allIndustrialDivisions.slice(0, 5); // Default to first 5 divisions

export default function MainDashboard() {
  const [selectedYear, setSelectedYear] = useState<string>(allGregorianYears[allGregorianYears.length - 1]);
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>(initialDivisions);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingAiSummary, setIsLoadingAiSummary] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const { toast } = useToast();

  // Animation for year slider
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (isPlaying) {
      intervalId = setInterval(() => {
        setSelectedYear(currentSelectedYear => {
          const currentIndex = allGregorianYears.indexOf(currentSelectedYear);
          const nextIndex = (currentIndex + 1) % allGregorianYears.length;
          return allGregorianYears[nextIndex];
        });
      }, 1500); // Change year every 1.5 seconds
    } else {
      clearInterval(intervalId);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying]);

  // Data filtered by selectedYear and selectedDivisions (for Table, AI, CSV)
  const singleYearFilteredData = useMemo((): GvaDivisionType[] => {
    if (!selectedDivisions.length || !selectedYear) {
      return [];
    }
    return gvaData
      .filter(division => selectedDivisions.includes(division.name))
      .map(division => ({
        ...division,
        data: division.data.filter(yearData => yearData.gregorianYear === selectedYear),
      }))
      .filter(division => division.data.length > 0);
  }, [selectedYear, selectedDivisions]);

  // Data for the chart display (multi-year for line, single-year for bar)
  const chartDisplayData = useMemo((): GvaDivisionType[] => {
    if (!selectedDivisions.length) {
      return [];
    }
    if (chartType === 'line') {
      // For line chart, include all years for selected divisions
      return gvaData
        .filter(division => selectedDivisions.includes(division.name))
        .map(division => ({
          ...division,
          // Ensure data array contains all years for this division
          data: division.data.map(d => ({...d})),
        }));
    } else {
      // For bar chart, use the singleYearFilteredData logic
      if (!selectedYear) return [];
      return gvaData
        .filter(division => selectedDivisions.includes(division.name))
        .map(division => ({
          ...division,
          data: division.data.filter(yearData => yearData.gregorianYear === selectedYear),
        }))
        .filter(division => division.data.length > 0);
    }
  }, [selectedDivisions, chartType, selectedYear]);
  
  const yearsForChart = useMemo(() => {
    return chartType === 'line' ? allGregorianYears : [selectedYear];
  }, [chartType, selectedYear]);


  const handleGenerateInsights = useCallback(async () => {
    if (!singleYearFilteredData.length || !selectedYear || !selectedDivisions.length) {
      toast({
        title: "Cannot generate insights",
        description: "Please select a year and at least one industrial division.",
        variant: "destructive",
      });
      return;
    }
    setIsLoadingAiSummary(true);
    setAiSummary(null);
    try {
      const aiInput: SummarizeInsightsInput = {
        years: [getNumericYear(selectedYear)],
        industrialDivisions: selectedDivisions,
        data: JSON.stringify(singleYearFilteredData.map(div => ({ // Use singleYearFilteredData
          name: div.name,
          nsic: div.nsic,
          values: div.data.map(d => ({ year: getNumericYear(d.gregorianYear), value: d.value }))
        }))),
      };
      const result = await summarizeInsights(aiInput);
      setAiSummary(result.summary);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      setAiSummary("Failed to generate insights. Please try again.");
      toast({
        title: "AI Insights Error",
        description: "There was an error generating insights. Check console for details.",
        variant: "destructive",
      });
    }
    setIsLoadingAiSummary(false);
  }, [singleYearFilteredData, selectedYear, selectedDivisions, toast]);

  const handleExportCsv = useCallback(() => {
    if (!singleYearFilteredData.length || !selectedYear) { // Use singleYearFilteredData
      toast({ title: "No data to export", description: "Please select data to export.", variant: "destructive" });
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    const yearLabel = selectedYear.replace("/", "-");
    const headers = ["Industrial Division", `GVA (${yearLabel})`];
    csvContent += headers.join(",") + "\r\n";

    singleYearFilteredData.forEach(division => { // Use singleYearFilteredData
      const yearDataEntry = division.data[0]; // Data is already filtered for the single selected year
      const value = yearDataEntry?.value?.toString() || "";
      const row = [division.name, value];
      csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gva_data_${yearLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: `Data for ${yearLabel} exported.` });
  }, [singleYearFilteredData, selectedYear, toast]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };


  return (
    <div className="flex min-h-screen w-full">
      <Sidebar collapsible="icon" className="bg-card border-r">
        <SidebarHeader className="p-4 border-b">
          <div className="flex items-center gap-2">
             <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                <rect width="100" height="100" rx="15" fill="currentColor"/>
                <path d="M20 75L35 50L50 65L65 40L80 60" stroke="hsl(var(--primary-foreground))" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            <h1 className="text-xl font-semibold group-data-[collapsible=icon]:hidden">Nepal GVA Visualizer</h1>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-0">
          <ScrollArea className="h-full">
            <FiltersPanel
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              availableYears={allGregorianYears}
              selectedDivisions={selectedDivisions}
              setSelectedDivisions={setSelectedDivisions}
              chartType={chartType}
              setChartType={setChartType}
              allDivisions={allIndustrialDivisions}
            />
          </ScrollArea>
        </SidebarContent>
         <SidebarFooter className="p-4 border-t">
            <Button onClick={togglePlayPause} variant="outline" size="sm" className="w-full group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0">
              {isPlaying ? <Pause className="h-4 w-4 group-data-[collapsible=icon]:size-4" /> : <Play className="h-4 w-4 group-data-[collapsible=icon]:size-4" />}
              <span className="ml-2 group-data-[collapsible=icon]:hidden">{isPlaying ? 'Pause' : 'Play Animation'}</span>
            </Button>
          </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex-1 flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
           <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            <h2 className="text-2xl font-semibold">Dashboard</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={viewMode === 'chart' ? 'secondary' : 'outline'} size="sm" onClick={() => setViewMode('chart')}>
              {chartType === 'line' ? <LineChartIcon className="h-4 w-4" /> : <BarChart2 className="h-4 w-4" />}
              <span className="ml-2">Chart</span>
            </Button>
            <Button variant={viewMode === 'table' ? 'secondary' : 'outline'} size="sm" onClick={() => setViewMode('table')}>
              <TableIcon className="h-4 w-4" />
              <span className="ml-2">Table</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="h-4 w-4" />
              <span className="ml-2">Export CSV</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              {chartDisplayData.length === 0 && selectedDivisions.length > 0 ? (
                 <Alert variant="default" className="border-accent">
                  <AlertCircle className="h-4 w-4 text-accent" />
                  <AlertTitle className="text-accent">No Data for Current Filters</AlertTitle>
                  <AlertDescription>
                    There is no data available for the current combination of filters. For bar charts, this might be due to no data for the selected year ({selectedYear.replace("/","-")}).
                  </AlertDescription>
                </Alert>
              ) : chartDisplayData.length === 0 ? (
                <Alert variant="default" className="border-accent">
                  <AlertCircle className="h-4 w-4 text-accent" />
                  <AlertTitle className="text-accent">No Data Selected</AlertTitle>
                  <AlertDescription>
                    Please select industrial divisions from the sidebar to view data.
                  </AlertDescription>
                </Alert>
              ) : viewMode === 'chart' ? (
                <GvaChartDisplay data={chartDisplayData} chartType={chartType} years={yearsForChart} />
              ) : (
                <GvaTableDisplay data={singleYearFilteredData} years={[selectedYear]} divisions={selectedDivisions} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>AI-Driven Insights</CardTitle>
              <Button onClick={handleGenerateInsights} disabled={isLoadingAiSummary}>
                {isLoadingAiSummary ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate Insights
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingAiSummary && <p className="text-muted-foreground">Generating insights, please wait...</p>}
              {aiSummary && (
                <Alert variant="default" className="bg-secondary">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary">Summary for {selectedYear.replace("/","-")}</AlertTitle>
                  <AlertDescription className="prose prose-sm max-w-none">
                    {aiSummary.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                  </AlertDescription>
                </Alert>
              )}
              {!isLoadingAiSummary && !aiSummary && (
                <p className="text-muted-foreground">Click the button above to generate AI-powered insights from the selected data (based on the year chosen in the slider).</p>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </div>
  );
}

    