'use client';
import { Upload, Wallet, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Menu } from '../ui/Menu';

export default function QuickActionsBar({
  onAddFile,
  onAddAdvance,
  onMore,
}: {
  onAddFile: () => void;
  onAddAdvance: () => void;
  onMore?: (key: string) => void;
}) {
  return (
    <div className="flex items-center  flex-col lg:flex-row gap-3">
      <Button variant="primary" className="px-10 py-3 w-full">
        <Upload className="h-4 w-4" /> Add File
      </Button>
      <Button className="bg-[#00D447] px-10 py-3 w-full inline-flex whitespace-nowrap hover:bg-emerald-700 text-white">
        <Wallet className="h-4 w-4" /> Add advance
      </Button>
      <Menu
      
        trigger={
          <Button variant="greyy" className="px-10 py-3 w-full">
            More <ChevronRight className="h-4 w-4" />
          </Button>
        }
        items={[
          { label: 'Add new file', onClick: onAddFile },
          { label: 'Add new advance', onClick: onAddAdvance },
          { label: 'Add new expense', onClick: () => onMore?.('expense') },
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
