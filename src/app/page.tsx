"use client";

import { useState } from "react";
import { apiRoutes } from "@/config/api-routes";
import { useApiMutation } from "@/hooks/use-api";
import type { Student } from "@/types/student.types";

const emptyStudent: Student = {
  registrationNumber: "",
  rollNumber: "",
  name: "",
  parentName: "",
  email: "",
  phone: "",
  CNIC: "",
};

type CreateStudentResponse = { success: true; student: unknown };

export default function Home() {
  const [form, setForm] = useState<Student>(emptyStudent);

  const mutation = useApiMutation<CreateStudentResponse, Student>(apiRoutes.student, {
    onSuccess: () => {
      alert("Student saved");
      setForm(emptyStudent);
    },
    onError: (err) => {
      alert(err.message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const field = (name: keyof Student, placeholder: string) => (
    <>
      <label htmlFor={name} style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>
        {placeholder}
      </label>
      <input
        id={name}
        name={name}
        placeholder={placeholder}
        value={form[name]}
        onChange={handleChange}
        autoComplete="off"
        style={{ width: "100%", maxWidth: 360, padding: "8px 10px", marginBottom: 12 }}
      />
    </>
  );

  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <h2>Add student</h2>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
        Fields match your MongoDB student schema (registration #, roll #, CNIC must be unique).
      </p>
      <form onSubmit={handleSubmit}>
        {field("registrationNumber", "Registration number")}
        {field("rollNumber", "Roll number")}
        {field("name", "Name")}
        {field("parentName", "Parent / guardian name")}
        {field("email", "Email")}
        {field("phone", "Phone")}
        {field("CNIC", "CNIC")}
        <button type="submit" disabled={mutation.isPending} style={{ marginTop: 8 }}>
          {mutation.isPending ? "Saving…" : "Submit"}
        </button>
      </form>
    </div>
  );
}
