import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { SupabaseClient } from '@supabase/supabase-js';

interface AuditLogParams {
  userId: string;
  tableName: string;
  recordId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  oldValues?: any;
  newValues?: any;
  reason?: string;
}

export async function createAuditLog(
  supabase: SupabaseClient,
  { userId, tableName, recordId, action, oldValues, newValues, reason }: AuditLogParams
) {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      user_id: userId,
      table_name: tableName,
      record_id: recordId,
      action,
      old_values: oldValues,
      new_values: newValues,
      reason,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error('Failed to create audit log:', error);
    }
  } catch (err) {
    console.error('Audit log exception:', err);
  }
}
