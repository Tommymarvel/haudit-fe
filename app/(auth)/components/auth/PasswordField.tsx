'use client';
import { useState } from 'react';
import { Field } from 'formik';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps {
  name: string;
  placeholder?: string;
}

export default function PasswordField({ name, placeholder }: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Field
        name={name}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        className="w-full rounded-xl border border-neutral-200 bg-white pr-10 px-3 py-2.5 text-black  text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}
