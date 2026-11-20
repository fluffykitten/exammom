export type FieldType =
  | "text"
  | "email"
  | "number"
  | "date"
  | "time"
  | "dropdown"
  | "checkbox_group"
  | "radio"
  | "scale_5"
  | "textarea"
  | "file_image";

export type FieldSection =
  | "general"
  | "schedule"
  | "attendance"
  | "evaluation"
  | "notes_media";

export interface ScaleOptions {
  minLabel?: string;
  maxLabel?: string;
}

export interface FormField {
  id: string;
  field_key: string;
  label: string;
  description?: string | null;
  field_type: FieldType;
  required: boolean;
  options: string[] | ScaleOptions;
  section: FieldSection;
  sort_order: number;
  is_active: boolean;
  is_system: boolean;
}

export interface AppSettings {
  id: string;
  header_title: string;
  header_subtitle: string;
  header_institution: string;
  header_address: string;
  left_logo_url: string | null;
  right_logo_url: string | null;
  footer_note: string;
  updated_at?: string;
}

export interface Room {
  id: string;
  name: string;
  category: "AKHWAT" | "IKHWAN" | string;
  sort_order: number;
  is_active: boolean;
}

export interface Student {
  id: string;
  room_id: string;
  student_no: number;
  nis: string;
  name: string;
  kelas: string;
  is_active: boolean;
}

export interface AbsentStudent {
  id: string;
  student_no: number;
  nis: string;
  name: string;
  kelas: string;
}

export type FormValue = string | number | string[] | null;

export interface FormSnapshot {
  header: AppSettings;
  fields: FormField[];
  values: Record<string, FormValue>;
  absent_students: AbsentStudent[];
  documentation_data_url?: string | null;
}

export interface Submission {
  id: string;
  created_at: string;
  invigilator_name: string;
  invigilator_email: string;
  exam_day: string;
  exam_date: string;
  room_id: string | null;
  room_name: string;
  session: string;
  subjects: string[];
  attendees_count: number;
  expected_count: number;
  absent_count: number;
  absent_students: AbsentStudent[];
  form_snapshot: FormSnapshot;
  documentation_url: string | null;
  pdf_url: string;
  pdf_path: string;
}

export const SECTION_LABELS: Record<FieldSection, string> = {
  general: "Invigilator & Exam Details",
  schedule: "Schedule, Room & Subjects",
  attendance: "Room Attendance",
  evaluation: "Participant Behavior Evaluation",
  notes_media: "Notes & Documentation",
};
