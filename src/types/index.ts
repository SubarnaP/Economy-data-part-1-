import type { GvaIndustrialDivision as RawGvaIndustrialDivision, GvaYearValue as RawGvaYearValue } from '@/data/gva-data';

export interface GvaYearValue extends RawGvaYearValue {}
export interface GvaIndustrialDivision extends RawGvaIndustrialDivision {}

export type ChartType = 'line' | 'bar';

export interface FilterState {
  selectedYears: string[];
  selectedDivisions: string[];
  chartType: ChartType;
}
