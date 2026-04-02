'use client';

import { ToastContainer } from 'react-toastify';
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
    '!bg-[linear-gradient(90deg,rgba(220,250,230,0.75)_0%,#FFFFFF_46%)]',
  warning:
    '!bg-[linear-gradient(90deg,rgba(254,240,199,0.8)_0%,#FFFFFF_46%)]',
  info:
    '!bg-[linear-gradient(90deg,rgba(239,218,255,0.8)_0%,#FFFFFF_46%)]',
  error:
    '!bg-[linear-gradient(90deg,rgba(254,228,226,0.8)_0%,#FFFFFF_46%)]',
};

export default function ToastViewport() {
  return (
    <>
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
          'haudit-toast',
          '!m-0 !mb-[14px] !flex !w-[394px] !items-center !rounded-[10px] !border !border-[#EAEAEA] !p-4 !text-[#010101] !shadow-[0_10px_24px_0_rgba(16,24,40,0.09)] [&_.Toastify__toast-body]:!m-0 [&_.Toastify__toast-body]:!flex [&_.Toastify__toast-body]:!min-w-0 [&_.Toastify__toast-body]:!flex-1 [&_.Toastify__toast-body]:!items-center [&_.Toastify__toast-body]:!p-0 [&_.Toastify__toast-body]:!text-sm [&_.Toastify__toast-body]:!font-medium [&_.Toastify__toast-body]:!text-[#1D1D1D]',
          toastGradientByVariant[variant],
          'max-sm:!w-[calc(100vw-20px)]'
        );
      }}
      closeButton={ToastCloseButton}
      icon={({ type }) => <ToastStatusIcon type={type} />}
      theme="light"
    />
    <style dangerouslySetInnerHTML={{ __html: `
      .haudit-toast .Toastify__toast-icon {
        margin: 0 !important;
        margin-right: 12px !important;
        width: 48px !important;
        height: 48px !important;
        flex-shrink: 0 !important;
      }
      .haudit-toast .Toastify__toast-body {
        margin: 0 !important;
        padding: 0 !important;
      }
      .haudit-toast .Toastify__toast-body > div {
        width: 100% !important;
        word-break: break-word !important;
      }
    `}} />
    </>
  );
}
