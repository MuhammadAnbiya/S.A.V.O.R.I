'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { POSTransaction, parsePOSDate } from './csv-parser';

export type TimeFilterType = 'all' | '7days' | '30days' | 'thismonth';

interface CSVContextType {
  rawData: POSTransaction[];
  data: POSTransaction[]; // Filtered data
  setData: (data: POSTransaction[]) => void;
  fileName: string | null;
  setFileName: (name: string | null) => void;
  clearData: () => void;
  timeFilter: TimeFilterType;
  setTimeFilter: (filter: TimeFilterType) => void;
  selectedOutlet: string;
  setSelectedOutlet: (outlet: string) => void;
  outlets: string[];
}

const CSVContext = createContext<CSVContextType | undefined>(undefined);

export function CSVProvider({ children }: { children: ReactNode }) {
  const [rawData, setRawData] = useState<POSTransaction[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('all');
  const [selectedOutlet, setSelectedOutlet] = useState<string>('all');

  const setData = (newData: POSTransaction[]) => {
    setRawData(newData);
    setSelectedOutlet('all'); // reset when new file uploaded
  };

  const clearData = () => {
    setRawData([]);
    setFileName(null);
    setTimeFilter('all');
    setSelectedOutlet('all');
  };

  // Get unique list of outlets
  const outlets = useMemo(() => {
    const set = new Set<string>();
    rawData.forEach(row => {
      if (row.lokasi) {
        set.add(row.lokasi);
      }
    });
    return Array.from(set);
  }, [rawData]);

  // Compute latest transaction date to filter relative to it
  const latestDate = useMemo<Date | null>(() => {
    if (rawData.length === 0) return null;
    let maxTime = 0;
    let maxDateObj: Date | null = null;

    rawData.forEach(row => {
      if (row.tanggalPenjualan) {
        const dObj = parsePOSDate(row.tanggalPenjualan);
        if (dObj && dObj.getTime() > maxTime) {
          maxTime = dObj.getTime();
          maxDateObj = dObj;
        }
      }
    });

    return maxDateObj;
  }, [rawData]);

  // Filtered data based on timeFilter AND selectedOutlet
  const data = useMemo(() => {
    if (rawData.length === 0) return rawData;

    let filtered = rawData;

    // Apply outlet filter
    if (selectedOutlet !== 'all') {
      filtered = filtered.filter(row => row.lokasi === selectedOutlet);
    }

    // Apply time filter
    if (timeFilter === 'all' || !latestDate) {
      return filtered;
    }

    const latestTime = (latestDate as Date).getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    return filtered.filter(row => {
      if (!row.tanggalPenjualan) return false;
      const dObj = parsePOSDate(row.tanggalPenjualan);
      if (!dObj) return false;

      const rowTime = dObj.getTime();
      const diffDays = (latestTime - rowTime) / oneDay;

      if (timeFilter === '7days') {
        return diffDays >= 0 && diffDays <= 7;
      }

      if (timeFilter === '30days') {
        return diffDays >= 0 && diffDays <= 30;
      }

      if (timeFilter === 'thismonth') {
        return dObj.getFullYear() === (latestDate as Date).getFullYear() && 
               dObj.getMonth() === (latestDate as Date).getMonth();
      }

      return true;
    });
  }, [rawData, timeFilter, selectedOutlet, latestDate]);

  return (
    <CSVContext.Provider value={{ 
      rawData, 
      data, 
      setData, 
      fileName, 
      setFileName, 
      clearData,
      timeFilter,
      setTimeFilter,
      selectedOutlet,
      setSelectedOutlet,
      outlets
    }}>
      {children}
    </CSVContext.Provider>
  );
}

export function useCSVData() {
  const context = useContext(CSVContext);
  if (context === undefined) {
    throw new Error('useCSVData must be used within a CSVProvider');
  }
  return context;
}
