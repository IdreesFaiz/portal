"use client";

import { useState } from "react";
import { useCreateClass } from "@/hooks/useCreateClass";

type Course = {
  name: string;
  marks: number;
};

export default function CreateClassPage() {
  const createClass = useCreateClass();

  const [className, setClassName] = useState<string>("");

  const [courses, setCourses] = useState<Course[]>([
    { name: "", marks: 0 },
  ]);

  // =========================
  // Update Course Field
  // =========================
  const handleCourseChange = (
    index: number,
    field: keyof Course,
    value: string
  ) => {
    const updated = [...courses];

    if (field === "marks") {
      updated[index][field] = Number(value) as never;
    } else {
      updated[index][field] = value as never;
    }

    setCourses(updated);
  };

  // =========================
  // Add Course
  // =========================
  const addCourse = () => {
    setCourses([...courses, { name: "", marks: 0 }]);
  };

  // =========================
  // Remove Course
  // =========================
  const removeCourse = (index: number) => {
    const updated = courses.filter((_, i) => i !== index);
    setCourses(updated);
  };

  // =========================
  // Submit Form
  // =========================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      className,
      courses: courses.filter(
        (c) => c.name.trim() !== "" && c.marks > 0
      ),
    };

    createClass.mutate(payload, {
      onSuccess: () => {
        alert("کلاس کامیابی سے محفوظ ہو گئی");

        // reset form
        setClassName("");
        setCourses([{ name: "", marks: 0 }]);
      },
      onError: (err) => {
        alert(err.message);
      },
    });
  };

  return (
    <div dir="rtl" className="max-w-3xl mx-auto p-6">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-6 text-right">
        نیا کلاس بنائیں
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-6 space-y-5"
      >
        {/* Class Name */}
        <div>
          <label className="block mb-2 text-right font-medium">
            کلاس کا نام
          </label>

          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="مثال: 10th Class"
            className="w-full border rounded px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        {/* Courses Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">کورسز</h2>

            <button
              type="button"
              onClick={addCourse}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              + کورس شامل کریں
            </button>
          </div>

          {/* Course List */}
          <div className="space-y-3">
            {courses.map((course, index) => (
              <div
                key={index}
                className="flex gap-2 items-center"
              >
                {/* Course Name */}
                <input
                  type="text"
                  placeholder="کورس کا نام"
                  value={course.name}
                  onChange={(e) =>
                    handleCourseChange(
                      index,
                      "name",
                      e.target.value
                    )
                  }
                  className="flex-1 border rounded px-3 py-2 text-right"
                />

                {/* Marks */}
                <input
                  type="number"
                  placeholder="نمبر"
                  value={course.marks}
                  onChange={(e) =>
                    handleCourseChange(
                      index,
                      "marks",
                      e.target.value
                    )
                  }
                  className="w-24 border rounded px-2 py-2 text-right"
                />

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeCourse(index)}
                  className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={createClass.isPending}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {createClass.isPending ? "محفوظ ہو رہا ہے..." : "محفوظ کریں"}
        </button>
      </form>
    </div>
  );
}