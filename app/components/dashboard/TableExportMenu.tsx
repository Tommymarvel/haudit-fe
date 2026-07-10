'use client';

import { ChevronDown } from 'lucide-react';
import { Menu } from '@/components/ui/Menu';
import { Button } from '@/components/ui/Button';
import { BRAND } from '@/lib/brand';

/**
 * Standard two-option export control: "Export data" (CSV) + "Export Analytics" (PDF).
 * Used on pages that have no server-side export endpoint, so the CSV is built
 * client-side by the caller and the PDF is rendered via the pdf library.
 */
export function TableExportMenu({
  onExportData,
  onExportAnalytics,
  disabled,
  className,
}: {
  onExportData: () => void;
  onExportAnalytics: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Menu
      trigger={
        <Button
          variant="primary"
          disabled={disabled}
          className={className ?? 'w-full rounded-2xl lg:w-auto gap-2'}
          style={{ backgroundColor: BRAND.purple }}
        >
          {disabled ? 'Exporting...' : 'Export'}
          <ChevronDown className="h-4 w-4" />
        </Button>
      }
      items={[
        { label: 'Export data', onClick: onExportData },
        { label: 'Export Analytics', onClick: onExportAnalytics },
      ]}
    />
  );
}
