"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Eye,
  FileSpreadsheet,
  Search,
  Trash2,
  Copy,
  Check,
  Loader2,
  FilterX,
  Database,
  Users,
  FileText,
} from "lucide-react";
import { fetchBootstrapData, fetchSubmissions } from "@/lib/data-service";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PdfPreviewModal } from "./PdfPreviewModal";
import type { Submission } from "@/types/mom";

export function SubmissionsClient() {
  const [loading, setLoading] = useState(true);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [filterSession, setFilterSession] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const [roomOptions, setRoomOptions] = useState<string[]>([]);
  const [sessionOptions, setSessionOptions] = useState<string[]>([
    "1st",
    "2nd",
    "3rd",
  ]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);

  const [previewItem, setPreviewItem] = useState<Submission | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    const [subRes, boot] = await Promise.all([
      fetchSubmissions(),
      fetchBootstrapData(),
    ]);
    setSubmissions(subRes.submissions);
    setSupabaseReady(subRes.supabaseReady);
    if (subRes.error) setErrorMsg(subRes.error);

    setRoomOptions(boot.rooms.map((r) => r.name));
    const sessField = boot.fields.find((f) => f.field_key === "session");
    if (sessField && Array.isArray(sessField.options) && sessField.options.length > 0) {
      setSessionOptions(sessField.options);
    }
    const subjField = boot.fields.find((f) => f.field_key === "subjects");
    if (subjField && Array.isArray(subjField.options)) {
      setSubjectOptions(subjField.options);
    }

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      setIsAdmin(Boolean(data.session));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions.filter((s) => {
      if (filterDate && s.exam_date !== filterDate) return false;
      if (filterRoom && s.room_name !== filterRoom) return false;
      if (filterSession && s.session !== filterSession) return false;
      if (filterSubject && !(s.subjects || []).includes(filterSubject)) {
        return false;
      }
      if (q) {
        const hay = [
          s.invigilator_name,
          s.invigilator_email,
          s.room_name,
          ...(s.subjects || []),
          ...(s.absent_students || []).map((a) => `${a.name} ${a.nis}`),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [submissions, search, filterDate, filterRoom, filterSession, filterSubject]);

  const clearFilters = () => {
    setSearch("");
    setFilterDate("");
    setFilterRoom("");
    setFilterSession("");
    setFilterSubject("");
  };

  const handleCopyLink = async (item: Submission) => {
    await navigator.clipboard.writeText(item.pdf_url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (item: Submission) => {
    if (!confirm(`Delete MoM PDF for ${item.room_name} (${item.exam_date})?`)) {
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setDeletingId(item.id);
    try {
      if (item.pdf_path) {
        await supabase.storage.from("mom-pdfs").remove([item.pdf_path]);
      }
      const { error } = await supabase
        .from("submissions")
        .delete()
        .eq("id", item.id);
      if (error) throw error;
      setSubmissions((prev) => prev.filter((x) => x.id !== item.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete submission.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "Created At",
      "Exam Date",
      "Day",
      "Room",
      "Session",
      "Subjects",
      "Invigilator",
      "Email",
      "Expected Participants",
      "Present Participants",
      "Absent Participants",
      "Absent Students",
      "PDF URL",
    ];
    const rows = filtered.map((s) => [
      s.created_at,
      s.exam_date,
      s.exam_day,
      s.room_name,
      s.session,
      (s.subjects || []).join("; "),
      s.invigilator_name,
      s.invigilator_email,
      String(s.expected_count),
      String(s.attendees_count),
      String(s.absent_count),
      (s.absent_students || [])
        .map((a) => `${a.name} (${a.kelas})`)
        .join("; "),
      s.pdf_url,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exam-mom-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalAbsent = useMemo(
    () => filtered.reduce((acc, s) => acc + (Number(s.absent_count) || 0), 0),
    [filtered]
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Submitted Minutes of Meeting
          </h1>
          <p className="text-sm text-slate-500">
            Shared archive of generated exam MoM PDFs stored on Supabase.
          </p>
        </div>

        {isAdmin && filtered.length > 0 && (
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Export Filtered CSV
          </button>
        )}
      </div>

      {!supabaseReady && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Database className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <div className="font-semibold">Supabase is not connected yet</div>
            <p className="mt-0.5 text-xs text-amber-800">
              Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
              <code>.env.local</code> and run <code>supabase/schema.sql</code>{" "}
              to store and view shared MoM PDFs here.
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {errorMsg}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <FileText className="h-4 w-4 text-[#1e3a5f]" />
            Matching MoM PDFs
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {filtered.length}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Users className="h-4 w-4 text-emerald-600" />
            Total Attendees Recorded
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {filtered.reduce((a, s) => a + (Number(s.attendees_count) || 0), 0)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Users className="h-4 w-4 text-rose-600" />
            Total Absences Reported
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {totalAbsent}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invigilator, room, subject, absent student..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm focus:border-[#1e3a5f] focus:outline-none"
            />
          </div>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
          />
          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
          >
            <option value="">All Rooms</option>
            {roomOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
            >
              <option value="">All Sessions</option>
              {sessionOptions.map((sess) => (
                <option key={sess} value={sess}>
                  {sess}
                </option>
              ))}
            </select>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none"
            >
              <option value="">All Subjects</option>
              {subjectOptions.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(search || filterDate || filterRoom || filterSession || filterSubject) && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              <FilterX className="h-3.5 w-3.5" />
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Results List */}
      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading submissions...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <div className="text-sm font-semibold text-slate-700">
            No Minutes of Meeting PDFs found
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Submit a Minutes of Meeting form or adjust your search filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold tracking-wide text-[#1e3a5f] uppercase">
                      {item.room_name} • Session {item.session || "-"}
                    </div>
                    <h3 className="mt-0.5 text-base font-bold text-slate-900">
                      {item.exam_day ? `${item.exam_day}, ` : ""}
                      {item.exam_date}
                    </h3>
                    <div className="text-xs text-slate-500">
                      Invigilator:{" "}
                      <span className="font-medium text-slate-700">
                        {item.invigilator_name}
                      </span>{" "}
                      ({item.invigilator_email})
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        item.absent_count > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {item.attendees_count}/{item.expected_count} Present
                    </span>
                    {item.absent_count > 0 && (
                      <div className="mt-1 text-[11px] font-medium text-rose-600">
                        {item.absent_count} absent
                      </div>
                    )}
                  </div>
                </div>

                {item.subjects && item.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.subjects.map((subj) => (
                      <span
                        key={subj}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                      >
                        {subj}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162d4a]"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview PDF
                  </button>
                  <a
                    href={item.pdf_url}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(item)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Share
                      </>
                    )}
                  </button>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <PdfPreviewModal
        open={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        title={
          previewItem
            ? `${previewItem.room_name} — ${previewItem.exam_date} (Session ${previewItem.session})`
            : "PDF Preview"
        }
        pdfUrl={previewItem?.pdf_url}
        downloadFilename={
          previewItem
            ? `mom-${previewItem.room_name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")}-${previewItem.exam_date}.pdf`
            : "mom.pdf"
        }
      />
    </div>
  );
}
