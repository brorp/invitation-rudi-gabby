import ExcelJS from "exceljs";

import { requirePanelSession } from "@/lib/panel-auth";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requirePanelSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Rudi & Gabriella Wedding Panel";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Invitees", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "full_name", key: "full_name", width: 36 },
    { header: "phone_number", key: "phone_number", width: 22 },
    { header: "pax", key: "pax", width: 12 },
    { header: "notes", key: "notes", width: 34 },
  ];

  const header = sheet.getRow(1);
  header.height = 24;
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF272621" },
  };
  header.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getColumn("phone_number").numFmt = "@";
  for (let row = 2; row <= 1001; row += 1) {
    sheet.getCell(`C${row}`).dataValidation = {
      type: "whole",
      operator: "between",
      allowBlank: false,
      formulae: [1, 10],
      showErrorMessage: true,
      errorTitle: "Invalid pax",
      error: "Pax must be a whole number from 1 to 10.",
    };
  }

  const instructions = workbook.addWorksheet("Instructions");
  instructions.columns = [{ width: 110 }];
  [
    "Fill the Invitees sheet only. Do not rename the headers.",
    "full_name is required and must be unique.",
    "phone_number is optional. Format the cell as Text to preserve a leading zero.",
    "pax is required and must be a whole number from 1 to 10.",
    "notes is optional and is visible only in the wedding panel.",
    "Maximum import size: 1,000 invitees per file.",
  ].forEach((line, index) => {
    const cell = instructions.getCell(index + 1, 1);
    cell.value = line;
    cell.alignment = { wrapText: true, vertical: "top" };
  });
  instructions.getCell("A1").font = { bold: true, size: 14 };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(Buffer.from(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="rudi-gabby-invitee-template.xlsx"',
      "Cache-Control": "private, no-store",
    },
  });
}
