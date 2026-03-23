"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { TagInput } from "@/components/ui/TagInput";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/contexts/AuthContext";

const ProfileSchema = Yup.object({
  firstName: Yup.string().when("$userType", {
    is: (val: string) => val !== "record_label",
    then: (schema) => schema.required("First name is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  lastName: Yup.string().when("$userType", {
    is: (val: string) => val !== "record_label",
    then: (schema) => schema.required("Last name is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  other_names: Yup.array().of(Yup.string()),
  label_name: Yup.string().when("$userType", {
    is: (val: string) => val === "record_label",
    then: (schema) =>
      schema.required("Label name is required for record labels"),
    otherwise: (schema) => schema.notRequired(),
  }),
  address: Yup.string().when("$userType", {
    is: (val: string) => val === "record_label",
    then: (schema) => schema.required("Address is required for record labels"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

function CompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [userType, setUserType] = useState<string>("");

  useEffect(() => {
    // Get user_type from URL or sessionStorage
    const urlUserType = searchParams.get("user");
    const storedUserType = sessionStorage.getItem("user_type");

    const finalUserType = urlUserType || storedUserType;

    if (!finalUserType) {
      toast.error("Please select your account type first");
      router.push("/whoareyou");
      return;
    }

    // Validate user_type
    const validUserTypes = ["artist", "label_artist", "record_label"];
    if (!validUserTypes.includes(finalUserType)) {
      toast.error("Invalid account type");
      router.push("/whoareyou");
      return;
    }

    setUserType(finalUserType);

    // Store in sessionStorage if it came from URL
    if (urlUserType) {
      sessionStorage.setItem("user_type", urlUserType);
    }
  }, [searchParams, router]);

  const handleSubmit = async (values: {
    firstName: string;
    lastName: string;
    other_names: string[];
    label_name?: string;
    address?: string;
  }) => {
    if (!userType) {
      toast.error("User type is not set");
      return;
    }

    setSubmitting(true);

    try {
      // Prepare payload
      const payload: {
        user_type: string;
        first_name?: string;
        last_name?: string;
        other_names?: string[];
        label_name?: string;
        address?: string;
      } = {
        user_type: userType,
      };

      if (userType !== "record_label") {
        payload.first_name = values.firstName;
        payload.last_name = values.lastName;
      }

      // Only add optional fields if they have values
      if (userType !== "record_label" && values.other_names && values.other_names.length > 0) {
        payload.other_names = values.other_names;
      }

      if (values.label_name && userType === "record_label") {
        payload.label_name = values.label_name;
      }

      if (values.address && userType === "record_label") {
        payload.address = values.address;
      }

      // Call the create-profile API
      await axiosInstance.post("/auth/create-profile", payload);

      toast.success("Profile created successfully!");

      // Clear user_type from sessionStorage
      sessionStorage.removeItem("user_type");

      // Refresh user data and redirect to dashboard
      await refreshUser();
      router.push("/dashboard");
    } catch (error) {
      const errorMessage =
        (
          error as {
            response?: { data?: { message?: string | string[] } };
            message?: string;
          }
        )?.response?.data?.message ||
        (error as { message?: string })?.message ||
        "Failed to create profile";
      toast.error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render form until userType is set
  if (!userType) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="rounded-l grid place-items-center">
        <Image src="/haudit-logo.svg" alt="Haudit" width={48} height={48} />
      </div>
      <h1 className="mt-6 text-2xl text-center font-medium text-[#1F1F1F]">
        Complete Your Profile
      </h1>
      <p className="mt-1 text-sm text-center text-neutral-500">
        Tell us a bit more about yourself to get started.
      </p>

      <Formik
        initialValues={{
          firstName: "",
          lastName: "",
          other_names: [] as string[],
          label_name: "",
          address: "",
        }}
        validationSchema={ProfileSchema}
        context={{ userType }}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue }) => {
          const isRecordLabel = userType === "record_label";
          const allFieldsFilled = isRecordLabel
            ? values.label_name.trim() !== "" && values.address.trim() !== ""
            : values.firstName.trim() !== "" && values.lastName.trim() !== "";

          return (
            <Form className="space-y-5 mt-6 max-w-[650px] w-full mx-auto">
              {/* Name */}
              {!isRecordLabel && (
                <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm text-neutral-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Field
                      name="firstName"
                      placeholder="Enter your first name"
                      className="w-full rounded-2xl border border-neutral-200 px-3 py-2.5 text-black outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                    />
                  </div>
                  <ErrorMessage
                    name="firstName"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-neutral-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Field
                      name="lastName"
                      placeholder="Enter your last name"
                      className="w-full rounded-2xl border border-neutral-200 px-3 py-2.5 text-black outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                    />
                  </div>
                  <ErrorMessage
                    name="lastName"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>
              </div>
              )}
              {userType === "record_label" && ( <div>
                    <label className="mb-2 block text-sm text-neutral-700">
                      Label Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Field
                        name="label_name"
                        placeholder="Enter your label name"
                        className="w-full rounded-2xl border border-neutral-200 px-3 py-2.5 text-black outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                      />
                    </div>
                    <ErrorMessage
                      name="label_name"
                      component="p"
                      className="mt-1 text-xs text-rose-600"
                    />
                  </div>
              
              )}

              {/* Other Names */}
              {!isRecordLabel && (
                <div>
                <label className="mb-2 block text-sm text-neutral-700">
                  Other Names
                </label>
                <TagInput
                  value={values.other_names}
                  onChange={(newValue) =>
                    setFieldValue("other_names", newValue)
                  }
                  placeholder="Type other names and press Enter"
                />
                <div className="mt-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3 flex gap-2">
                  <span className="text-yellow-600 flex-shrink-0 mt-0.5">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.99992 5.33301V7.99967M7.99992 10.6663H8.00659M14.6666 7.99967C14.6666 11.6816 11.6818 14.6663 7.99992 14.6663C4.31802 14.6663 1.33325 11.6816 1.33325 7.99967C1.33325 4.31778 4.31802 1.33301 7.99992 1.33301C11.6818 1.33301 14.6666 4.31778 14.6666 7.99967Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <p className="text-sm text-yellow-800">
                    Manage your alternate names, including stage names and
                    aliases used in reporting files.
                  </p>
                </div>
              </div>
              )}

              {/* Label Name - Only show for record_label */}
              {userType === "record_label" && (
                <>
                   <div className="mt-2">
                  <label className="mb-2 block text-sm text-neutral-700">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Field
                      name="address"
                      placeholder="Enter your address"
                      className="w-full rounded-2xl border border-neutral-200 px-3 py-2.5 text-black outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                    />
                  </div>
                  <ErrorMessage
                    name="address"
                    component="p"
                    className="mt-1 text-xs text-rose-600"
                  />
                </div>
                </>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!allFieldsFilled || submitting}
                className="w-full rounded-2xl text-white py-3 font-medium transition-colors disabled:bg-[#959595] enabled:bg-[#7B00D4] enabled:hover:bg-[#6A00B8]"
              >
                {submitting ? "Creating profile..." : "Complete Profile"}
              </button>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-neutral-500">Loading...</p>
        </div>
      }
    >
      <CompleteProfileContent />
    </Suspense>
  );
}
