
"use client";

import React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import type { ChartType } from '@/types';
import { Button } from '../ui/button';
import { gvaData } from '@/data/gva-data'; // Import to get R/P status

interface FiltersPanelProps {
  selectedYear: string;
  setSelectedYear: Dispatch<SetStateAction<string>>;
  availableYears: string[];
  selectedDivisions: string[];
  setSelectedDivisions: Dispatch<SetStateAction<string[]>>;
  chartType: ChartType;
  setChartType: Dispatch<SetStateAction<ChartType>>;
  allDivisions: string[];
}

export default function FiltersPanel({
  selectedYear,
  setSelectedYear,
  availableYears,
  selectedDivisions,
  setSelectedDivisions,
  chartType,
  setChartType,
  allDivisions,
}: FiltersPanelProps) {

  const handleDivisionChange = (division: string) => {
    setSelectedDivisions(prev =>
      prev.includes(division) ? prev.filter(d => d !== division) : [...prev, division]
    );
  };

  const toggleAllDivisions = () => {
    if (selectedDivisions.length === allDivisions.length) {
      setSelectedDivisions([]);
    } else {
      setSelectedDivisions(allDivisions);
    }
  };

  const currentYearIndex = availableYears.indexOf(selectedYear);

  const handleSliderChange = (value: number[]) => {
    setSelectedYear(availableYears[value[0]]);
  };

  const getYearLabel = (yearString: string) => {
    if (!yearString) return "";
    const yearMetaData = gvaData[0]?.data.find(d => d.gregorianYear === yearString);
    let label = yearString.replace("/", "-");
    if (yearMetaData?.isRevised) label += " (R)";
    if (yearMetaData?.isPreliminary) label += " (P)";
    return label;
  };

  return (
    <div className="p-4 space-y-6 group-data-[collapsible=icon]:p-2">
      <Accordion type="multiple" defaultValue={["year-selection", "divisions", "chartType"]} className="w-full">
        <AccordionItem value="year-selection">
          <AccordionTrigger className="text-sm font-medium group-data-[collapsible=icon]:text-xs group-data-[collapsible=icon]:py-2">Select Year</AccordionTrigger>
          <AccordionContent className="group-data-[collapsible=icon]:hidden">
            <div className="p-2 space-y-4">
              <div className="text-center font-medium text-sm">
                {getYearLabel(selectedYear)}
              </div>
              {availableYears.length > 0 && currentYearIndex !== -1 ? (
                <Slider
                  value={[currentYearIndex]}
                  onValueChange={handleSliderChange}
                  max={availableYears.length - 1}
                  step={1}
                  className="w-full my-4"
                  aria-label="Year Selector"
                />
              ) : (
                 <p className="text-xs text-muted-foreground">No years available for selection.</p>
              )}
              {availableYears.length > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{getYearLabel(availableYears[0])}</span>
                  <span>{getYearLabel(availableYears[availableYears.length - 1])}</span>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="divisions">
          <AccordionTrigger className="text-sm font-medium group-data-[collapsible=icon]:text-xs group-data-[collapsible=icon]:py-2">Industrial Divisions</AccordionTrigger>
          <AccordionContent className="group-data-[collapsible=icon]:hidden">
             <Button variant="link" size="sm" onClick={toggleAllDivisions} className="px-0 mb-2 h-auto py-1 text-xs">
              {selectedDivisions.length === allDivisions.length ? "Deselect All" : "Select All"}
            </Button>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {allDivisions.map(division => (
                  <div key={division} className="flex items-center space-x-2">
                    <Checkbox
                      id={`division-${division.replace(/\W/g, '')}`} // Sanitize ID
                      checked={selectedDivisions.includes(division)}
                      onCheckedChange={() => handleDivisionChange(division)}
                      aria-label={`Select division ${division}`}
                    />
                    <Label htmlFor={`division-${division.replace(/\W/g, '')}`} className="text-xs font-normal">
                      {division}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="chartType">
          <AccordionTrigger className="text-sm font-medium group-data-[collapsible=icon]:text-xs group-data-[collapsible=icon]:py-2">Chart Type</AccordionTrigger>
          <AccordionContent className="group-data-[collapsible=icon]:hidden">
            <RadioGroup value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="line" id="line-chart" />
                <Label htmlFor="line-chart" className="text-xs font-normal">Interactive Time Series Chart</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bar" id="bar-chart" />
                <Label htmlFor="bar-chart" className="text-xs font-normal">Bar Chart</Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
