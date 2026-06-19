import Papa from 'papaparse';

export interface POSTransaction {
  lokasi: string;
  noTandaTerima: string;
  noPenjualan: string;
  tanggalPenjualan: string;
  waktuPenjualan: string;
  tipePesanan: string;
  jumlahBersih: number;
  biayaLayanan: number;
  totalPajak: number;
  totalPembulatan: number;
  totalPenjualan: number;
}

// Robust date parser for Indonesian POS format (DD/MM/YYYY)
export function parsePOSDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Clean the string
  const cleanStr = dateStr.trim();
  
  // Check for DD/MM/YYYY or DD-MM-YYYY
  const parts = cleanStr.split(/[\/\-]/);
  if (parts.length >= 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    // Handle cases where year part has time attached e.g. "2025 14:30"
    const y = parseInt(parts[2].split(' ')[0], 10);
    
    const dateObj = new Date(y, m, d);
    if (!isNaN(dateObj.getTime())) {
       return dateObj;
    }
  }
  
  // Fallback to standard parse if not slash/dash separated in expected way
  const fallback = new Date(cleanStr);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function parseAndCleanCSV(file: File): Promise<POSTransaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false, // We'll handle headers manually due to metadata
      skipEmptyLines: 'greedy', // Skip completely empty lines
      complete: (results) => {
        try {
          const data = results.data as string[][];
          
          if (!data || data.length === 0) {
            resolve([]);
            return;
          }

          // 1. Find the actual header row. POS exports often have metadata at the top.
          let headerIdx = -1;
          for (let i = 0; i < Math.min(20, data.length); i++) {
             const rowString = data[i].join(' ').toLowerCase();
             if (rowString.includes('lokasi') && (rowString.includes('penjualan') || rowString.includes('tanda terima'))) {
                 headerIdx = i;
                 break;
             }
          }

          if (headerIdx === -1) {
            // Fallback: just use the first row that has more than 3 columns
            for (let i = 0; i < Math.min(20, data.length); i++) {
              if (data[i].length > 3) {
                headerIdx = i;
                break;
              }
            }
          }
          
          if (headerIdx === -1) {
            resolve([]);
            return;
          }

          const headers = data[headerIdx].map(h => h.trim().toLowerCase());
          
          // Map header strings to property names
          // We need to be somewhat flexible as column names might slightly differ
          const getColIdx = (aliases: string[]) => {
            return headers.findIndex(h => aliases.some(alias => h.includes(alias)));
          };

          const colMap = {
            lokasi: getColIdx(['lokasi']),
            noTandaTerima: getColIdx(['tanda terima']),
            noPenjualan: getColIdx(['no. penjualan', 'penjualan']),
            tanggalPenjualan: getColIdx(['tanggal']),
            waktuPenjualan: getColIdx(['waktu']),
            tipePesanan: getColIdx(['tipe', 'pesanan']),
            jumlahBersih: getColIdx(['jumlah bersih']),
            biayaLayanan: getColIdx(['biaya layanan', 'layanan']),
            totalPajak: getColIdx(['pajak']),
            totalPembulatan: getColIdx(['pembulatan']),
            totalPenjualan: getColIdx(['total penjualan', 'grand total', 'netto'])
          };

          const parsedData: POSTransaction[] = [];

          // 2. Process data rows
          for (let i = headerIdx + 1; i < data.length; i++) {
            const row = data[i];
            
            // Skip if the row doesn't have enough data
            if (row.length < headers.length - 2) continue;
            
            const getValue = (idx: number) => idx !== -1 && row[idx] ? row[idx].trim() : '';
            const getNum = (idx: number) => {
               if (idx === -1) return 0;
               const val = row[idx];
               if (!val) return 0;
               // Remove any non-numeric characters except minus sign
               const cleaned = val.replace(/[^0-9-]/g, '');
               return parseInt(cleaned, 10) || 0;
            };

            const lokasi = getValue(colMap.lokasi);
            
            // Skip TOTAL rows
            if (lokasi.toUpperCase() === 'TOTAL' || lokasi.toUpperCase().includes('TOTAL KESELURUHAN')) {
                continue;
            }

            const totalPenjualan = getNum(colMap.totalPenjualan);
            const noPenjualan = getValue(colMap.noPenjualan);

            // Skip rows with no identifying info or 0 total (could be ghost rows)
            if (!noPenjualan && totalPenjualan === 0) {
                continue;
            }

            parsedData.push({
              lokasi,
              noTandaTerima: getValue(colMap.noTandaTerima),
              noPenjualan,
              tanggalPenjualan: getValue(colMap.tanggalPenjualan),
              waktuPenjualan: getValue(colMap.waktuPenjualan),
              tipePesanan: getValue(colMap.tipePesanan) || 'Unknown',
              jumlahBersih: getNum(colMap.jumlahBersih),
              biayaLayanan: getNum(colMap.biayaLayanan),
              totalPajak: getNum(colMap.totalPajak),
              totalPembulatan: getNum(colMap.totalPembulatan),
              totalPenjualan
            });
          }

          resolve(parsedData);
        } catch (error) {
          console.error("Error parsing CSV:", error);
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}
