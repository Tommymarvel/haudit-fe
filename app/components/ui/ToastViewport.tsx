'use client';

import { useEffect } from 'react';
import { ToastContainer, toast, type ToastContent, type ToastOptions } from 'react-toastify';
import { ToastCloseButton, ToastStatusIcon } from './ToastPrimitives';
import { cn } from '@/lib/cn';

type ToastVariant = 'success' | 'warning' | 'info' | 'error';

function getVariant(type?: string): ToastVariant {
  if (type === 'warning') return 'warning';
  if (type === 'info') return 'info';
  if (type === 'error') return 'error';
  return 'success';
}

const toastGradientByVariant: Record<ToastVariant, string> = {
  success:
    '![background:linear-gradient(to_bottom_right,#DBFAE6_0%,#FFF_50%)_bottom_right/50%_50%_no-repeat,linear-gradient(to_bottom_left,#DBFAE6_0%,#FFF_50%)_bottom_left/50%_50%_no-repeat,linear-gradient(to_top_left,#DBFAE6_0%,#FFF_50%)_top_left/50%_50%_no-repeat,linear-gradient(to_top_right,#DBFAE6_0%,#FFF_50%)_top_right/50%_50%_no-repeat]',
  warning:
    '![background:linear-gradient(to_bottom_right,#FEF0C7_0%,#FFF_50%)_bottom_right/50%_50%_no-repeat,linear-gradient(to_bottom_left,#FEF0C7_0%,#FFF_50%)_bottom_left/50%_50%_no-repeat,linear-gradient(to_top_left,#FEF0C7_0%,#FFF_50%)_top_left/50%_50%_no-repeat,linear-gradient(to_top_right,#FEF0C7_0%,#FFF_50%)_top_right/50%_50%_no-repeat]',
  info:
    '![background:linear-gradient(to_bottom_right,#EFDAFF_0%,#FFF_50%)_bottom_right/50%_50%_no-repeat,linear-gradient(to_bottom_left,#EFDAFF_0%,#FFF_50%)_bottom_left/50%_50%_no-repeat,linear-gradient(to_top_left,#EFDAFF_0%,#FFF_50%)_top_left/50%_50%_no-repeat,linear-gradient(to_top_right,#EFDAFF_0%,#FFF_50%)_top_right/50%_50%_no-repeat]',
  error:
    '![background:linear-gradient(to_bottom_right,#FEE4E2_0%,#FFF_50%)_bottom_right/50%_50%_no-repeat,linear-gradient(to_bottom_left,#FEE4E2_0%,#FFF_50%)_bottom_left/50%_50%_no-repeat,linear-gradient(to_top_left,#FEE4E2_0%,#FFF_50%)_top_left/50%_50%_no-repeat,linear-gradient(to_top_right,#FEE4E2_0%,#FFF_50%)_top_right/50%_50%_no-repeat]',
};

const titleByVariant: Record<ToastVariant, string> = {
  success: 'Successful toast.',
  warning: 'Warning toast.',
  info: 'Information toast.',
  error: 'Error toast.',
};

export default function ToastViewport() {
  useEffect(() => {
    const win = window as Window & {
      __hauditToastPatched?: boolean;
      __hauditToastOriginals?: {
        success: typeof toast.success;
        warning: typeof toast.warning;
        info: typeof toast.info;
        error: typeof toast.error;
      };
    };

    if (win.__hauditToastPatched) return;

    const originals = {
      success: toast.success,
      warning: toast.warning,
      info: toast.info,
      error: toast.error,
    };

    const decorate =
      <TData,>(
        title: string,
        method: (content: ToastContent<TData>, options?: ToastOptions<TData>) => string | number
      ) =>
      (content: ToastContent<TData>, options?: ToastOptions<TData>) => {
        if (typeof content !== 'string' && typeof content !== 'number') {
          return method(content, options);
        }

        return method(
          <div className="m-0 flex min-w-0 flex-1 flex-col items-start justify-center gap-1 p-0">
            <p className="m-0 w-full text-base font-medium leading-[1.25] text-[#010101]">
              {title}
            </p>
            <p className="m-0 w-full whitespace-normal text-xs font-normal leading-[1.25] text-[rgba(1,1,1,0.5)]">
              {String(content)}
            </p>
          </div>,
          options
        );
      };

    toast.success = decorate(titleByVariant.success, originals.success) as typeof toast.success;
    toast.warning = decorate(titleByVariant.warning, originals.warning) as typeof toast.warning;
    toast.info = decorate(titleByVariant.info, originals.info) as typeof toast.info;
    toast.error = decorate(titleByVariant.error, originals.error) as typeof toast.error;
    toast.warn = toast.warning;

    win.__hauditToastOriginals = originals;
    win.__hauditToastPatched = true;
  }, []);

  return (
    <ToastContainer
      position="top-right"
      className="!w-[394px] !p-3 max-sm:!w-[calc(100vw-20px)] max-sm:!p-2.5"
      autoClose={4500}
      hideProgressBar
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable={false}
      pauseOnHover
      toastClassName={(context) => {
        const variant = getVariant(context?.type);
        return cn(
          '!m-0 !mb-[14px] !flex !min-h-[85px] !w-[394px] !items-center !gap-[11px] !rounded-[8px] !border-[3px] !border-white !p-4 !text-[#010101] !shadow-[0_4px_15.7px_0_rgba(0,0,0,0.07)] [&_.Toastify__toast-body]:!m-0 [&_.Toastify__toast-body]:!flex [&_.Toastify__toast-body]:!min-w-0 [&_.Toastify__toast-body]:!flex-1 [&_.Toastify__toast-body]:!items-center [&_.Toastify__toast-body]:!p-0 [&_.Toastify__toast-body>div]:!w-full',
          toastGradientByVariant[variant],
          'max-sm:!w-[calc(100vw-20px)]'
        );
      }}
      closeButton={ToastCloseButton}
      icon={({ type }) => <ToastStatusIcon type={type} />}
      theme="light"
    />
  );
}
