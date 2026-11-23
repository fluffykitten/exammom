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
  UserPlus,
  RefreshCw,
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
  const [newRoomCategory, setNewRoomCategory] = useState<
    "AKHWAT" | "IKHWAN" | "LAB"
  >("AKHWAT");
  const [newStudentNis, setNewStudentNis] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentKelas, setNewStudentKelas] = useState("");
  const [bulkCsv, setBulkCsv] = useState("");
  const [syncingDefaults, setSyncingDefaults] = useState(false);

  // Assign existing students state
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [assignSourceRoomId, setAssignSourceRoomId] = useState<string>("");
  const [assignClassFilter, setAssignClassFilter] = useState<string>("");
  const [assignSearch, setAssignSearch] = useState("");
  const [assignMode, setAssignMode] = useState<"copy" | "move">("copy");
  const [selectedAssignIds, setSelectedAssignIds] = useState<Set<string>>(
    new Set()
  );
  const [assigningStudents, setAssigningStudents] = useState(false);

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

  const missingDefaultRooms = useMemo(
    () =>
      DEFAULT_ROOMS.filter(
        (d) => !rooms.some((r) => r.name.toUpperCase() === d.name.toUpperCase())
      ),
    [rooms]
  );

  const sessionField = useMemo(
    () => fields.find((f) => f.field_key === "session") || null,
    [fields]
  );

  const missingThirdSession = useMemo(() => {
    if (!sessionField || !Array.isArray(sessionField.options)) return false;
    return !sessionField.options.includes("3rd");
  }, [sessionField]);

  const handleSyncMissingDefaults = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSyncingDefaults(true);

    try {
      if (missingDefaultRooms.length > 0) {
        const { data: roomRows, error: roomErr } = await supabase
          .from("rooms")
          .upsert(
            missingDefaultRooms.map((r) => ({
              name: r.name,
              category: r.category,
              sort_order: r.sort_order,
              is_active: r.is_active,
            })),
            { onConflict: "name" }
          )
          .select("*");
        if (roomErr) throw roomErr;

        const insertedRooms = (roomRows as Room[]) ?? [];
        const roomIdBySeedId = new Map<string, string>();
        for (const seedRoom of missingDefaultRooms) {
          const match = insertedRooms.find(
            (r) => r.name.toUpperCase() === seedRoom.name.toUpperCase()
          );
          if (match) roomIdBySeedId.set(seedRoom.id, match.id);
        }

        const studentSeeds = DEFAULT_STUDENTS.filter((st) =>
          roomIdBySeedId.has(st.room_id)
        ).map((st) => ({
          room_id: roomIdBySeedId.get(st.room_id)!,
          student_no: st.student_no,
          nis: st.nis,
          name: st.name,
          kelas: st.kelas,
          is_active: st.is_active,
        }));

        if (studentSeeds.length > 0) {
          const { error: stErr } = await supabase
            .from("students")
            .upsert(studentSeeds, {
              onConflict: "room_id,nis",
              ignoreDuplicates: true,
            });
          if (stErr) throw stErr;
        }
      }

      if (missingThirdSession && sessionField) {
        const currentOpts = Array.isArray(sessionField.options)
          ? sessionField.options
          : [];
        const nextOpts = [...currentOpts, "3rd"];
        const { error: sessErr } = await supabase
          .from("form_fields")
          .update({ options: nextOpts })
          .eq("id", sessionField.id);
        if (sessErr) throw sessErr;
      }

      await loadData();
      flash("ok", "Synced new rooms, student rosters, and 3rd session.");
    } catch (err) {
      flash(
        "err",
        err instanceof Error ? err.message : "Failed to sync default updates."
      );
    } finally {
      setSyncingDefaults(false);
    }
  };

  const selectedRoomNisSet = useMemo(
    () => new Set(selectedRoomStudents.map((s) => s.nis.trim().toLowerCase())),
    [selectedRoomStudents]
  );

  const availableClasses = useMemo(
    () =>
      Array.from(
        new Set(
          students.map((s) => s.kelas.trim()).filter((k) => k && k !== "-")
        )
      ).sort(),
    [students]
  );

  const roomNameById = useMemo(
    () => new Map(rooms.map((r) => [r.id, r.name])),
    [rooms]
  );

  const assignCandidates = useMemo(() => {
    const q = assignSearch.trim().toLowerCase();
    const seenNis = new Set<string>();
    const list: Student[] = [];

    for (const st of students) {
      if (st.room_id === selectedRoomId) continue;
      if (assignSourceRoomId && st.room_id !== assignSourceRoomId) continue;
      if (assignClassFilter && st.kelas !== assignClassFilter) continue;
      if (
        q &&
        !st.name.toLowerCase().includes(q) &&
        !st.nis.toLowerCase().includes(q) &&
        !st.kelas.toLowerCase().includes(q)
      ) {
        continue;
      }
      const normNis = st.nis.trim().toLowerCase();
      // Avoid duplicate student entries when browsing all rooms in copy mode
      if (assignMode === "copy" && !assignSourceRoomId) {
        if (seenNis.has(normNis)) continue;
        seenNis.add(normNis);
      }
      list.push(st);
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [
    students,
    selectedRoomId,
    assignSourceRoomId,
    assignClassFilter,
    assignSearch,
    assignMode,
  ]);

  const selectableCandidates = useMemo(
    () =>
      assignCandidates.filter(
        (st) => !selectedRoomNisSet.has(st.nis.trim().toLowerCase())
      ),
    [assignCandidates, selectedRoomNisSet]
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
    setSelectedAssignIds(new Set());
    setNewRoomName("");
    flash("ok", `Added room "${created.name}".`);
  };

  const toggleAssignCandidate = (id: string) => {
    setSelectedAssignIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllCandidates = () => {
    const allSelected =
      selectableCandidates.length > 0 &&
      selectableCandidates.every((c) => selectedAssignIds.has(c.id));
    if (allSelected) {
      setSelectedAssignIds((prev) => {
        const next = new Set(prev);
        for (const c of selectableCandidates) next.delete(c.id);
        return next;
      });
      return;
    }
    setSelectedAssignIds((prev) => {
      const next = new Set(prev);
      for (const c of selectableCandidates) next.add(c.id);
      return next;
    });
  };

  const handleAssignSelected = async () => {
    if (!selectedRoomId || selectedAssignIds.size === 0) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const picked = selectableCandidates.filter((s) =>
      selectedAssignIds.has(s.id)
    );
    if (picked.length === 0) return;

    setAssigningStudents(true);
    let nextNo =
      selectedRoomStudents.reduce((m, s) => Math.max(m, s.student_no), 0) + 1;

    if (assignMode === "copy") {
      const uniquePicked: Student[] = [];
      const seen = new Set<string>();
      for (const st of picked) {
        const key = st.nis.trim().toLowerCase();
        if (seen.has(key) || selectedRoomNisSet.has(key)) continue;
        seen.add(key);
        uniquePicked.push(st);
      }

      const rows = uniquePicked.map((st) => ({
        room_id: selectedRoomId,
        student_no: nextNo++,
        nis: st.nis,
        name: st.name,
        kelas: st.kelas,
        is_active: true,
      }));

      const { data, error } = await supabase
        .from("students")
        .insert(rows)
        .select("*");
      setAssigningStudents(false);
      if (error) {
        flash("err", error.message);
        return;
      }
      setStudents((prev) => [...prev, ...((data as Student[]) ?? [])]);
      setSelectedAssignIds(new Set());
      flash("ok", `Assigned ${rows.length} student(s) to room.`);
      return;
    }

    const seenMoveNis = new Set<string>();
    const movable: { id: string; student_no: number }[] = [];
    for (const st of picked) {
      const key = st.nis.trim().toLowerCase();
      if (seenMoveNis.has(key) || selectedRoomNisSet.has(key)) continue;
      seenMoveNis.add(key);
      movable.push({ id: st.id, student_no: nextNo++ });
    }

    const results = await Promise.all(
      movable.map((item) =>
        supabase
          .from("students")
          .update({ room_id: selectedRoomId, student_no: item.student_no })
          .eq("id", item.id)
          .select("*")
          .single()
      )
    );
    setAssigningStudents(false);

    const firstErr = results.find((r) => r.error)?.error;
    if (firstErr) {
      flash("err", firstErr.message);
      await loadData();
      return;
    }

    const updatedById = new Map(
      results
        .filter((r) => r.data)
        .map((r) => [(r.data as Student).id, r.data as Student])
    );
    setStudents((prev) => prev.map((s) => updatedById.get(s.id) ?? s));
    setSelectedAssignIds(new Set());
    flash("ok", `Moved ${movable.length} student(s) to room.`);
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

  const handleClearRoomStudents = async () => {
    if (!selectedRoomId || selectedRoomStudents.length === 0) return;
    const roomName =
      rooms.find((r) => r.id === selectedRoomId)?.name || "this room";
    if (
      !confirm(
        `Remove all ${selectedRoomStudents.length} student(s) from ${roomName}?`
      )
    ) {
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase
      .from("students")
      .delete()
      .eq("room_id", selectedRoomId);
    if (error) {
      flash("err", error.message);
      return;
    }
    setStudents((prev) => prev.filter((s) => s.room_id !== selectedRoomId));
    flash("ok", `Cleared all students from ${roomName}.`);
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
    const seen = new Set(selectedRoomNisSet);
    const rows: {
      room_id: string;
      student_no: number;
      nis: string;
      name: string;
      kelas: string;
      is_active: boolean;
    }[] = [];
    let skipped = 0;

    for (const line of lines) {
      const parts = line.split(/[,\t;]/).map((p) => p.trim());
      const parsed =
        parts.length >= 4 && /^\d+$/.test(parts[0])
          ? {
              student_no: Number(parts[0]),
              nis: parts[1],
              name: parts[2].toUpperCase(),
              kelas: parts[3].toUpperCase(),
            }
          : {
              student_no: nextNo++,
              nis: parts[0] || "-",
              name: (parts[1] || "UNNAMED").toUpperCase(),
              kelas: (parts[2] || "-").toUpperCase(),
            };
      const nisKey = parsed.nis.trim().toLowerCase();
      if (seen.has(nisKey)) {
        skipped++;
        continue;
      }
      seen.add(nisKey);
      rows.push({
        room_id: selectedRoomId,
        ...parsed,
        is_active: true,
      });
    }

    if (rows.length === 0) {
      flash("err", "All listed NIS values are already assigned to this room.");
      return;
    }

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
    flash(
      "ok",
      skipped > 0
        ? `Imported ${rows.length} student(s) (${skipped} duplicate skipped).`
        : `Imported ${rows.length} student(s) into room.`
    );
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
            {(missingDefaultRooms.length > 0 || missingThirdSession) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <div className="font-semibold">Database updates available</div>
                <p className="mt-0.5 text-[11px] text-amber-800">
                  {missingDefaultRooms.length > 0
                    ? `${missingDefaultRooms.length} new room(s) with student rosters`
                    : ""}
                  {missingDefaultRooms.length > 0 && missingThirdSession
                    ? " and "
                    : ""}
                  {missingThirdSession ? "3rd session option" : ""} can be synced.
                </p>
                <button
                  type="button"
                  onClick={handleSyncMissingDefaults}
                  disabled={syncingDefaults}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162d4a] focus-visible:ring-2 focus-visible:ring-[#1e3a5f] focus-visible:ring-offset-1 focus-visible:outline-none disabled:opacity-60"
                >
                  {syncingDefaults ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Sync Updates
                </button>
              </div>
            )}

            <form onSubmit={handleAddRoom} className="flex gap-2">
              <input
                type="text"
                placeholder="New room name..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-[#1e3a5f] focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/30 focus-visible:outline-none"
              />
              <select
                value={newRoomCategory}
                onChange={(e) =>
                  setNewRoomCategory(
                    e.target.value as "AKHWAT" | "IKHWAN" | "LAB"
                  )
                }
                aria-label="Room category"
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-[#1e3a5f] focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/30 focus-visible:outline-none"
              >
                <option value="LAB">LAB</option>
                <option value="AKHWAT">AKHWAT</option>
                <option value="IKHWAN">IKHWAN</option>
              </select>
              <button
                type="submit"
                className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162d4a] focus-visible:ring-2 focus-visible:ring-[#1e3a5f] focus-visible:ring-offset-1 focus-visible:outline-none"
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
                    onClick={() => {
                      setSelectedRoomId(rm.id);
                      setSelectedAssignIds(new Set());
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-[#1e3a5f] focus-visible:outline-none ${
                      active
                        ? "bg-[#1e3a5f] text-white"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="truncate">{rm.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                        active
                          ? "bg-white/20 text-white"
                          : count === 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-200 text-slate-700"
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Students in{" "}
                {rooms.find((r) => r.id === selectedRoomId)?.name || "Room"} (
                {selectedRoomStudents.length})
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignPanel((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-[#1e3a5f] focus-visible:outline-none ${
                    showAssignPanel
                      ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {showAssignPanel ? "Hide Student Picker" : "Assign Existing Students"}
                </button>
                {selectedRoomStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearRoomStudents}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear Room
                  </button>
                )}
              </div>
            </div>

            {/* Assign Existing Students Picker */}
            {showAssignPanel && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Assign Students from Existing Roster
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Copy keeps students in their original room (recommended for labs); Move transfers them here.
                    </p>
                  </div>
                  <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setAssignMode("copy");
                        setSelectedAssignIds(new Set());
                      }}
                      className={`rounded-md px-2.5 py-1 font-semibold transition ${
                        assignMode === "copy"
                          ? "bg-[#1e3a5f] text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Copy to room
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAssignMode("move");
                        setSelectedAssignIds(new Set());
                      }}
                      className={`rounded-md px-2.5 py-1 font-semibold transition ${
                        assignMode === "move"
                          ? "bg-[#1e3a5f] text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Move to room
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input
                    type="text"
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                    placeholder="Search name, NIS, or class..."
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-[#1e3a5f] focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/30 focus-visible:outline-none"
                  />
                  <select
                    value={assignSourceRoomId}
                    onChange={(e) => {
                      setAssignSourceRoomId(e.target.value);
                      setSelectedAssignIds(new Set());
                    }}
                    aria-label="Filter by source room"
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-[#1e3a5f] focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/30 focus-visible:outline-none"
                  >
                    <option value="">All Source Rooms</option>
                    {rooms
                      .filter((r) => r.id !== selectedRoomId)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                  </select>
                  <select
                    value={assignClassFilter}
                    onChange={(e) => {
                      setAssignClassFilter(e.target.value);
                      setSelectedAssignIds(new Set());
                    }}
                    aria-label="Filter by class"
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-[#1e3a5f] focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/30 focus-visible:outline-none"
                  >
                    <option value="">All Classes</option>
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAllCandidates}
                    disabled={selectableCandidates.length === 0}
                    className="font-semibold text-[#1e3a5f] hover:underline disabled:text-slate-400 disabled:no-underline"
                  >
                    {selectableCandidates.length > 0 &&
                    selectableCandidates.every((c) => selectedAssignIds.has(c.id))
                      ? `Deselect all shown (${selectableCandidates.length})`
                      : `Select all shown (${selectableCandidates.length})`}
                  </button>
                  <span className="text-slate-600">
                    {selectedAssignIds.size} selected
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
                  {assignCandidates.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-600">
                      No matching students found in other rooms. Try clearing your search or filters.
                    </div>
                  ) : (
                    assignCandidates.map((st) => {
                      const alreadyInRoom = selectedRoomNisSet.has(
                        st.nis.trim().toLowerCase()
                      );
                      const checked = selectedAssignIds.has(st.id);
                      const sourceRoomName = roomNameById.get(st.room_id) || "";
                      return (
                        <label
                          key={st.id}
                          className={`flex items-center justify-between gap-3 px-3 py-2 text-xs ${
                            alreadyInRoom
                              ? "cursor-not-allowed bg-slate-50 text-slate-500"
                              : "cursor-pointer hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <input
                              type="checkbox"
                              disabled={alreadyInRoom}
                              checked={checked}
                              onChange={() => toggleAssignCandidate(st.id)}
                              className="h-4 w-4 rounded border-slate-300 accent-[#1e3a5f]"
                            />
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-slate-900">
                                {st.name}
                              </div>
                              <div className="text-[11px] text-slate-600">
                                NIS: {st.nis} • {st.kelas}
                                {sourceRoomName ? ` • ${sourceRoomName}` : ""}
                              </div>
                            </div>
                          </div>
                          {alreadyInRoom && (
                            <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                              Already in room
                            </span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAssignSelected}
                    disabled={assigningStudents || selectedAssignIds.size === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#162d4a] focus-visible:ring-2 focus-visible:ring-[#1e3a5f] focus-visible:ring-offset-1 focus-visible:outline-none disabled:opacity-50"
                  >
                    {assigningStudents ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                    {assignMode === "copy" ? "Assign Selected" : "Move Selected"} (
                    {selectedAssignIds.size})
                  </button>
                </div>
              </div>
            )}

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
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#1e3a5f] focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/30 focus-visible:outline-none"
              />
              <input
                type="text"
                placeholder="Full Name"
                required
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs sm:col-span-2 focus:border-[#1e3a5f] focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/30 focus-visible:outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Class (e.g. X IPA 2)"
                  value={newStudentKelas}
                  onChange={(e) => setNewStudentKelas(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#1e3a5f] focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/30 focus-visible:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#162d4a] focus-visible:ring-2 focus-visible:ring-[#1e3a5f] focus-visible:ring-offset-1 focus-visible:outline-none"
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
                  {selectedRoomStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-xs text-slate-600"
                      >
                        No students assigned to this room yet. Add students above, assign existing students, or import via CSV.
                      </td>
                    </tr>
                  ) : (
                    selectedRoomStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium">{st.student_no}</td>
                        <td className="px-3 py-2 text-slate-600">{st.nis}</td>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {st.name}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{st.kelas}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(st)}
                            className="text-rose-600 hover:underline focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-1 text-xs font-semibold text-slate-800">
                Bulk Import Students (CSV)
              </div>
              <p className="mb-2 text-[11px] text-slate-600">
                Paste lines as <code>NIS, NAME, CLASS</code> or{" "}
                <code>NO, NIS, NAME, CLASS</code>
              </p>
              <textarea
                rows={3}
                value={bulkCsv}
                onChange={(e) => setBulkCsv(e.target.value)}
                placeholder="262710099, AHMAD FAUZAN, X IPA 1"
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-[#1e3a5f] focus-visible:ring-2 focus-visible:ring-[#1e3a5f]/30 focus-visible:outline-none"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#1e3a5f] focus-visible:outline-none"
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
