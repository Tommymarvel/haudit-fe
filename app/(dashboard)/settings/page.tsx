'use client';
import React, { useCallback, useState } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { UploadCloud, X } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { uploadFile } from '@/lib/utils/upload';
import axiosInstance from '@/lib/axiosinstance';
import { toast } from 'react-toastify';
import { auth } from '@/lib/auth/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

const BRAND_PURPLE = '#7B00D4';

const ProfileSchema = Yup.object({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
});

function AvatarDropzone({
    value,
    onChange,
    currentAvatar,
}: {
    value?: File | null;
    onChange: (file: File | null) => void;
    currentAvatar?: string;
}) {
    const [preview, setPreview] = useState<string | null>(null);

    const onDrop = useCallback(
        (accepted: File[]) => {
            const f = accepted?.[0];
            if (!f) return;
            onChange(f);
            setPreview(URL.createObjectURL(f));
        },
        [onChange]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
        },
        maxSize: 800 * 400 * 10, // soft guard
    });

    return (
        <div className="flex items-start gap-6">
            {/* Current avatar */}
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-200 ring-2 ring-white shadow-sm">
                {preview ? (
                    // newly selected file preview
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                ) : value ? (
                    // existing uploaded file preview (when editing again)
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={URL.createObjectURL(value)} alt="Avatar" className="h-full w-full object-cover" />
                ) : currentAvatar ? (
                    // Current user avatar from API
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentAvatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                    // Placeholder image from design
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop" alt="Avatar" className="h-full w-full object-cover" />
                )}
            </div>

            {/* Dropzone box */}
            <div
                {...getRootProps()}
                className={`flex h-[120px] w-full max-w-[500px] cursor-pointer items-center justify-center rounded-xl border px-4 text-center text-sm transition ${isDragActive
                    ? 'border-dashed border-[#7B00D4] bg-[#F5ECFF]'
                    : 'border border-[#7B00D4] bg-white hover:bg-neutral-50'
                    }`}
                aria-label="Upload profile photo"
            >
                <input {...getInputProps()} />
                <div className="space-y-1">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-600 shadow-sm mb-2">
                        <UploadCloud className="h-5 w-5" />
                    </div>
                    <p className="text-sm">
                        <span className="font-semibold text-[#7B00D4]">Click to upload</span> <span className="text-neutral-600">or drag and drop</span>
                    </p>
                    <p className="text-xs text-neutral-500">SVG, PNG, JPG or GIF (max. 800×400px)</p>
                </div>

                {/* File icon in corner */}
                <div className="absolute bottom-2 right-2">
                    {/* Placeholder for file icon if needed, or just keep clean */}
                </div>
            </div>

            {value && (
                <button
                    type="button"
                    onClick={() => {
                        onChange(null);
                        setPreview(null);
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-200 self-center"
                    aria-label="Remove photo"
                >
                    <X className="h-3.5 w-3.5" /> Remove
                </button>
            )}
        </div>
    );
}

function FormRow({
    label,
    required,
    children,
    helpText,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    helpText?: React.ReactNode;
}) {
    return (
        <div className="grid md:grid-cols-[280px_1fr] gap-4 py-5 border-b border-neutral-100 last:border-0">
            <div>
                <label className="block text-sm font-semibold text-[#414651]">
                    {label} {required && <span className="text-[#7F56D9]">*</span>}
                </label>
                {helpText && <div className="mt-1 text-sm text-[#535862]">{helpText}</div>}
            </div>
            <div className="max-w-[500px]">
                {children}
            </div>
        </div>
    );
}

function InputWithIcon({ name, placeholder, type = 'text' }: { name: string; placeholder: string; type?: string }) {
    return (
        <div className="relative">
            <Field
                name={name}
                type={type}
                placeholder={placeholder}
                className="w-full rounded-lg border border-neutral-300 bg-white pl-3 pr-10 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-500 outline-none focus:border-[#7B00D4] focus:ring-1 focus:ring-[#7B00D4]"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                <Image src="/svgs/edit-pencil.svg" alt="Edit" width={20} height={20} />
            </div>
            <div><ErrorMessage name={name} component="p" className="mt-1 text-xs text-rose-600" /></div>
            
        </div>
    )
}

export default function SettingsPage() {
    const { user } = useAuth();
    
    const initialValues = {
        firstName: user?.first_name || '',
        lastName: user?.last_name || '',
        avatar: null as File | null,
    };

    return (
        <AppShell>
            <div className=" px-4 pb-16 pt-8">
                <h1 className="text-2xl font-medium text-[#3c3c3c]">Settings</h1>
                <p className=" text-base text-[#777]">
                    Here you can update your personal information, password, and notification preferences.
                </p>

                <Formik
                    initialValues={initialValues}
                    enableReinitialize
                    validationSchema={ProfileSchema}
                    onSubmit={async (vals, helpers) => {
                        try {
                            let avatarUrl: string | undefined = undefined;

                            // Upload avatar file if selected
                            if (vals.avatar) {
                                try {
                                    avatarUrl = await uploadFile(vals.avatar, 'profile');
                                } catch (err) {
                                    console.error('Upload error:', err);
                                    toast.error('Failed to upload avatar');
                                    helpers.setSubmitting(false);
                                    return;
                                }
                            }

                            // Prepare payload for profile update
                            const payload = {
                                first_name: vals.firstName.trim(),
                                last_name: vals.lastName.trim(),
                                ...(avatarUrl && { avatar: avatarUrl }),
                            };

                            // Send update to API
                            await axiosInstance.patch('/auth/profile', payload);
                            toast.success('Profile updated successfully');
                            
                            // Reset avatar field
                            helpers.setFieldValue('avatar', null);
                        } catch (err: unknown) {
                            console.error('Update failed:', err);
                            const error = err as { response?: { data?: { message?: string } } };
                            toast.error(error.response?.data?.message || 'Failed to update profile');
                        } finally {
                            helpers.setSubmitting(false);
                        }
                    }}
                >
                    {({ isSubmitting, setFieldValue, values }) => (
                        <Form className="mt-[30px]">
                            {/* Personal Info Section */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between border-b border-neutral-200 pb-5 mb-5">
                                    <div>
                                        <h2 className="text-[18px] font-semibold text-[#181D27]">Personal Info</h2>
                                        <p className="text-sm text-[#535862] ">Please enter your current password to change your password.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {/* Avatar */}
                                    <FormRow
                                        label="Your photo"
                                        required
                                        helpText="This will be displayed on your profile."
                                    >
                                        <AvatarDropzone
                                            value={values.avatar ?? null}
                                            onChange={(file) => setFieldValue('avatar', file)}
                                            currentAvatar={user?.avatar}
                                        />
                                    </FormRow>

                                    {/* First name */}
                                    <FormRow label="First name" required>
                                        <InputWithIcon name="firstName" placeholder="Enter your first name" />
                                    </FormRow>

                                    {/* Last name */}
                                    <FormRow label="Last name" required>
                                        <InputWithIcon name="lastName" placeholder="Enter your last name" />
                                    </FormRow>
                                </div>
                            </div>

                            {/* Actions (Cancel/Update) - Placed here as per design flow, or at bottom */}
                            <div className="flex items-center justify-end gap-3 py-4">
                                <button
                                    type="button"
                                    className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 shadow-sm"
                                    onClick={() => window.history.back()}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
                                    style={{ backgroundColor: BRAND_PURPLE }}
                                >
                                    Update details
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>

                {/* Password Section - Separate Form */}
                <Formik
                    initialValues={{
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                    }}
                    validationSchema={Yup.object({
                        currentPassword: Yup.string().required('Current password is required'),
                        newPassword: Yup.string().required('New password is required').min(8, 'Must be at least 8 characters'),
                        confirmPassword: Yup.string().required('Confirm password is required').oneOf([Yup.ref('newPassword')], 'Passwords must match'),
                    })}
                    onSubmit={async (vals, helpers) => {
                        try {
                            const currentUser = auth.currentUser;
                            
                            if (!currentUser) {
                                toast.error('Not authenticated. Please log in again.');
                                helpers.setSubmitting(false);
                                return;
                            }
                            
                            if (!user?.email) {
                                toast.error('User email not found.');
                                helpers.setSubmitting(false);
                                return;
                            }

                            // Re-authenticate user with current password
                            const credential = EmailAuthProvider.credential(
                                user.email,
                                vals.currentPassword
                            );
                            await reauthenticateWithCredential(currentUser, credential);
                            
                            // Update password
                            await updatePassword(currentUser, vals.newPassword);
                            toast.success('Password updated successfully');
                            
                            // Reset form
                            helpers.resetForm();
                        } catch (error: unknown) {
                            console.error('Password update failed:', error);
                            const err = error as { code?: string; message?: string };
                            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                                toast.error('Current password is incorrect');
                            } else {
                                toast.error(err.message || 'Failed to update password');
                            }
                        } finally {
                            helpers.setSubmitting(false);
                        }
                    }}
                >
                    {({ isSubmitting }) => (
                        <Form className="mt-8">
                            <div className="mb-8">
                                <div className="flex items-center justify-between border-b border-neutral-200 pb-5 mb-5">
                                    <div>
                                        <h2 className="text-[18px] font-semibold text-[#181D27]">Password</h2>
                                        <p className="text-sm text-[#535862]">Please enter your current password to change your password.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <FormRow label="Current password" required>
                                        <InputWithIcon name="currentPassword" type="password" placeholder="••••••••" />
                                    </FormRow>

                                    <FormRow label="New password" required helpText="Your new password must be more than 8 characters.">
                                        <InputWithIcon name="newPassword" type="password" placeholder="••••••••" />
                                    </FormRow>

                                    <FormRow label="Confirm new password" required>
                                        <InputWithIcon name="confirmPassword" type="password" placeholder="••••••••" />
                                    </FormRow>
                                </div>
                            </div>

                            {/* Password Update Button */}
                            <div className="flex items-center justify-end gap-3 py-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
                                    style={{ backgroundColor: BRAND_PURPLE }}
                                >
                                    Update password
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </AppShell>
    );
}

