import type { CloseButtonProps, TypeOptions } from 'react-toastify';

type ToastVariant = 'success' | 'warning' | 'info' | 'error';

function getVariant(type?: TypeOptions): ToastVariant {
  if (type === 'warning') return 'warning';
  if (type === 'info') return 'info';
  if (type === 'error') return 'error';
  return 'success';
}

function SuccessGlyph() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect width="48" height="48" rx="24" fill="#DCFAE6" />
      <path
        d="M20.4 24L22.8 26.4L28.2 21M18.4005 14.1824C19.3651 14.1055 20.2809 13.7261 21.0174 13.0985C22.7361 11.6338 25.2639 11.6338 26.9826 13.0985C27.7191 13.7261 28.6349 14.1055 29.5995 14.1824C31.8505 14.3621 33.6379 16.1495 33.8176 18.4005C33.8945 19.3651 34.2739 20.2809 34.9015 21.0174C36.3662 22.7361 36.3662 25.2639 34.9015 26.9826C34.2739 27.7191 33.8945 28.6349 33.8176 29.5995C33.6379 31.8505 31.8505 33.6379 29.5995 33.8176C28.6349 33.8945 27.7191 34.2739 26.9826 34.9015C25.2639 36.3662 22.7361 36.3662 21.0174 34.9015C20.2809 34.2739 19.3651 33.8945 18.4005 33.8176C16.1495 33.6379 14.3621 31.8505 14.1824 29.5995C14.1055 28.6349 13.7261 27.7191 13.0985 26.9826C11.6338 25.2639 11.6338 22.7361 13.0985 21.0174C13.7261 20.2809 14.1055 19.3651 14.1824 18.4005C14.3621 16.1495 16.1495 14.3621 18.4005 14.1824Z"
        stroke="#17B26A"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningGlyph() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect width="48" height="48" rx="24" fill="#FEF0C7" />
      <path
        d="M23.9998 21V25M23.9998 29H24.0098M22.6151 15.8917L14.3902 30.0983C13.934 30.8863 13.7059 31.2803 13.7396 31.6037C13.769 31.8857 13.9168 32.142 14.1461 32.3088C14.4091 32.5 14.8643 32.5 15.7749 32.5H32.2246C33.1352 32.5 33.5904 32.5 33.8534 32.3088C34.0827 32.142 34.2305 31.8857 34.2599 31.6037C34.2936 31.2803 34.0655 30.8863 33.6093 30.0983L25.3844 15.8917C24.9299 15.1065 24.7026 14.714 24.4061 14.5821C24.1474 14.4671 23.8521 14.4671 23.5935 14.5821C23.2969 14.714 23.0696 15.1065 22.6151 15.8917Z"
        stroke="#F79009"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoGlyph() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect width="48" height="48" rx="24" fill="#EFDAFF" />
      <path
        d="M24 20V24M24 28H24.01M34 24C34 29.5228 29.5228 34 24 34C18.4772 34 14 29.5228 14 24C14 18.4772 18.4772 14 24 14C29.5228 14 34 18.4772 34 24Z"
        stroke="#7B00D4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ErrorGlyph() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect width="48" height="48" rx="24" fill="#FEE4E2" />
      <path
        d="M24 20V24M24 28H24.01M14 20.5227V27.4773C14 27.7218 14 27.8441 14.0276 27.9592C14.0521 28.0613 14.0925 28.1588 14.1474 28.2483C14.2092 28.3492 14.2957 28.4357 14.4686 28.6086L19.3914 33.5314C19.5643 33.7043 19.6508 33.7908 19.7517 33.8526C19.8412 33.9075 19.9387 33.9479 20.0408 33.9724C20.1559 34 20.2782 34 20.5227 34H27.4773C27.7218 34 27.8441 34 27.9592 33.9724C28.0613 33.9479 28.1588 33.9075 28.2483 33.8526C28.3492 33.7908 28.4357 33.7043 28.6086 33.5314L33.5314 28.6086C33.7043 28.4357 33.7908 28.3492 33.8526 28.2483C33.9075 28.1588 33.9479 28.0613 33.9724 27.9592C34 27.8441 34 27.7218 34 27.4773V20.5227C34 20.2782 34 20.1559 33.9724 20.0408C33.9479 19.9387 33.9075 19.8412 33.8526 19.7517C33.7908 19.6508 33.7043 19.5643 33.5314 19.3914L28.6086 14.4686C28.4357 14.2957 28.3492 14.2092 28.2483 14.1474C28.1588 14.0925 28.0613 14.0521 27.9592 14.0276C27.8441 14 27.7218 14 27.4773 14H20.5227C20.2782 14 20.1559 14 20.0408 14.0276C19.9387 14.0521 19.8412 14.0925 19.7517 14.1474C19.6508 14.2092 19.5643 14.2957 19.3914 14.4686L14.4686 19.3914C14.2957 19.5643 14.2092 19.6508 14.1474 19.7517C14.0925 19.8412 14.0521 19.9387 14.0276 20.0408C14 20.1559 14 20.2782 14 20.5227Z"
        stroke="#F04438"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ToastStatusIcon({ type }: { type?: TypeOptions }) {
  const variant = getVariant(type);

  return (
    <span className="block h-12 w-12 leading-none" aria-hidden="true">
      {variant === 'success' && <SuccessGlyph />}
      {variant === 'warning' && <WarningGlyph />}
      {variant === 'info' && <InfoGlyph />}
      {variant === 'error' && <ErrorGlyph />}
    </span>
  );
}

export function ToastCloseButton({ closeToast }: CloseButtonProps) {
  return (
    <button
      type="button"
      onClick={(event) => closeToast?.(event)}
      className="m-0 cursor-pointer self-center rounded-[6px] border-0 bg-transparent p-0 leading-none text-[#98A2B3] hover:text-[#667085] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#98A2B3]"
      aria-label="Close notification"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}
