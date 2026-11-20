"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Lock,
  LogOut,
  Plus,
  Save,
  Trash2,
  Users,
  Sliders,
  LayoutTemplate,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { fetchBootstrapData, uploadHeaderLogo } from "@/lib/data-service";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_FORM_FIELDS,
  DEFAULT_ROOMS,
  DEFAULT_STUDENTS,
} from "@/lib/seed-data";
import {
  SECTION_LABELS,
  type AppSettings,
  type FieldSection,
  type FieldType,
  type FormField,
  type Room,
  type ScaleOptions,
  type Student,
} from "@/types/mom";

type AdminTab = "header" | "fields" | "rooms";

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Paragraph / Long Text" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "dropdown", label: "Dropdown" },
  { value: "radio", label: "Multiple Choice (Radio)" },
  { value: "checkbox_group", label: "Checkboxes" },
  { value: "scale_5", label: "Linear Scale (1–5)" },
  { value: "file_image", label: "Image Upload" },
];

export function AdminClient() {
  const [loading, setLoading] = useState(true);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>("header");

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FORM_FIELDS);
  const [rooms, setRooms] = useState<Room[]>(DEFAULT_ROOMS);
  const [students, setStudents] = useState<Student[]>(DEFAULT_STUDENTS);

  const [savingHeader, setSavingHeader] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState<"left" | "right" | null>(
    null
  );

  // New Field form
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<FieldType>("text");
  const [newFieldSection, setNewFieldSection] = useState<FieldSection>("general");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(true);
  const [savingField, setSavingField] = useState(false);

  // Rooms & Students state
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomCategory, setNewRoomCategory] = useState<"AKHWAT" | "IKHWAN">(
    "AKHWAT"
  );
  const [newStudentNis, setNewStudentNis] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentKelas, setNewStudentKelas] = useState("");
  const [bulkCsv, setBulkCsv] = useState("");

  const loadData = async () => {
    setLoading(true);
    const boot = await fetchBootstrapData();
    setSettings(boot.settings);
    setFields(boot.fields);
    setRooms(boot.rooms);
    setStudents(boot.students);
    setSupabaseReady(boot.supabaseReady);
    if (boot.rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(boot.rooms[0].id);
    }

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      setUserEmail(data.session?.user.email ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flash = (type: "ok" | "err", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setAuthLoading(false);
    if (error) {
      flash("err", error.message);
      return;
    }
    setUserEmail(data.user.email ?? null);
    flash("ok", "Signed in as Admin.");
    loadData();
  };

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserEmail(null);
  };

  // --- HEADER SETTINGS HANDLERS ---
  const handleSaveHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSavingHeader(true);
    const { error } = await supabase.from("app_settings").upsert({
      ...settings,
      id: "default",
      updated_at: new Date().toISOString(),
    });
    setSavingHeader(false);
    if (error) {
      flash("err", error.message);
    } else {
      flash("ok", "PDF Header & Logos saved.");
    }
  };

  const handleLogoUpload = async (
    side: "left" | "right",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(side);
    try {
      const url = await uploadHeaderLogo(side, file);
      const updated = {
        ...settings,
        [side === "left" ? "left_logo_url" : "right_logo_url"]: url,
      };
      setSettings(updated);
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        await supabase.from("app_settings").upsert({
          ...updated,
          id: "default",
          updated_at: new Date().toISOString(),
        });
      }
      flash("ok", `${side === "left" ? "Left" : "Right"} logo uploaded & saved.`);
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "Logo upload failed.");
    } finally {
      setUploadingLogo(null);
    }
  };

  // --- FORM FIELDS HANDLERS ---
  const handleUpdateField = async (updated: FormField) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase
      .from("form_fields")
      .update({
        label: updated.label,
        description: updated.description,
        required: updated.required,
        options: updated.options,
        section: updated.section,
        sort_order: updated.sort_order,
        is_active: updated.is_active,
      })
      .eq("id", updated.id);
    if (error) {
      flash("err", error.message);
      return;
    }
    setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    flash("ok", `Updated "${updated.label}".`);
  };

  const handleMoveField = async (index: number, direction: -1 | 1) => {
    const sorted = [...fields].sort((a, b) => a.sort_order - b.sort_order);
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[targetIdx];
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    await Promise.all([
      supabase
        .from("form_fields")
        .update({ sort_order: b.sort_order })
        .eq("id", a.id),
      supabase
        .from("form_fields")
        .update({ sort_order: a.sort_order })
        .eq("id", b.id),
    ]);

    setFields((prev) =>
      prev.map((f) => {
        if (f.id === a.id) return { ...f, sort_order: b.sort_order };
        if (f.id === b.id) return { ...f, sort_order: a.sort_order };
        return f;
      })
    );
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSavingField(true);
    const slug =
      newFieldLabel
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "") +
      "_" +
      Date.now().toString().slice(-4);
    const maxOrder = fields.reduce((m, f) => Math.max(m, f.sort_order), 0);

    let parsedOptions: string[] | ScaleOptions = [];
    if (
      newFieldType === "dropdown" ||
      newFieldType === "radio" ||
      newFieldType === "checkbox_group"
    ) {
      parsedOptions = newFieldOptions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (newFieldType === "scale_5") {
      parsedOptions = { minLabel: "Less", maxLabel: "Very Good" };
    }

    const { data, error } = await supabase
      .from("form_fields")
      .insert({
        field_key: slug,
        label: newFieldLabel.trim(),
        description: null,
        field_type: newFieldType,
        required: newFieldRequired,
        options: parsedOptions,
        section: newFieldSection,
        sort_order: maxOrder + 1,
        is_active: true,
        is_system: false,
      })
      .select("*")
      .single();

    setSavingField(false);
    if (error) {
      flash("err", error.message);
      return;
    }
    setFields((prev) => [...prev, data as FormField]);
    setNewFieldLabel("");
    setNewFieldOptions("");
    flash("ok", `Added custom field "${newFieldLabel}".`);
  };

  const handleDeleteField = async (field: FormField) => {
    if (field.is_system) {
      flash("err", "System fields cannot be deleted (you can hide them instead).");
      return;
    }
    if (!confirm(`Delete custom field "${field.label}"?`)) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase
      .from("form_fields")
      .delete()
      .eq("id", field.id);
    if (error) {
      flash("err", error.message);
      return;
    }
    setFields((prev) => prev.filter((f) => f.id !== field.id));
    flash("ok", `Deleted "${field.label}".`);
  };

  // --- ROOMS & STUDENTS HANDLERS ---
  const selectedRoomStudents = useMemo(
    () =>
      students
        .filter((s) => s.room_id === selectedRoomId)
        .sort((a, b) => a.student_no - b.student_no),
    [students, selectedRoomId]
  );

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const maxOrder = rooms.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        name: newRoomName.trim().toUpperCase(),
        category: newRoomCategory,
        sort_order: maxOrder + 1,
        is_active: true,
      })
      .select("*")
      .single();
    if (error) {
      flash("err", error.message);
      return;
    }
    const created = data as Room;
    setRooms((prev) => [...prev, created]);
    setSelectedRoomId(created.id);
    setNewRoomName("");
    flash("ok", `Added room "${created.name}".`);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || !newStudentName.trim() || !newStudentNis.trim()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const nextNo =
      selectedRoomStudents.reduce((m, s) => Math.max(m, s.student_no), 0) + 1;
    const { data, error } = await supabase
      .from("students")
      .insert({
        room_id: selectedRoomId,
        student_no: nextNo,
        nis: newStudentNis.trim(),
        name: newStudentName.trim().toUpperCase(),
        kelas: newStudentKelas.trim().toUpperCase() || "-",
        is_active: true,
      })
      .select("*")
      .single();
    if (error) {
      flash("err", error.message);
      return;
    }
    setStudents((prev) => [...prev, data as Student]);
    setNewStudentNis("");
    setNewStudentName("");
    setNewStudentKelas("");
    flash("ok", "Student added to room.");
  };

  const handleDeleteStudent = async (st: Student) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.from("students").delete().eq("id", st.id);
    if (error) {
      flash("err", error.message);
      return;
    }
    setStudents((prev) => prev.filter((x) => x.id !== st.id));
  };

  const handleBulkImport = async () => {
    if (!selectedRoomId || !bulkCsv.trim()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const lines = bulkCsv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    let nextNo =
      selectedRoomStudents.reduce((m, s) => Math.max(m, s.student_no), 0) + 1;
    const rows = lines.map((line) => {
      const parts = line.split(/[,\t;]/).map((p) => p.trim());
      if (parts.length >= 4 && /^\d+$/.test(parts[0])) {
        return {
          room_id: selectedRoomId,
          student_no: Number(parts[0]),
          nis: parts[1],
          name: parts[2].toUpperCase(),
          kelas: parts[3].toUpperCase(),
          is_active: true,
        };
      }
      return {
        room_id: selectedRoomId,
        student_no: nextNo++,
        nis: parts[0] || "-",
        name: (parts[1] || "UNNAMED").toUpperCase(),
        kelas: (parts[2] || "-").toUpperCase(),
        is_active: true,
      };
    });

    const { data, error } = await supabase
      .from("students")
      .insert(rows)
      .select("*");
    if (error) {
      flash("err", error.message);
      return;
    }
    setStudents((prev) => [...prev, ...((data as Student[]) ?? [])]);
    setBulkCsv("");
    flash("ok", `Imported ${rows.length} students into room.`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading Admin Console...
      </div>
    );
  }

  if (!supabaseReady) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h1 className="text-lg font-bold">Connect Supabase to Unlock Admin</h1>
        <p className="mt-2 text-sm text-amber-800">
          Admin configuration saves form fields, left/right PDF header logos,
          and room student rosters to Supabase. Add your keys in{" "}
          <code>.env.local</code>, run <code>supabase/schema.sql</code>, and
          create an Admin user in Supabase Authentication.
        </p>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e3a5f] text-white">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Admin Sign In</h1>
            <p className="text-xs text-slate-500">
              Sign in with your Supabase Auth admin account
            </p>
          </div>
        </div>

        {statusMsg && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="admin@school.sch.id"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Password
            </label>
            <input
              type="password"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={authLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:opacity-60"
          >
            {authLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In to Admin Config
          </button>
        </form>
      </div>
    );
  }

  const sortedFields = [...fields].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Admin Configuration
          </h1>
          <p className="text-sm text-slate-500">
            Signed in as <span className="font-medium">{userEmail}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>

      {statusMsg && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            statusMsg.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {statusMsg.type === "ok" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {statusMsg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("header")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "header"
              ? "bg-[#1e3a5f] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <LayoutTemplate className="h-4 w-4" />
          PDF Header &amp; Logos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("fields")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "fields"
              ? "bg-[#1e3a5f] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Sliders className="h-4 w-4" />
          Form Fields ({fields.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("rooms")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === "rooms"
              ? "bg-[#1e3a5f] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="h-4 w-4" />
          Rooms &amp; Students ({students.length})
        </button>
      </div>

      {/* TAB 1: HEADER & LOGOS */}
      {activeTab === "header" && (
        <form
          onSubmit={handleSaveHeader}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left Logo */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-sm font-semibold text-slate-800">
                Left Heading Picture
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-300 bg-white p-1.5">
                  {settings.left_logo_url ? (
                    <img
                      src={settings.left_logo_url}
                      alt="Left Logo"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400">No Logo</span>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#162d4a]">
                    {uploadingLogo === "left" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ImagePlus className="h-3.5 w-3.5" />
                    )}
                    Upload Left Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload("left", e)}
                      className="hidden"
                    />
                  </label>
                  {settings.left_logo_url && (
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({ ...settings, left_logo_url: null })
                      }
                      className="block text-xs text-rose-600 hover:underline"
                    >
                      Remove left logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Logo */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-sm font-semibold text-slate-800">
                Right Heading Picture
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-300 bg-white p-1.5">
                  {settings.right_logo_url ? (
                    <img
                      src={settings.right_logo_url}
                      alt="Right Logo"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400">No Logo</span>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#162d4a]">
                    {uploadingLogo === "right" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ImagePlus className="h-3.5 w-3.5" />
                    )}
                    Upload Right Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload("right", e)}
                      className="hidden"
                    />
                  </label>
                  {settings.right_logo_url && (
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({ ...settings, right_logo_url: null })
                      }
                      className="block text-xs text-rose-600 hover:underline"
                    >
                      Remove right logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Institution Name
              </label>
              <input
                type="text"
                value={settings.header_institution}
                onChange={(e) =>
                  setSettings({ ...settings, header_institution: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                PDF Document Title
              </label>
              <input
                type="text"
                value={settings.header_title}
                onChange={(e) =>
                  setSettings({ ...settings, header_title: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Subtitle (Exam Name)
              </label>
              <input
                type="text"
                value={settings.header_subtitle}
                onChange={(e) =>
                  setSettings({ ...settings, header_subtitle: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Address / Sub-caption
              </label>
              <input
                type="text"
                value={settings.header_address}
                onChange={(e) =>
                  setSettings({ ...settings, header_address: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                PDF Footer Note
              </label>
              <input
                type="text"
                value={settings.footer_note}
                onChange={(e) =>
                  setSettings({ ...settings, footer_note: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingHeader}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:opacity-60"
            >
              {savingHeader ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Header Settings
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: FORM FIELDS */}
      {activeTab === "fields" && (
        <div className="space-y-6">
          {/* Add Field */}
          <form
            onSubmit={handleAddField}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
          >
            <h2 className="mb-3 text-sm font-bold text-slate-900">
              Add Custom Form Input
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                type="text"
                required
                placeholder="Field Label (e.g. Proctor Signature)"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value as FieldType)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {FIELD_TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <select
                value={newFieldSection}
                onChange={(e) =>
                  setNewFieldSection(e.target.value as FieldSection)
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {Object.entries(SECTION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="accent-[#1e3a5f]"
                  />
                  Required
                </label>
                <button
                  type="submit"
                  disabled={savingField}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#162d4a]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Field
                </button>
              </div>
            </div>
            {(newFieldType === "dropdown" ||
              newFieldType === "radio" ||
              newFieldType === "checkbox_group") && (
              <input
                type="text"
                placeholder="Comma-separated options (e.g. Option A, Option B, Option C)"
                value={newFieldOptions}
                onChange={(e) => setNewFieldOptions(e.target.value)}
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            )}
          </form>

          {/* Existing Fields */}
          <div className="space-y-3">
            {sortedFields.map((field, idx) => (
              <FieldEditorRow
                key={field.id}
                field={field}
                isFirst={idx === 0}
                isLast={idx === sortedFields.length - 1}
                onMove={(dir) => handleMoveField(idx, dir)}
                onSave={handleUpdateField}
                onDelete={() => handleDeleteField(field)}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ROOMS & STUDENTS */}
      {activeTab === "rooms" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Rooms List */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900">Exam Rooms</h2>
            <form onSubmit={handleAddRoom} className="flex gap-2">
              <input
                type="text"
                placeholder="New room name..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
              />
              <select
                value={newRoomCategory}
                onChange={(e) =>
                  setNewRoomCategory(e.target.value as "AKHWAT" | "IKHWAN")
                }
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
              >
                <option value="AKHWAT">AKHWAT</option>
                <option value="IKHWAN">IKHWAN</option>
              </select>
              <button
                type="submit"
                className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white"
              >
                Add
              </button>
            </form>

            <div className="space-y-1.5">
              {rooms.map((rm) => {
                const count = students.filter((s) => s.room_id === rm.id).length;
                const active = rm.id === selectedRoomId;
                return (
                  <button
                    key={rm.id}
                    type="button"
                    onClick={() => setSelectedRoomId(rm.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                      active
                        ? "bg-[#1e3a5f] text-white"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>{rm.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Room Students */}
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Students in{" "}
                {rooms.find((r) => r.id === selectedRoomId)?.name || "Room"} (
                {selectedRoomStudents.length})
              </h2>
            </div>

            <form
              onSubmit={handleAddStudent}
              className="grid grid-cols-1 gap-2 sm:grid-cols-4"
            >
              <input
                type="text"
                placeholder="NIS"
                required
                value={newStudentNis}
                onChange={(e) => setNewStudentNis(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
              <input
                type="text"
                placeholder="Full Name"
                required
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs sm:col-span-2"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Class (e.g. X IPA 2)"
                  value={newStudentKelas}
                  onChange={(e) => setNewStudentKelas(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-semibold text-white"
                >
                  Add
                </button>
              </div>
            </form>

            <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2">No</th>
                    <th className="px-3 py-2">NIS</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Class</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedRoomStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium">{st.student_no}</td>
                      <td className="px-3 py-2 text-slate-500">{st.nis}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {st.name}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{st.kelas}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(st)}
                          className="text-rose-600 hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-1 text-xs font-semibold text-slate-800">
                Bulk Import Students (CSV)
              </div>
              <p className="mb-2 text-[11px] text-slate-500">
                Paste lines as <code>NIS, NAME, CLASS</code> or{" "}
                <code>NO, NIS, NAME, CLASS</code>
              </p>
              <textarea
                rows={3}
                value={bulkCsv}
                onChange={(e) => setBulkCsv(e.target.value)}
                placeholder="262710099, AHMAD FAUZAN, X IPA 1"
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Import to Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldEditorRow({
  field,
  isFirst,
  isLast,
  onMove,
  onSave,
  onDelete,
}: {
  field: FormField;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: -1 | 1) => void;
  onSave: (f: FormField) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<FormField>(field);
  const [optionsText, setOptionsText] = useState(
    Array.isArray(field.options) ? field.options.join(", ") : ""
  );

  useEffect(() => {
    setDraft(field);
    setOptionsText(Array.isArray(field.options) ? field.options.join(", ") : "");
  }, [field]);

  const hasListOptions =
    draft.field_type === "dropdown" ||
    draft.field_type === "radio" ||
    draft.field_type === "checkbox_group";

  const handleSave = () => {
    const nextOptions: string[] | ScaleOptions = hasListOptions
      ? optionsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : draft.options;
    onSave({ ...draft, options: nextOptions });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
            {field.field_type}
          </span>
          <span className="text-xs font-medium text-slate-400">
            key: {field.field_key}
          </span>
          {field.is_system && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              System
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => onMove(-1)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
            title="Move up"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => onMove(1)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
            title="Move down"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          {!field.is_system && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
              title="Delete field"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
            Label
          </label>
          <input
            type="text"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
            Description / Helper
          </label>
          <input
            type="text"
            value={draft.description ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value || null })
            }
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
            Section
          </label>
          <select
            value={draft.section}
            onChange={(e) =>
              setDraft({ ...draft, section: e.target.value as FieldSection })
            }
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
          >
            {Object.entries(SECTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasListOptions && (
        <div className="mt-3">
          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
            Options (comma-separated)
          </label>
          <input
            type="text"
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs">
          <label className="inline-flex items-center gap-1.5 font-medium text-slate-700">
            <input
              type="checkbox"
              checked={draft.required}
              onChange={(e) =>
                setDraft({ ...draft, required: e.target.checked })
              }
              className="accent-[#1e3a5f]"
            />
            Required
          </label>
          <label className="inline-flex items-center gap-1.5 font-medium text-slate-700">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) =>
                setDraft({ ...draft, is_active: e.target.checked })
              }
              className="accent-[#1e3a5f]"
            />
            Active (shown on form)
          </label>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162d4a]"
        >
          <Save className="h-3.5 w-3.5" />
          Save Field
        </button>
      </div>
    </div>
  );
}
