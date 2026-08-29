import { randomBytes } from "node:crypto";

import ExcelJS from "exceljs";

import { slugifyGuestName } from "@/lib/data";
import { requirePanelSession } from "@/lib/panel-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ROWS = 1000;
const REQUIRED_HEADERS = ["full_name", "phone_number", "pax"] as const;

function safeCellText(cell: ExcelJS.Cell) {
  return cell.text.replace(/[\u0000-\u001f\u007f]/g, "").trim();
}

export async function POST(request: Request) {
  if (!(await requirePanelSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({ error: "Supabase is not connected." }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose an .xlsx file." }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".xlsx") || file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: "Only .xlsx files up to 5 MB are accepted." },
      { status: 400 },
    );
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    return Response.json({ error: "The workbook could not be read." }, { status: 400 });
  }

  const sheet = workbook.getWorksheet("Invitees") || workbook.worksheets[0];
  if (!sheet) {
    return Response.json({ error: "The Invitees worksheet is missing." }, { status: 400 });
  }
  if (sheet.actualRowCount - 1 > MAX_ROWS) {
    return Response.json(
      { error: `A maximum of ${MAX_ROWS} invitees can be imported at once.` },
      { status: 400 },
    );
  }

  const headerMap = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, columnNumber) => {
    headerMap.set(safeCellText(cell).toLowerCase(), columnNumber);
  });
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headerMap.has(header));
  if (missingHeaders.length) {
    return Response.json(
      { error: `Missing required columns: ${missingHeaders.join(", ")}.` },
      { status: 400 },
    );
  }

  const parsed: Array<{
    full_name: string;
    phone: string | null;
    pax_allowed: number;
    notes: string | null;
  }> = [];
  const validationErrors: string[] = [];
  const namesInFile = new Set<string>();

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const fullName = safeCellText(row.getCell(headerMap.get("full_name")!)).slice(0, 100);
    const phone = safeCellText(row.getCell(headerMap.get("phone_number")!)).slice(0, 30);
    const paxText = safeCellText(row.getCell(headerMap.get("pax")!));
    const notesColumn = headerMap.get("notes");
    const notes = notesColumn
      ? safeCellText(row.getCell(notesColumn)).slice(0, 250)
      : "";

    if (!fullName && !phone && !paxText && !notes) return;
    const normalizedName = fullName.toLocaleLowerCase("id-ID");
    const pax = Number(paxText);
    if (
      fullName.length < 2 ||
      /^[=+\-@]/.test(fullName) ||
      !Number.isInteger(pax) ||
      pax < 1 ||
      pax > 10
    ) {
      validationErrors.push(`Row ${rowNumber} has an invalid name or pax value.`);
      return;
    }
    if (namesInFile.has(normalizedName)) {
      validationErrors.push(`Row ${rowNumber} duplicates a name in this file.`);
      return;
    }
    namesInFile.add(normalizedName);
    parsed.push({
      full_name: fullName,
      phone: phone || null,
      pax_allowed: pax,
      notes: notes || null,
    });
  });

  if (!parsed.length) {
    return Response.json(
      { error: validationErrors[0] || "The workbook contains no invitees." },
      { status: 400 },
    );
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("invitees")
    .select("full_name");
  if (existingError) {
    return Response.json({ error: "Unable to check existing invitees." }, { status: 500 });
  }
  const existingNames = new Set(
    (existingRows || []).map((row) => row.full_name.toLocaleLowerCase("id-ID")),
  );
  const newRows = parsed
    .filter((row) => !existingNames.has(row.full_name.toLocaleLowerCase("id-ID")))
    .map((row) => {
      const accessToken = randomBytes(24).toString("hex");
      return {
        ...row,
        slug: `${slugifyGuestName(row.full_name)}-${accessToken.slice(0, 8)}`,
        access_token: accessToken,
        status: "pending",
      };
    });

  if (!newRows.length) {
    return Response.json({
      invitees: [],
      imported: 0,
      skipped: parsed.length + validationErrors.length,
      validationErrors: validationErrors.slice(0, 10),
    });
  }

  const { data, error } = await supabase
    .from("invitees")
    .insert(newRows)
    .select("*");
  if (error) {
    console.error("Unable to bulk import invitees", error.code);
    return Response.json(
      { error: "The import could not be saved. Check for duplicate names." },
      { status: error.code === "23505" ? 409 : 500 },
    );
  }

  return Response.json({
    invitees: data || [],
    imported: data?.length || 0,
    skipped: parsed.length - newRows.length + validationErrors.length,
    validationErrors: validationErrors.slice(0, 10),
  });
}
