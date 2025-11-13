'use client';
import { useCallback, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/cn';

export type DropFile = File & { preview?: string };

export default function FileDropzone({
  onFiles,
  accept = '.pdf,.png,.jpg,.jpeg,.webp,.heic',
  label = 'Drag and Drop file here',
  linkText = 'Select a file',
  className,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  label?: string;
  linkText?: string;
  className?: string;
}) {
  const [isOver, setIsOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    },
    [onFiles]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={cn(
        'rounded-2xl border-2 border-dashed border-neutral-300 p-6 text-center',
        isOver && 'border-neutral-400 bg-neutral-50',
        className
      )}
    >
      <div className='items-center flex gap-2'>  <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
      >
        <path
          d="M14.8205 12.631C15.1109 12.3413 15.498 12.1689 15.9076 12.1467C16.3172 12.1246 16.7206 12.2543 17.0405 12.511L17.1752 12.631L20.9405 16.391C21.1822 16.6304 21.3232 16.9531 21.3348 17.2931C21.3463 17.633 21.2275 17.9645 21.0026 18.2198C20.7777 18.475 20.4637 18.6346 20.125 18.6659C19.7863 18.6973 19.4484 18.598 19.1805 18.3883L19.0552 18.2777L17.3312 16.555V28.0003C17.3308 28.3402 17.2007 28.667 16.9674 28.9142C16.7341 29.1613 16.4153 29.31 16.076 29.3299C15.7367 29.3498 15.4027 29.2394 15.1421 29.0213C14.8815 28.8032 14.714 28.4938 14.6739 28.1563L14.6645 28.0003V16.555L12.9405 18.2777C12.7009 18.5189 12.3782 18.6594 12.0384 18.6706C11.6986 18.6817 11.3673 18.5627 11.1124 18.3377C10.8575 18.1127 10.6981 17.7989 10.6669 17.4603C10.6357 17.1218 10.735 16.7841 10.9445 16.5163L11.0552 16.3897L14.8205 12.631ZM15.3312 2.66699C19.0432 2.66699 22.2112 5.00033 23.4459 8.28299C25.2906 8.78675 26.8938 9.93462 27.9651 11.5186C29.0364 13.1026 29.5048 15.018 29.2856 16.9176C29.0664 18.8172 28.1739 20.5755 26.77 21.8739C25.366 23.1722 23.5435 23.9247 21.6325 23.995L21.3312 24.0003H19.9979V21.3337C20.7669 21.3337 21.5196 21.1121 22.1659 20.6954C22.8123 20.2787 23.3247 19.6844 23.642 18.9839C23.9593 18.2834 24.0679 17.5062 23.9548 16.7456C23.8418 15.9849 23.5118 15.273 23.0045 14.695L22.8245 14.503L19.0592 10.7443C18.279 9.96562 17.2313 9.51353 16.1295 9.48009C15.0277 9.44665 13.9545 9.83437 13.1285 10.5643L12.9365 10.7443L9.17119 14.5043C8.62828 15.0467 8.25284 15.7338 8.08967 16.4837C7.9265 17.2335 7.98248 18.0145 8.25094 18.7334C8.51939 19.4524 8.98899 20.0789 9.60371 20.5383C10.2184 20.9977 10.9523 21.2705 11.7179 21.3243L11.9979 21.3337V24.0003H9.33119C7.79881 24.0013 6.31286 23.4744 5.12345 22.5082C3.93404 21.542 3.11379 20.1956 2.80075 18.6955C2.48771 17.1955 2.70101 15.6333 3.40473 14.2721C4.10845 12.9109 5.25963 11.8336 6.66453 11.2217C6.69398 8.94258 7.62006 6.76685 9.24219 5.16567C10.8643 3.5645 13.0519 2.6668 15.3312 2.66699Z"
          fill="#AAAAAA"
        />
      </svg>{' '}
      <p className="text-sm text-neutral-500">
        {label} or{' '}
        <button
          type="button"
          className="font-medium text-neutral-700 underline"
          onClick={() => inputRef.current?.click()}
        >
          {linkText}
        </button>
      </p></div>
    
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => e.target.files && onFiles(Array.from(e.target.files))}
        className="hidden"
      />
    </div>
  );
}
