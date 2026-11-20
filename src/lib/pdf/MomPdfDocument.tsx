"use client";
/* eslint-disable jsx-a11y/alt-text */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { FormField, FormSnapshot, FormValue, ScaleOptions } from "@/types/mom";

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 38,
    paddingHorizontal: 34,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  headerWrapper: {
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 10,
  },
  logoBox: {
    width: 118,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  logoPlaceholder: {
    width: 110,
    height: 40,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  logoPlaceholderText: {
    fontSize: 7,
    color: "#94a3b8",
    textAlign: "center",
  },
  logoImage: {
    width: 116,
    height: 42,
    objectFit: "contain",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  institution: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    marginBottom: 2,
  },
  address: {
    fontSize: 8.5,
    color: "#64748b",
  },
  doubleRuleTop: {
    borderTopWidth: 2,
    borderTopColor: "#1e3a5f",
    marginBottom: 2,
  },
  doubleRuleBottom: {
    borderTopWidth: 0.75,
    borderTopColor: "#1e3a5f",
  },
  sectionHeading: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
    backgroundColor: "#eef2f7",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#1e3a5f",
    marginTop: 10,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoTable: {
    borderWidth: 0.75,
    borderColor: "#cbd5e1",
    borderRadius: 3,
  },
  infoRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  infoRowLast: {
    flexDirection: "row",
  },
  infoLabelCell: {
    width: "34%",
    backgroundColor: "#f8fafc",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRightWidth: 0.5,
    borderRightColor: "#e2e8f0",
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#334155",
  },
  infoValueCell: {
    width: "66%",
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 9,
    color: "#0f172a",
  },
  attendanceGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  statCard: {
    flex: 1,
    borderWidth: 0.75,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#f8fafc",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 7.5,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
  },
  absentTable: {
    borderWidth: 0.75,
    borderColor: "#cbd5e1",
    borderRadius: 3,
    marginTop: 4,
  },
  absentHeader: {
    flexDirection: "row",
    backgroundColor: "#1e3a5f",
    color: "#ffffff",
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  absentRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 8.5,
  },
  colNo: { width: "8%" },
  colNis: { width: "22%" },
  colName: { width: "48%" },
  colClass: { width: "22%" },
  evalTable: {
    borderWidth: 0.75,
    borderColor: "#cbd5e1",
    borderRadius: 3,
  },
  evalHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 0.75,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
  },
  evalRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  evalRowLast: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  evalCriterion: { width: "68%", paddingRight: 8 },
  evalTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#0f172a" },
  evalDesc: { fontSize: 7.5, color: "#64748b", marginTop: 1 },
  evalScoreCol: { width: "32%", alignItems: "flex-end" },
  scoreBadge: {
    backgroundColor: "#eef2f7",
    borderWidth: 0.75,
    borderColor: "#1e3a5f",
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 7,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
  },
  noteBox: {
    borderWidth: 0.75,
    borderColor: "#cbd5e1",
    borderRadius: 3,
    padding: 8,
    backgroundColor: "#fafafa",
    minHeight: 34,
    fontSize: 9,
    lineHeight: 1.4,
  },
  docWrapper: {
    borderWidth: 0.75,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    padding: 8,
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  docImage: {
    maxWidth: 480,
    maxHeight: 210,
    objectFit: "contain",
  },
  signatureSection: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  signatureBox: {
    width: 210,
    alignItems: "center",
  },
  signaturePlaceDate: {
    fontSize: 8.5,
    color: "#475569",
    marginBottom: 2,
  },
  signatureRole: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    marginBottom: 28,
  },
  signatureLine: {
    width: "100%",
    borderTopWidth: 0.75,
    borderTopColor: "#334155",
    paddingTop: 4,
    alignItems: "center",
  },
  signatureName: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  signatureEmail: {
    fontSize: 7.5,
    color: "#64748b",
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 34,
    right: 34,
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: "#94a3b8",
  },
});

function formatValue(val: FormValue): string {
  if (val === null || val === undefined || val === "") return "-";
  if (Array.isArray(val)) return val.length > 0 ? val.join(", ") : "-";
  return String(val);
}

