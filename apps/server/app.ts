import express from "express";
import { existsSync, mkdirSync } from "node:fs";
import { readdir, stat, unlink } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import cors from "cors";
import type { NextFunction, Request, Response } from "express";

const app = express();
const port = process.env.PORT ?? 3001;
const uploadDirectory = "uploads/documents";
const maxFileSizeBytes = 10 * 1024 * 1024;
const dayInMs = 24 * 60 * 60 * 1000;
const draftDocumentRetentionMs =
  Number(process.env.DRAFT_DOCUMENT_RETENTION_DAYS ?? 30) * dayInMs;
const cleanupIntervalMs =
  Number(process.env.DRAFT_DOCUMENT_CLEANUP_HOURS ?? 24) * 60 * 60 * 1000;
const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);
const allowedExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
const documentTypes = [
  "medical-receipt",
  "prescription",
  "discharge-summary",
  "itemized-bill",
  "dental-receipt",
  "treatment-plan",
] as const;

type DocumentType = (typeof documentTypes)[number];

interface DeleteDocumentRequestBody {
  fileName?: string;
}

function isDocumentType(value: string | undefined): value is DocumentType {
  return documentTypes.some((documentType) => documentType === value);
}

function isAllowedFile(file: Express.Multer.File) {
  const extension = extname(file.originalname).toLowerCase();

  return (
    allowedMimeTypes.has(file.mimetype) && allowedExtensions.has(extension)
  );
}

async function cleanupOrphanDraftDocuments() {
  const now = Date.now();
  const entries = await readdir(uploadDirectory, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isFile()) {
        return;
      }

      const filePath = join(uploadDirectory, entry.name);
      const fileStat = await stat(filePath);

      if (now - fileStat.mtimeMs > draftDocumentRetentionMs) {
        await unlink(filePath);
      }
    }),
  );
}

async function deleteTemporaryDocument(fileName: string) {
  const safeFileName = basename(fileName);

  if (safeFileName !== fileName) {
    return false;
  }

  try {
    await unlink(join(uploadDirectory, safeFileName));
    return true;
  } catch {
    return false;
  }
}

if (!existsSync(uploadDirectory)) {
  mkdirSync(uploadDirectory, { recursive: true });
}

cleanupOrphanDraftDocuments().catch((error: unknown) => {
  console.error("Unable to clean up orphan draft documents", error);
});

setInterval(() => {
  cleanupOrphanDraftDocuments().catch((error: unknown) => {
    console.error("Unable to clean up orphan draft documents", error);
  });
}, cleanupIntervalMs).unref();

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_request, file, callback) => {
      const safeOriginalName = file.originalname.replace(
        /[^a-zA-Z0-9._-]/g,
        "-",
      );
      callback(null, `${Date.now()}-${randomUUID()}-${safeOriginalName}`);
    },
  }),
  limits: {
    fileSize: maxFileSizeBytes,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    if (!isAllowedFile(file)) {
      callback(new Error("Only PDF, JPG, and PNG files are supported."));
      return;
    }

    callback(null, true);
  },
});

const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    message: "Server is running perfectly without view templates!",
  });
});

app.post(
  "/api/documents/:documentType/upload",
  (req: Request, res: Response, next: NextFunction) => {
    const rawDocumentType = req.params.documentType;
    const documentType = Array.isArray(rawDocumentType)
      ? undefined
      : rawDocumentType;

    if (!isDocumentType(documentType)) {
      res.status(400).json({
        status: "error",
        message: "Unsupported document type.",
      });
      return;
    }

    upload.single("file")(req, res, (error) => {
      if (error) {
        next(error);
        return;
      }

      if (!req.file) {
        res.status(400).json({
          status: "error",
          message: "Attach one PDF, JPG, or PNG file.",
        });
        return;
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + draftDocumentRetentionMs);

      res.status(201).json({
        status: "success",
        data: {
          id: randomUUID(),
          documentType,
          originalName: req.file.originalname,
          fileName: req.file.filename,
          size: req.file.size,
          mimeType: req.file.mimetype,
          url: `/uploads/documents/${req.file.filename}`,
          temporary: true,
          uploadedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
      });
    });
  },
);

app.delete("/api/documents/:documentId", async (req, res) => {
  const rawDocumentId = req.params.documentId;
  const documentId = Array.isArray(rawDocumentId) ? undefined : rawDocumentId;
  const { fileName } = req.body as DeleteDocumentRequestBody;

  if (!documentId || !fileName) {
    res.status(400).json({
      status: "error",
      message: "Document id and file name are required.",
    });
    return;
  }

  const deleted = await deleteTemporaryDocument(fileName);

  res.json({
    status: "success",
    data: {
      documentId,
      deleted,
    },
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    res.status(400).json({
      status: "error",
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "File must be 10MB or smaller."
          : "Unable to upload this file.",
    });
    return;
  }

  if (error instanceof Error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
    return;
  }

  res.status(500).json({
    status: "error",
    message: "Unexpected upload error.",
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
