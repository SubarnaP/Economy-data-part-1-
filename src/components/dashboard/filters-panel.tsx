"use client";

import React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChartType } from '@/types';
import { Button } from '../ui/button';

interface FiltersPanelProps {
  selectedYears: string[];
  setSelectedYears: Dispatch<SetStateAction<string[]>>;
  selectedDivisions: string[];
  setSelectedDivisions: Dispatch<SetStateAction<string[]>>;
  chartType: ChartType;
  setChartType: Dispatch<SetStateAction<ChartType>>;
  allYears: string[];
  allDivisions: string[];
}

export default function FiltersPanel({
  selectedYears,
  setSelectedYears,
  selectedDivisions,
  setSelectedDivisions,
  chartType,
  setChartType,
  allYears,
  allDivisions,
}: FiltersPanelProps) {

  const handleYearChange = (year: string) => {
    setSelectedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const handleDivisionChange = (division: string) => {
    setSelectedDivisions(prev =>
      prev.includes(division) ? prev.filter(d => d !== division) : [...prev, division]
    );
  };

  const toggleAllYears = () => {
    if (selectedYears.length === allYears.length) {
      setSelectedYears([]);
    } else {
      setSelectedYears(allYears);
    }
  };

  const toggleAllDivisions = () => {
    if (selectedDivisions.length === allDivisions.length) {
      setSelectedDivisions([]);
    } else {
      setSelectedDivisions(allDivisions);
    }
  };

  return (
    <div className="p-4 space-y-6 group-data-[collapsible=icon]:p-2">
      <Accordion type="multiple" defaultValue={["years", "divisions", "chartType"]} className="w-full">
        <AccordionItem value="years">
          <AccordionTrigger className="text-sm font-medium group-data-[collapsible=icon]:text-xs group-data-[collapsible=icon]:py-2">Years</AccordionTrigger>
          <AccordionContent className="group-data-[collapsible=icon]:hidden">
            <Button variant="link" size="sm" onClick={toggleAllYears} className="px-0 mb-2 h-auto py-1">
              {selectedYears.length === allYears.length ? "Deselect All" : "Select All"}
            </Button>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {allYears.map(year => (
                  <div key={year} className="flex items-center space-x-2">
                    <Checkbox
                      id={`year-${year}`}
                      checked={selectedYears.includes(year)}
                      onCheckedChange={() => handleYearChange(year)}
                    />
                    <Label htmlFor={`year-${year}`} className="text-xs font-normal">
                      {year}
                      {year.includes("R") && " (Revised)"}
                      {year.includes("P") && " (Preliminary)"}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="divisions">
          <AccordionTrigger className="text-sm font-medium group-data-[collapsible=icon]:text-xs group-data-[collapsible=icon]:py-2">Industrial Divisions</AccordionTrigger>
          <AccordionContent className="group-data-[collapsible=icon]:hidden">
             <Button variant="link" size="sm" onClick={toggleAllDivisions} className="px-0 mb-2 h-auto py-1">
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
                <Label htmlFor="line-chart" className="text-xs font-normal">Line Chart</Label>
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
