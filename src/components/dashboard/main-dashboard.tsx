"use client";

import React, { useState, useMemo, useCallback } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, BarChart2, Download, LineChart, Loader2, Sparkles, TableIcon } from 'lucide-react';

import type { ChartType, GvaIndustrialDivision as GvaDivisionType, GvaYearValue } from '@/types';
import { gvaData as allGvaData, allGregorianYears, allIndustrialDivisions, getNumericYear } from '@/data/gva-data';
import { summarizeInsights, type SummarizeInsightsInput } from '@/ai/flows/summarize-insights';
import { useToast } from "@/hooks/use-toast";

import FiltersPanel from './filters-panel';
import GvaTableDisplay from './gva-table-display';
import GvaChartDisplay from './gva-chart-display';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const initialYears = allGregorianYears.slice(-5); // Default to last 5 years
const initialDivisions = allIndustrialDivisions.slice(0, 5); // Default to first 5 divisions

export default function MainDashboard() {
  const [selectedYears, setSelectedYears] = useState<string[]>(initialYears);
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>(initialDivisions);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingAiSummary, setIsLoadingAiSummary] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const { toast } = useToast();

  const filteredData = useMemo((): GvaDivisionType[] => {
    if (!selectedDivisions.length || !selectedYears.length) {
      return [];
    }
    return allGvaData
      .filter(division => selectedDivisions.includes(division.name))
      .map(division => ({
        ...division,
        data: division.data.filter(yearData => selectedYears.includes(yearData.gregorianYear)),
      }));
  }, [selectedYears, selectedDivisions]);

  const handleGenerateInsights = useCallback(async () => {
    if (!filteredData.length || !selectedYears.length || !selectedDivisions.length) {
      toast({
        title: "Cannot generate insights",
        description: "Please select at least one year and one industrial division.",
        variant: "destructive",
      });
      return;
    }
    setIsLoadingAiSummary(true);
    setAiSummary(null);
    try {
      const aiInput: SummarizeInsightsInput = {
        years: selectedYears.map(getNumericYear),
        industrialDivisions: selectedDivisions,
        data: JSON.stringify(filteredData.map(div => ({
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
  }, [filteredData, selectedYears, selectedDivisions, toast]);

  const handleExportCsv = useCallback(() => {
    if (!filteredData.length) {
      toast({ title: "No data to export", description: "Please select data to export.", variant: "destructive" });
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    // Headers: Year, Division1, Division2, ...
    const headers = ["Year", ...selectedDivisions];
    csvContent += headers.join(",") + "\r\n";

    // Data rows
    selectedYears.forEach(year => {
      const row = [year];
      selectedDivisions.forEach(divisionName => {
        const division = filteredData.find(d => d.name === divisionName);
        const yearData = division?.data.find(d => d.gregorianYear === year);
        row.push(yearData?.value?.toString() || "");
      });
      csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "gva_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Data exported as gva_data.csv" });
  }, [filteredData, selectedYears, selectedDivisions, toast]);


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
              selectedYears={selectedYears}
              setSelectedYears={setSelectedYears}
              selectedDivisions={selectedDivisions}
              setSelectedDivisions={setSelectedDivisions}
              chartType={chartType}
              setChartType={setChartType}
              allYears={allGregorianYears}
              allDivisions={allIndustrialDivisions}
            />
          </ScrollArea>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="flex-1 flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
           <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            <h2 className="text-2xl font-semibold">Dashboard</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={viewMode === 'chart' ? 'secondary' : 'outline'} size="sm" onClick={() => setViewMode('chart')}>
              {chartType === 'line' ? <LineChart className="h-4 w-4" /> : <BarChart2 className="h-4 w-4" />}
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
              {filteredData.length === 0 ? (
                <Alert variant="default" className="border-accent">
                  <AlertCircle className="h-4 w-4 text-accent" />
                  <AlertTitle className="text-accent">No Data Selected</AlertTitle>
                  <AlertDescription>
                    Please select years and industrial divisions from the sidebar to view data.
                  </AlertDescription>
                </Alert>
              ) : viewMode === 'chart' ? (
                <GvaChartDisplay data={filteredData} chartType={chartType} years={selectedYears} />
              ) : (
                <GvaTableDisplay data={filteredData} years={selectedYears} divisions={selectedDivisions} />
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
                  <AlertTitle className="text-primary">Summary</AlertTitle>
                  <AlertDescription className="prose prose-sm max-w-none">
                    {aiSummary.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                  </AlertDescription>
                </Alert>
              )}
              {!isLoadingAiSummary && !aiSummary && (
                <p className="text-muted-foreground">Click the button above to generate AI-powered insights from the selected data.</p>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </div>
  );
}
