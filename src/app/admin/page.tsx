"use client";

import { apiRoutes } from "@/config/api-routes";
import { queryKeys } from "@/config/query-keys";
import { useApiQuery } from "@/hooks/use-api";
import type { Student } from "@/types/student.types";

export default function AdminPage() {
  const { data, isPending, isError, error } = useApiQuery<Student[]>(
    queryKeys.students(),
    apiRoutes.student
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Page</h2>
      {isPending && <p>Loading…</p>}
      {isError && <p role="alert">{error.message}</p>}
      {data && (
        <ul>
          {data.map((s) => (
            <li key={`${s.registrationNumber}-${s.rollNumber}`}>
              {s.name} — {s.email}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
