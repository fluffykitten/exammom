import { getSupabaseBrowserClient, isSupabaseConfigured } from "./supabase/client";
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_FORM_FIELDS,
  DEFAULT_ROOMS,
  DEFAULT_STUDENTS,
} from "./seed-data";
import type {
  AppSettings,
  FormField,
  FormSnapshot,
  Room,
  Student,
  Submission,
} from "@/types/mom";

export interface BootstrapData {
  settings: AppSettings;
  fields: FormField[];
  rooms: Room[];
  students: Student[];
  supabaseReady: boolean;
}

export async function fetchBootstrapData(): Promise<BootstrapData> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !isSupabaseConfigured()) {
    return {
      settings: DEFAULT_APP_SETTINGS,
      fields: DEFAULT_FORM_FIELDS,
      rooms: DEFAULT_ROOMS,
      students: DEFAULT_STUDENTS,
      supabaseReady: false,
    };
  }

  const [settingsRes, fieldsRes, roomsRes, studentsRes] = await Promise.all([
    supabase.from("app_settings").select("*").eq("id", "default").maybeSingle(),
    supabase
      .from("form_fields")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("rooms")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("students")
      .select("*")
      .order("student_no", { ascending: true }),
  ]);

  if (settingsRes.error || fieldsRes.error || roomsRes.error || studentsRes.error) {
    console.warn("Supabase fetch error, falling back to seed defaults:", {
      settings: settingsRes.error,
      fields: fieldsRes.error,
      rooms: roomsRes.error,
      students: studentsRes.error,
    });
    return {
      settings: DEFAULT_APP_SETTINGS,
      fields: DEFAULT_FORM_FIELDS,
      rooms: DEFAULT_ROOMS,
      students: DEFAULT_STUDENTS,
      supabaseReady: true,
    };
  }

  return {
    settings: (settingsRes.data as AppSettings | null) ?? DEFAULT_APP_SETTINGS,
    fields:
      fieldsRes.data && fieldsRes.data.length > 0
        ? (fieldsRes.data as FormField[])
        : DEFAULT_FORM_FIELDS,
    rooms:
      roomsRes.data && roomsRes.data.length > 0
        ? (roomsRes.data as Room[])
        : DEFAULT_ROOMS,
    students:
      studentsRes.data && studentsRes.data.length > 0
        ? (studentsRes.data as Student[])
        : DEFAULT_STUDENTS,
    supabaseReady: true,
  };
}

export async function fetchSubmissions(): Promise<{
  submissions: Submission[];
  supabaseReady: boolean;
  error?: string;
}> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !isSupabaseConfigured()) {
    return { submissions: [], supabaseReady: false };
  }

  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { submissions: [], supabaseReady: true, error: error.message };
  }

  return {
    submissions: (data as Submission[]) ?? [],
    supabaseReady: true,
  };
}

export async function fetchSubmissionById(id: string): Promise<{
  submission: Submission | null;
  error?: string;
}> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !isSupabaseConfigured()) {
    return { submission: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { submission: null, error: error.message };
  }
  return { submission: (data as Submission | null) ?? null };
}

export async function saveSubmissionToSupabase(params: {
  snapshot: FormSnapshot;
  pdfBlob: Blob;
  docFile: File | null;
  roomId: string | null;
  roomName: string;
}): Promise<{ submission: Submission }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local."
    );
  }

  const timestamp = Date.now();
  const safeRoom = params.roomName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const examDate = String(params.snapshot.values.date ?? new Date().toISOString().slice(0, 10));
  const session = String(params.snapshot.values.session ?? "1st")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  let documentationUrl: string | null = null;
  if (params.docFile) {
    const ext = params.docFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const docPath = `${examDate}/${safeRoom || "room"}-${timestamp}.${ext}`;
    const { error: docErr } = await supabase.storage
      .from("mom-docs")
      .upload(docPath, params.docFile, {
        contentType: params.docFile.type || "image/jpeg",
        upsert: false,
      });

    if (docErr) {
      throw new Error(`Failed to upload documentation image: ${docErr.message}`);
    }
    const { data: docPublic } = supabase.storage.from("mom-docs").getPublicUrl(docPath);
    documentationUrl = docPublic.publicUrl;
  }

  const pdfPath = `${examDate}/mom-${safeRoom || "exam"}-${session}-${timestamp}.pdf`;
  const { error: pdfErr } = await supabase.storage
    .from("mom-pdfs")
    .upload(pdfPath, params.pdfBlob, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (pdfErr) {
    throw new Error(`Failed to upload PDF file: ${pdfErr.message}`);
  }

  const { data: pdfPublic } = supabase.storage.from("mom-pdfs").getPublicUrl(pdfPath);

  const v = params.snapshot.values;
  // Strip raw base64 image from stored JSON snapshot to keep Postgres lean
  const storedSnapshot: FormSnapshot = {
    ...params.snapshot,
    documentation_data_url: null,
  };

  const payload = {
    invigilator_name: String(v.invigilator_name ?? ""),
    invigilator_email: String(v.email ?? ""),
    exam_day: String(v.day ?? ""),
    exam_date: examDate,
    room_id: params.roomId && !params.roomId.startsWith("room-") ? params.roomId : null,
    room_name: params.roomName,
    session: String(v.session ?? ""),
    subjects: Array.isArray(v.subjects) ? v.subjects.map(String) : [],
    attendees_count: Number(v.attendees_count ?? 0),
    expected_count: Number(v.expected_count ?? 0),
    absent_count: Number(v.absent_count ?? 0),
    absent_students: params.snapshot.absent_students,
    form_snapshot: storedSnapshot,
    documentation_url: documentationUrl,
    pdf_url: pdfPublic.publicUrl,
    pdf_path: pdfPath,
  };

  const { data, error } = await supabase
    .from("submissions")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to save submission record: ${error.message}`);
  }

  return { submission: data as Submission };
}

export async function uploadHeaderLogo(
  side: "left" | "right",
  file: File
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `logos/${side}-logo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("mom-assets").upload(path, file, {
    contentType: file.type || "image/png",
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload ${side} logo: ${error.message}`);
  }

  const { data } = supabase.storage.from("mom-assets").getPublicUrl(path);
  return data.publicUrl;
}