function getScaleLabel(score: number, opts?: ScaleOptions): string {
  const minL = opts?.minLabel || "Poor";
  const maxL = opts?.maxLabel || "Very Good";
  if (score === 1) return `1 / 5 (${minL})`;
  if (score === 5) return `5 / 5 (${maxL})`;
  if (score === 4) return "4 / 5 (Good)";
  if (score === 3) return "3 / 5 (Satisfactory)";
  if (score === 2) return "2 / 5 (Fair)";
  return `${score} / 5`;
}

export function MomPdfDocument({ snapshot }: { snapshot: FormSnapshot }) {
  const { header, fields, values, absent_students, documentation_data_url } = snapshot;

  const activeFields = fields
    .filter((f) => f.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const generalAndScheduleFields = activeFields.filter(
    (f) => f.section === "general" || f.section === "schedule"
  );

  const attendanceSpecialKeys = new Set([
    "expected_count",
    "attendees_count",
    "absent_count",
    "absent_names",
  ]);

  const extraAttendanceFields = activeFields.filter(
    (f) => f.section === "attendance" && !attendanceSpecialKeys.has(f.field_key)
  );

  const evaluationFields = activeFields.filter(
    (f) => f.section === "evaluation" || f.field_type === "scale_5"
  );

  const noteAndCustomFields = activeFields.filter(
    (f) =>
      f.section === "notes_media" &&
      f.field_type !== "file_image" &&
      f.field_type !== "scale_5"
  );

  const expectedVal = formatValue(values.expected_count);
  const attendeesVal = formatValue(values.attendees_count);
  const absentCountVal = formatValue(values.absent_count);
  const absentNamesVal = formatValue(values.absent_names);

  const invigilatorName = formatValue(values.invigilator_name);
  const invigilatorEmail = formatValue(values.email);
  const examDate = formatValue(values.date);
  const roomName = formatValue(values.room);

  const docUrl = documentation_data_url || (typeof values.documentation === "string" ? values.documentation : null);

  return (
    <Document title={`${header.header_title} - ${roomName} - ${examDate}`}>
      <Page size="A4" style={styles.page}>
        {/* Institutional Header with Left & Right Logos */}
        <View style={styles.headerWrapper}>
          <View style={styles.headerRow}>
            <View style={styles.logoBox}>
              {header.left_logo_url ? (
                <Image src={header.left_logo_url} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoPlaceholderText}>LEFT{"\n"}LOGO</Text>
                </View>
              )}
            </View>

            <View style={styles.headerCenter}>
              {header.header_institution ? (
                <Text style={styles.institution}>{header.header_institution}</Text>
              ) : null}
              <Text style={styles.title}>{header.header_title || "MINUTES OF MEETING"}</Text>
              {header.header_subtitle ? (
                <Text style={styles.subtitle}>{header.header_subtitle}</Text>
              ) : null}
              {header.header_address ? (
                <Text style={styles.address}>{header.header_address}</Text>
              ) : null}
            </View>

            <View style={styles.logoBox}>
              {header.right_logo_url ? (
                <Image src={header.right_logo_url} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoPlaceholderText}>RIGHT{"\n"}LOGO</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.doubleRuleTop} />
          <View style={styles.doubleRuleBottom} />
        </View>

        {/* Section 1: Invigilator & Exam Details */}
        <Text style={styles.sectionHeading}>Exam &amp; Invigilator Details</Text>
        <View style={styles.infoTable}>
          {generalAndScheduleFields.map((field, index) => {
            const isLast = index === generalAndScheduleFields.length - 1;
            let display = formatValue(values[field.field_key]);
            if (field.field_key === "start_time" && values.end_time) {
              display = `${formatValue(values.start_time)}`;
            }
            return (
              <View
                key={field.id}
                style={isLast ? styles.infoRowLast : styles.infoRow}
              >
                <Text style={styles.infoLabelCell}>{field.label}</Text>
                <Text style={styles.infoValueCell}>{display}</Text>
              </View>
            );
          })}
        </View>

        {/* Section 2: Room Attendance */}
        <Text style={styles.sectionHeading}>Room Attendance Summary</Text>
        <View style={styles.attendanceGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Expected Participants</Text>
            <Text style={styles.statValue}>{expectedVal}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Present Participants</Text>
            <Text style={styles.statValue}>{attendeesVal}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Absent Participants</Text>
            <Text style={styles.statValue}>{absentCountVal}</Text>
          </View>
        </View>

        {absent_students && absent_students.length > 0 ? (
          <View style={styles.absentTable}>
            <View style={styles.absentHeader}>
              <Text style={styles.colNo}>No</Text>
              <Text style={styles.colNis}>NIS</Text>
              <Text style={styles.colName}>Absent Participant Name</Text>
              <Text style={styles.colClass}>Class</Text>
            </View>
            {absent_students.map((st, idx) => (
              <View key={st.id || idx} style={styles.absentRow}>
                <Text style={styles.colNo}>{idx + 1}</Text>
                <Text style={styles.colNis}>{st.nis}</Text>
                <Text style={styles.colName}>{st.name}</Text>
                <Text style={styles.colClass}>{st.kelas}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.infoTable}>
            <View style={styles.infoRowLast}>
              <Text style={styles.infoLabelCell}>Absent Participants</Text>
              <Text style={styles.infoValueCell}>
                {absentNamesVal === "-" ? "None (All participants present)" : absentNamesVal}
              </Text>
            </View>
          </View>
        )}

        {extraAttendanceFields.length > 0 && (
          <View style={[styles.infoTable, { marginTop: 6 }]}>
            {extraAttendanceFields.map((field: FormField, idx) => (
              <View
                key={field.id}
                style={
                  idx === extraAttendanceFields.length - 1
                    ? styles.infoRowLast
                    : styles.infoRow
                }
              >
                <Text style={styles.infoLabelCell}>{field.label}</Text>
                <Text style={styles.infoValueCell}>
                  {formatValue(values[field.field_key])}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Section 3: Evaluation Scales */}
        {evaluationFields.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Participant Behavior Evaluation</Text>
            <View style={styles.evalTable}>
              <View style={styles.evalHeader}>
                <Text style={styles.evalCriterion}>Aspect / Indicator</Text>
                <Text style={[styles.evalScoreCol, { textAlign: "right" }]}>
                  Rating (1–5)
                </Text>
              </View>
              {evaluationFields.map((field, index) => {
                const rawScore = Number(values[field.field_key] ?? 0);
                const opts = !Array.isArray(field.options)
                  ? (field.options as ScaleOptions)
                  : undefined;
                const isLast = index === evaluationFields.length - 1;
                return (
                  <View
                    key={field.id}
                    style={isLast ? styles.evalRowLast : styles.evalRow}
                  >
                    <View style={styles.evalCriterion}>
                      <Text style={styles.evalTitle}>{field.label}</Text>
                      {field.description ? (
                        <Text style={styles.evalDesc}>{field.description}</Text>
                      ) : null}
                    </View>
                    <View style={styles.evalScoreCol}>
                      <Text style={styles.scoreBadge}>
                        {rawScore > 0 ? getScaleLabel(rawScore, opts) : "Not rated"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Section 4: Notes & Extra Fields */}
        {noteAndCustomFields.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Exam Notes &amp; Remarks</Text>
            {noteAndCustomFields.map((field) => (
              <View key={field.id} style={{ marginBottom: 6 }}>
                <Text
                  style={{
                    fontSize: 8.5,
                    fontFamily: "Helvetica-Bold",
                    color: "#475569",
                    marginBottom: 3,
                  }}
                >
                  {field.label}
                </Text>
                <View style={styles.noteBox}>
                  <Text>{formatValue(values[field.field_key])}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Section 5: Documentation Image */}
        {docUrl ? (
          <View wrap={false}>
            <Text style={styles.sectionHeading}>Exam Documentation</Text>
            <View style={styles.docWrapper}>
              <Image src={docUrl} style={styles.docImage} />
            </View>
          </View>
        ) : null}

        {/* Signature Block */}
        <View style={styles.signatureSection} wrap={false}>
          <View style={styles.signatureBox}>
            <Text style={styles.signaturePlaceDate}>
              {roomName !== "-" ? `${roomName}, ` : ""}
              {examDate}
            </Text>
            <Text style={styles.signatureRole}>Invigilator</Text>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureName}>{invigilatorName}</Text>
              {invigilatorEmail !== "-" ? (
                <Text style={styles.signatureEmail}>{invigilatorEmail}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{header.footer_note || "Semester Exam Minutes of Meeting"}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
