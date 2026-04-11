"use client";

import { useState } from "react";
import { apiRoutes } from "@/config/api-routes";
import { useApiMutation } from "@/hooks/use-api";
import type { Student } from "@/types/student.types";

const emptyStudent: Student & { className: string } = {
  registrationNumber: "",
  rollNumber: "",
  name: "",
  parentName: "",
  email: "",
  phone: "",
  CNIC: "",
  className: "",
};

type CreateStudentResponse = { success: true; student: unknown };

export default function StudentsPage() {
  const [form, setForm] = useState(emptyStudent);

  const mutation = useApiMutation<CreateStudentResponse, typeof form>(
    apiRoutes.student,
    {
      onSuccess: () => {
        alert("طالب علم محفوظ ہو گیا");
        setForm(emptyStudent);
      },
      onError: (err) => {
        alert(err.message);
      },
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const Field = (name: keyof typeof form, placeholder: string) => (
    <div className="w-full">
      <label className="block mb-1 text-sm font-medium text-gray-700 text-right">
        {placeholder}
      </label>
      <input
        name={name}
        value={form[name]}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-right 
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  const SelectField = (
    name: keyof typeof form,
    placeholder: string,
    options: string[]
  ) => (
    <div className="w-full">
      <label className="block mb-1 text-sm font-medium text-gray-700 text-right">
        {placeholder}
      </label>
      <select
        name={name}
        value={form[name]}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-right 
                   bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">منتخب کریں</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div dir="rtl" className="p-4">
      <h1 className="text-3xl font-bold mb-6 text-right">طلباء</h1>

      <div className="bg-white rounded-xl p-6 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Class + Registration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {Field("registrationNumber", "رجسٹریشن نمبر")}
            {Field("rollNumber", "رول نمبر")}
          </div>

          {/* Roll */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
            {Field("name", "نام")}
            {Field("parentName", "والد / سرپرست کا نام")}
          </div>

          {/* Parent */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Field("phone", "فون نمبر")}
            {Field("email", "ای میل")}
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Field("CNIC", "شناختی کارڈ نمبر")}
            {SelectField("className", "کلاس منتخب کریں", [
              "Class 1",
              "Class 2",
              "Class 3",
              "Class 4",
              "Class 5",
            ])}
          </div>

          {/* Button */}
          <div className="flex justify-start">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-md font-medium
                         hover:bg-blue-700 transition disabled:opacity-60"
            >
              {mutation.isPending ? "محفوظ کیا جا رہا ہے…" : "جمع کریں"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}