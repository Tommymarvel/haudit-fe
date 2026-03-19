'use client';
import { Upload, Wallet, ChevronRight, Grid } from 'lucide-react';
import { Button } from '../ui/Button';
import { Menu } from '../ui/Menu';

export default function QuickActionsBar({
  onAddFile,
  onAddAdvance,
  onAddExpense,
  onMore,
}: {
  onAddFile: () => void;
  onAddAdvance: () => void;
  onAddExpense: () => void;
  onMore?: (key: string) => void;
}) {
  return (
    <div className="flex items-center mt-2  flex-row gap-3">
      <Button variant="primary" className="py-3 w-full whitespace-nowrap" onClick={onAddFile}>
        <Upload className="h-4 w-4" /> Add new royalty record
      </Button>
      <Button className="bg-[#00D447] px-10 py-3 w-full inline-flex whitespace-nowrap hover:bg-emerald-700 text-white" onClick={onAddAdvance}>
        <Wallet className="h-4 w-4" /> Add advance
      </Button>
      <Button className="bg-[#F5A623] px-10 py-3 w-full inline-flex whitespace-nowrap hover:bg-amber-600 text-white" onClick={onAddExpense}>
        <Grid className="h-4 w-4" /> Add expense
      </Button>
      <Menu
      
        trigger={
          <Button variant="greyy" className="px-10 py-3 w-full">
            More <ChevronRight className="h-4 w-4" />
          </Button>
        }
        items={[
          { label: 'Add new royalty record', onClick: onAddFile },
          { label: 'Add new advance', onClick: onAddAdvance },
          { label: 'Add new expense', onClick: onAddExpense },
          { label: 'Export table', onClick: () => onMore?.('export-table') },
          {
            label: 'Export analytics',
            onClick: () => onMore?.('export-analytics'),
          },
        ]}
      />
    </div>
  );
}
