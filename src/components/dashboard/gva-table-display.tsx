"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GvaIndustrialDivision } from '@/types';

interface GvaTableDisplayProps {
  data: GvaIndustrialDivision[];
  years: string[];
  divisions: string[];
}

export default function GvaTableDisplay({ data, years, divisions }: GvaTableDisplayProps) {
  if (!data.length || !years.length || !divisions.length) {
    return <p className="text-muted-foreground">No data to display in table. Please select years and divisions.</p>;
  }

  return (
    <ScrollArea className="h-[500px] border rounded-md">
      <Table>
        <TableHeader className="sticky top-0 bg-muted/50">
          <TableRow>
            <TableHead className="min-w-[120px]">Industrial Division</TableHead>
            {years.map(year => (
              <TableHead key={year} className="text-right min-w-[100px]">
                {year}
                {year.includes("R") && " (R)"}
                {year.includes("P") && " (P)"}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {divisions.map(divisionName => {
            const divisionData = data.find(d => d.name === divisionName);
            if (!divisionData) return null;

            return (
              <TableRow key={divisionName}>
                <TableCell className="font-medium">{divisionName}</TableCell>
                {years.map(year => {
                  const yearData = divisionData.data.find(yd => yd.gregorianYear === year);
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
