"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Eye,
  FileUp,
  Loader2,
  RefreshCw,
  Send,
  UserCheck,
  UserX,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { fetchBootstrapData, saveSubmissionToSupabase } from "@/lib/data-service";
import { generateMomPdfBlob } from "@/lib/pdf/generate-pdf";
import { PdfPreviewModal } from "./PdfPreviewModal";
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_FORM_FIELDS,
  DEFAULT_ROOMS,
  DEFAULT_STUDENTS,
} from "@/lib/seed-data";
import {
  SECTION_LABELS,
  type AbsentStudent,
  type AppSettings,
  type FieldSection,
  type FormField,
  type FormSnapshot,
  type FormValue,
  type Room,
  type ScaleOptions,
  type Student,
  type Submission,
} from "@/types/mom";

const SECTION_ORDER: FieldSection[] = [
  "general",
  "schedule",
  "attendance",
  "evaluation",
  "notes_media",
];

function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodayDayName(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

export function MomFormClient() {
  const [loading, setLoading] = useState(true);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FORM_FIELDS);
  const [rooms, setRooms] = useState<Room[]>(DEFAULT_ROOMS);
  const [students, setStudents] = useState<Student[]>(DEFAULT_STUDENTS);

  const [values, setValues] = useState<Record<string, FormValue>>({});
  const [absentIds, setAbsentIds] = useState<Set<string>>(new Set());
  const [manualOverrideAttendance, setManualOverrideAttendance] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  const [docFile, setDocFile] = useState<File | null>(null);
  const [docDataUrl, setDocDataUrl] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [savedSubmission, setSavedSubmission] = useState<Submission | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await fetchBootstrapData();
      if (!active) return;
      setSettings(data.settings);
      setFields(data.fields);
      setRooms(data.rooms.filter((r) => r.is_active));
      setStudents(data.students.filter((s) => s.is_active));
      setSupabaseReady(data.supabaseReady);

      const savedEmail =
        typeof window !== "undefined"
          ? localStorage.getItem("mom_invigilator_email") || ""
          : "";
      const savedName =
        typeof window !== "undefined"
          ? localStorage.getItem("mom_invigilator_name") || ""
          : "";

      const dayField = data.fields.find((f) => f.field_key === "day");
      const todayDay = getTodayDayName();
      const dayOptions = Array.isArray(dayField?.options) ? dayField.options : [];
      const matchedDay =
        dayOptions.find((d) => d.toLowerCase() === todayDay.toLowerCase()) || "";

      const initial: Record<string, FormValue> = {
        email: savedEmail,
        invigilator_name: savedName,
        date: getTodayDateString(),
        day: matchedDay,
        subjects: [],
      };
      setValues(initial);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Selected room object (matches either room.name or field option)
  const selectedRoomName = String(values.room ?? "");
  const selectedRoom = useMemo(
    () => rooms.find((r) => r.name === selectedRoomName) || null,
    [rooms, selectedRoomName]
  );

  const roomStudents = useMemo(() => {
    if (!selectedRoom) return [];
    return students
      .filter((s) => s.room_id === selectedRoom.id)
      .sort((a, b) => a.student_no - b.student_no);
  }, [students, selectedRoom]);

  const filteredRoomStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return roomStudents;
    return roomStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nis.toLowerCase().includes(q) ||
        s.kelas.toLowerCase().includes(q)
    );
  }, [roomStudents, studentSearch]);

  const absentStudentList: AbsentStudent[] = useMemo(() => {
    return roomStudents
      .filter((s) => absentIds.has(s.id))
      .map((s) => ({
        id: s.id,
        student_no: s.student_no,
        nis: s.nis,
        name: s.name,
        kelas: s.kelas,
      }));
  }, [roomStudents, absentIds]);

  // Sync attendance fields when room or absentIds changes (unless manual override active)
  const syncAttendanceFromRoster = (
    roster: Student[],
    absentSet: Set<string>
  ) => {
    const expected = roster.length;
    const absentCount = roster.filter((s) => absentSet.has(s.id)).length;
    const attendees = Math.max(0, expected - absentCount);
    const absentText =
      absentCount === 0
        ? "None (All present)"
        : roster
            .filter((s) => absentSet.has(s.id))
            .map((s, i) => `${i + 1}. ${s.name} (${s.kelas})`)
            .join("\n");

    setValues((prev) => ({
      ...prev,
      expected_count: expected,
      attendees_count: attendees,
      absent_count: absentCount,
      absent_names: absentText,
    }));
  };

  const handleRoomChange = (roomName: string) => {
    const nextAbsent = new Set<string>();
    setAbsentIds(nextAbsent);
    setManualOverrideAttendance(false);
    setStudentSearch("");
    setValues((prev) => ({ ...prev, room: roomName }));

    const rm = rooms.find((r) => r.name === roomName);
    if (rm) {
      const roster = students
        .filter((s) => s.room_id === rm.id)
        .sort((a, b) => a.student_no - b.student_no);
      const expected = roster.length;
      setValues((prev) => ({
        ...prev,
        room: roomName,
        expected_count: expected,
        attendees_count: expected,
        absent_count: 0,
        absent_names: "None (All present)",
      }));
    }
  };

  const toggleStudentAbsent = (studentId: string) => {
    const next = new Set(absentIds);
    if (next.has(studentId)) {
      next.delete(studentId);
    } else {
      next.add(studentId);
    }
    setAbsentIds(next);
    setManualOverrideAttendance(false);
    syncAttendanceFromRoster(roomStudents, next);
  };

  const markAllPresent = () => {
    const next = new Set<string>();
    setAbsentIds(next);
    setManualOverrideAttendance(false);
    syncAttendanceFromRoster(roomStudents, next);
  };

  const setFieldValue = (key: string, val: FormValue) => {
    if (
      key === "expected_count" ||
      key === "attendees_count" ||
      key === "absent_count" ||
      key === "absent_names"
    ) {
      setManualOverrideAttendance(true);
    }
    if (key === "email" && typeof window !== "undefined") {
      localStorage.setItem("mom_invigilator_email", String(val ?? ""));
    }
    if (key === "invigilator_name" && typeof window !== "undefined") {
      localStorage.setItem("mom_invigilator_name", String(val ?? ""));
    }
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const toggleCheckboxOption = (key: string, option: string) => {
    const current = Array.isArray(values[key]) ? (values[key] as string[]) : [];
    const exists = current.includes(option);
    const updated = exists
      ? current.filter((item) => item !== option)
      : [...current, option];
    setFieldValue(key, updated);
  };

  const handleDocumentationChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Documentation must be an image file (PNG, JPG, or WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Documentation image must be 10 MB or smaller.");
      return;
    }
    setErrorMsg(null);
    setDocFile(file);
    const dataUrl = await fileToDataUrl(file);
    setDocDataUrl(dataUrl);
    setFieldValue("documentation", file.name);
  };

  const activeFields = useMemo(
    () =>
      fields
        .filter((f) => f.is_active)
        .sort((a, b) => a.sort_order - b.sort_order),
    [fields]
  );

  const validateForm = (): string | null => {
    for (const f of activeFields) {
      if (!f.required) continue;
      if (f.field_type === "file_image") {
        if (!docDataUrl) return `Please upload an image for "${f.label}".`;
        continue;
      }
      const val = values[f.field_key];
      if (f.field_type === "checkbox_group") {
        if (!Array.isArray(val) || val.length === 0) {
          return `Please select at least one option for "${f.label}".`;
        }
      } else if (f.field_type === "number") {
        if (val === undefined || val === null || val === "") {
          return `Please fill in "${f.label}".`;
        }
      } else if (val === undefined || val === null || String(val).trim() === "") {
        return `Please fill in "${f.label}".`;
      }
    }
    return null;
  };

  const buildSnapshot = (): FormSnapshot => ({
    header: settings,
    fields: activeFields,
    values,
    absent_students: absentStudentList,
    documentation_data_url: docDataUrl,
  });

  const handlePreview = async () => {
    setErrorMsg(null);
    setPreviewing(true);
    try {
      const snapshot = buildSnapshot();
      const blob = await generateMomPdfBlob(snapshot);
      setPreviewBlob(blob);
      setPreviewOpen(true);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to generate PDF preview."
      );
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const validationErr = validateForm();
    if (validationErr) {
      setErrorMsg(validationErr);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      const snapshot = buildSnapshot();
      const pdfBlob = await generateMomPdfBlob(snapshot);
      setPreviewBlob(pdfBlob);

      if (!supabaseReady) {
        // Local Preview Mode: open PDF preview so user can inspect & download immediately
        setPreviewOpen(true);
        setErrorMsg(
          "PDF generated locally! Connect Supabase in .env.local to save it on the server for others to view."
        );
        return;
      }

      const { submission } = await saveSubmissionToSupabase({
        snapshot,
        pdfBlob,
        docFile,
        roomId: selectedRoom?.id ?? null,
        roomName: selectedRoomName || "Unspecified Room",
      });
      setSavedSubmission(submission);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to save Minutes of Meeting."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopySavedLink = async () => {
    if (!savedSubmission?.pdf_url) return;
    await navigator.clipboard.writeText(savedSubmission.pdf_url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const renderField = (field: FormField) => {
    const val = values[field.field_key];

    // Special room selector using live rooms list if available
    if (field.field_key === "room") {
      const roomOptions =
        rooms.length > 0
          ? rooms.map((r) => r.name)
          : Array.isArray(field.options)
          ? field.options
          : [];
      return (
        <select
          value={String(val ?? "")}
          onChange={(e) => handleRoomChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 focus:outline-none"
        >
          <option value="">Choose exam room...</option>
          {roomOptions.map((opt) => {
            const rm = rooms.find((r) => r.name === opt);
            const count = rm
              ? students.filter((s) => s.room_id === rm.id).length
              : null;
            return (
              <option key={opt} value={opt}>
                {opt}
                {count !== null ? ` (${count} students)` : ""}
              </option>
            );
          })}
        </select>
      );
    }

    switch (field.field_type) {
      case "text":
      case "email":
      case "date":
      case "time":
        return (
          <input
            type={field.field_type}
            value={String(val ?? "")}
            onChange={(e) => setFieldValue(field.field_key, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 focus:outline-none"
          />
        );

      case "number":
        return (
          <input
            type="number"
            min={0}
            value={val === undefined || val === null ? "" : String(val)}
            onChange={(e) =>
              setFieldValue(
                field.field_key,
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            placeholder="0"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 focus:outline-none"
          />
        );

      case "textarea":
        return (
          <textarea
            rows={3}
            value={String(val ?? "")}
            onChange={(e) => setFieldValue(field.field_key, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 focus:outline-none"
          />
        );

      case "dropdown": {
        const opts = Array.isArray(field.options) ? field.options : [];
        return (
          <select
            value={String(val ?? "")}
            onChange={(e) => setFieldValue(field.field_key, e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 focus:outline-none"
          >
            <option value="">Choose...</option>
            {opts.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      }

      case "radio": {
        const opts = Array.isArray(field.options) ? field.options : [];
        return (
          <div className="flex flex-wrap gap-2.5">
            {opts.map((opt) => {
              const checked = val === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFieldValue(field.field_key, opt)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    checked
                      ? "border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-xs"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`h-3.5 w-3.5 rounded-full border ${
                      checked
                        ? "border-white bg-white ring-2 ring-[#1e3a5f] ring-inset"
                        : "border-slate-400"
                    }`}
                  />
                  {opt}
                </button>
              );
            })}
          </div>
        );
      }

      case "checkbox_group": {
        const opts = Array.isArray(field.options) ? field.options : [];
        const selected = Array.isArray(val) ? val : [];
        return (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {opts.map((opt) => {
              const checked = selected.includes(opt);
              return (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    checked
                      ? "border-[#1e3a5f] bg-[#eef2f7] font-medium text-[#1e3a5f]"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCheckboxOption(field.field_key, opt)}
                    className="h-4 w-4 rounded border-slate-300 accent-[#1e3a5f]"
                  />
                  <span className="truncate">{opt}</span>
                </label>
              );
            })}
          </div>
        );
      }

      case "scale_5": {
        const opts = !Array.isArray(field.options)
          ? (field.options as ScaleOptions)
          : { minLabel: "Less", maxLabel: "Very Good" };
        const currentScore = Number(val ?? 0);
        return (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-medium text-slate-500">
              {opts.minLabel || "Less"}
            </span>
            <div className="grid grid-cols-5 gap-2 sm:flex sm:gap-3">
              {[1, 2, 3, 4, 5].map((num) => {
                const active = currentScore === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFieldValue(field.field_key, num)}
                    className={`flex h-10 w-full items-center justify-center rounded-lg border text-sm font-semibold transition sm:w-12 ${
                      active
                        ? "border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-xs"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            <span className="text-right text-xs font-medium text-slate-500">
              {opts.maxLabel || "Very Good"}
            </span>
          </div>
        );
      }

      case "file_image":
        return (
          <div className="space-y-3">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center transition hover:border-[#1e3a5f] hover:bg-slate-100/60">
              <FileUp className="mb-2 h-7 w-7 text-[#1e3a5f]" />
              <span className="text-sm font-medium text-slate-700">
                {docFile ? docFile.name : "Click to upload exam photo"}
              </span>
              <span className="mt-1 text-xs text-slate-500">
                PNG, JPG, or WEBP up to 10 MB — embedded directly into the PDF
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleDocumentationChange}
                className="hidden"
              />
            </label>
            {docDataUrl && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                <div className="mb-1.5 flex items-center justify-between px-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Attached Documentation Preview
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDocFile(null);
                      setDocDataUrl(null);
                      setFieldValue("documentation", null);
                    }}
                    className="text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <img
                  src={docDataUrl}
                  alt="Documentation preview"
                  className="max-h-56 w-full rounded-lg object-contain bg-slate-50"
                />
              </div>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading Minutes of Meeting form...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Institutional Dual-Logo Header Banner */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="h-2 bg-[#1e3a5f]" />
        <div className="flex flex-col items-center justify-between gap-4 px-5 py-5 sm:flex-row sm:px-8">
          <div className="flex h-12 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white px-2 py-1 sm:h-14 sm:w-44">
            {settings.left_logo_url ? (
              <img
                src={settings.left_logo_url}
                alt="Left Logo"
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-center text-[10px] font-medium text-slate-400">
                LEFT LOGO
              </span>
            )}
          </div>

          <div className="flex-1 text-center">
            <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              {settings.header_institution}
            </div>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight text-[#1e3a5f] sm:text-2xl">
              {settings.header_title}
            </h1>
            <div className="text-sm font-semibold text-slate-700">
              {settings.header_subtitle}
            </div>
            {settings.header_address && (
              <div className="mt-0.5 text-xs text-slate-500">
                {settings.header_address}
              </div>
            )}
          </div>

          <div className="flex h-12 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white px-2 py-1 sm:h-14 sm:w-44">
            {settings.right_logo_url ? (
              <img
                src={settings.right_logo_url}
                alt="Right Logo"
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-center text-[10px] font-medium text-slate-400">
                RIGHT LOGO
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Saved Success Card */}
      {savedSubmission && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <h2 className="text-base font-bold text-emerald-950">
                  Minutes of Meeting PDF Saved!
                </h2>
                <p className="mt-0.5 text-sm text-emerald-800">
                  {savedSubmission.room_name} • {savedSubmission.exam_date} • Session{" "}
                  {savedSubmission.session} ({savedSubmission.invigilator_name})
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={savedSubmission.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open PDF
              </a>
              <a
                href={savedSubmission.pdf_url}
                download
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
              <button
                type="button"
                onClick={handleCopySavedLink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Link
                  </>
                )}
              </button>
              <Link
                href="/submissions"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                View All PDFs
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Error / Info Alert */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {SECTION_ORDER.map((sectionKey) => {
          const sectionFields = activeFields.filter(
            (f) => f.section === sectionKey
          );
          if (sectionFields.length === 0) return null;

          return (
            <section
              key={sectionKey}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
            >
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-[#1e3a5f]">
                  {SECTION_LABELS[sectionKey]}
                </h2>
                {sectionKey === "attendance" && selectedRoom && (
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {manualOverrideAttendance
                        ? "Manual override"
                        : "Auto-synced from roster"}
                    </span>
                    {manualOverrideAttendance && (
                      <button
                        type="button"
                        onClick={() => {
                          setManualOverrideAttendance(false);
                          syncAttendanceFromRoster(roomStudents, absentIds);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#1e3a5f] hover:underline"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Re-sync
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Interactive Room Attendance Checklist inside Attendance Section */}
              {sectionKey === "attendance" && (
                <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {selectedRoom
                          ? `${selectedRoom.name} — Student Checklist (${roomStudents.length} Students)`
                          : "Select a Room above to load its student checklist"}
                      </div>
                      <p className="text-xs text-slate-500">
                        All students start marked Present. Tap any student who is
                        absent to auto-update attendance counts and names.
                      </p>
                    </div>
                    {selectedRoom && roomStudents.length > 0 && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          placeholder="Filter student..."
                          className="w-40 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-[#1e3a5f] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={markAllPresent}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                          All Present
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedRoom && roomStudents.length > 0 ? (
                    <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                      {filteredRoomStudents.map((st) => {
                        const isAbsent = absentIds.has(st.id);
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => toggleStudentAbsent(st.id)}
                            className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition ${
                              isAbsent
                                ? "border-rose-300 bg-rose-50 text-rose-900 shadow-xs"
                                : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="truncate text-xs font-semibold">
                                {st.student_no}. {st.name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                NIS: {st.nis} • {st.kelas}
                              </div>
                            </div>
                            <span
                              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                isAbsent
                                  ? "bg-rose-600 text-white"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {isAbsent ? (
                                <>
                                  <UserX className="h-3 w-3" />
                                  Absent
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3 w-3" />
                                  Present
                                </>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-4 text-center text-xs text-slate-500">
                      Choose a Room in the section above to see the student roster
                      and auto-fill attendance.
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-5">
                {sectionFields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-800">
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-rose-600">*</span>
                      )}
                    </label>
                    {field.description && (
                      <p className="text-xs text-slate-500">
                        {field.description}
                      </p>
                    )}
                    {renderField(field)}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Sticky / Bottom Action Bar */}
        <div
          className={`flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:px-6 ${
            supabaseReady ? "sm:justify-end" : "sm:justify-between"
          }`}
        >
          {!supabaseReady && (
            <div className="text-xs text-slate-500">
              Local Preview Mode: Preview &amp; download A4 PDF now, or connect Supabase to save on server.
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewing || submitting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-60 sm:flex-initial"
            >
              {previewing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Preview PDF
            </button>
            <button
              type="submit"
              disabled={submitting || previewing}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#162d4a] disabled:opacity-60 sm:flex-initial"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {supabaseReady ? "Generate & Save PDF" : "Generate PDF Preview"}
            </button>
          </div>
        </div>
      </form>

      <PdfPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Preview — ${selectedRoomName || "Minutes of Meeting"}`}
        pdfBlob={previewBlob}
        downloadFilename={`mom-${(selectedRoomName || "exam")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")}-${values.date || "report"}.pdf`}
      />
    </div>
  );
}
