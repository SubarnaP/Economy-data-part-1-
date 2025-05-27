
"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GvaIndustrialDivision } from '@/types';
import { gvaData } from '@/data/gva-data'; // For R/P labels

interface GvaTableDisplayProps {
  data: GvaIndustrialDivision[]; // Data is pre-filtered for selected divisions AND selected year(s)
  years: string[]; // Will typically be a single year array like ["2022/23"]
  divisions: string[]; // All selected divisions by name
}

export default function GvaTableDisplay({ data, years, divisions }: GvaTableDisplayProps) {
  if (!data.length || !years.length || !divisions.length) {
    return <p className="text-muted-foreground">No data to display in table. Please select a year and divisions.</p>;
  }

  const getYearLabelWithStatus = (yearString: string) => {
    if (!yearString) return "";
    // Find an example year entry to get its R/P status
    // Assuming gvaData is available and has at least one division with data
    const yearMetaData = gvaData[0]?.data.find(d => d.gregorianYear === yearString);
    let label = yearString.replace("/", "-");
    if (yearMetaData?.isRevised) label += " (R)";
    if (yearMetaData?.isPreliminary) label += " (P)";
    return label;
  };

  return (
    <ScrollArea className="h-[500px] border rounded-md">
      <Table>
        <TableHeader className="sticky top-0 bg-muted/50">
          <TableRow>
            <TableHead className="min-w-[200px] font-semibold">Industrial Division</TableHead>
            {years.map(year => (
              <TableHead key={year} className="text-right min-w-[120px] font-semibold">
                {getYearLabelWithStatus(year)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {divisions.map(divisionName => {
            // Find the division data from the `data` prop (which is already filtered)
            const divisionData = data.find(d => d.name === divisionName);
            
            // If divisionData is not found in the filtered `data` prop,
            // it means this division has no data for the selected year(s).
            // We still render a row for it but show '-' for values.
            // This ensures all selected divisions appear in the table.

            return (
              <TableRow key={divisionName}>
                <TableCell className="font-medium">{divisionName}</TableCell>
                {years.map(year => {
                  // divisionData.data should contain at most one entry for the current `year`
                  // because `data` prop is filtered for selected year(s)
                  const yearData = divisionData?.data.find(yd => yd.gregorianYear === year);
                  return (
                    <TableCell key={`${divisionName}-${year}`} className="text-right">
                      {yearData?.value != null ? yearData.value.toLocaleString() : '-'}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

