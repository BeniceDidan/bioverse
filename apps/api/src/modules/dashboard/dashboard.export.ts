import ExcelJS from "exceljs";
import { getMasteryStatus } from "@bioverse/shared";
import * as dashboardService from "./dashboard.service";

const HEADER_FILL = "FF166534"; // hijau BioVerse
const DATE_FMT = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

/**
 * Builds the teacher's grade recap as a real .xlsx rather than CSV — Excel on
 * an Indonesian locale reads comma-separated files as a single column, which
 * would defeat the point of handing over something already structured.
 */
export async function buildGradesWorkbook(passingScore = 75): Promise<Buffer> {
  const dash = await dashboardService.getTeacherDashboard();

  const wb = new ExcelJS.Workbook();
  wb.creator = "BioVerse";
  wb.created = new Date();

  const sheet = wb.addWorksheet("Rekap Nilai", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Nama", key: "name", width: 28 },
    { header: "Email", key: "email", width: 32 },
    { header: "Submateri Selesai", key: "sections", width: 18 },
    { header: "Rata-rata Nilai (0-100)", key: "avg", width: 22 },
    { header: "Kuis Dikerjakan", key: "attempts", width: 16 },
    { header: "Status", key: "status", width: 18 },
    { header: "Terakhir Aktif", key: "lastActive", width: 22 },
  ];

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
  header.alignment = { vertical: "middle" };
  header.height = 22;

  for (const s of dash.students) {
    const status = getMasteryStatus(s.avgQuizScore, passingScore);
    sheet.addRow({
      name: s.name,
      email: s.email,
      sections: `${s.completedSections}/${s.totalSections}`,
      avg: s.avgQuizScore ?? "-",
      attempts: s.totalAttempts,
      status: s.totalAttempts === 0 ? "Belum mengerjakan" : status.teacherLabel,
      lastActive: s.lastActive ? DATE_FMT.format(new Date(s.lastActive)) : "Belum aktif",
    });
  }

  sheet.getColumn("avg").alignment = { horizontal: "center" };
  sheet.getColumn("attempts").alignment = { horizontal: "center" };
  sheet.getColumn("sections").alignment = { horizontal: "center" };

  // Ringkasan kelas di bawah tabel, dipisahkan satu baris kosong.
  sheet.addRow({});
  const summary = sheet.addRow({
    name: "Ringkasan kelas",
    email: `${dash.totalStudents} siswa`,
    sections: `${dash.totalSections} submateri`,
    avg: dash.classAvgScore ?? "-",
    attempts: dash.students.reduce((sum, s) => sum + s.totalAttempts, 0),
    status: "",
    lastActive: DATE_FMT.format(new Date()),
  });
  summary.font = { bold: true };

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}

export function gradesFileName(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return `rekap-nilai-bioverse-${stamp}.xlsx`;
}
