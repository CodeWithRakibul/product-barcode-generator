import bwipjs from "bwip-js";

import { DEFAULT_BARCODE_FORMAT, type BarcodeFormat } from "@/lib/config";

export const runtime = "nodejs";

interface BarcodePayload {
  text: string;
  format?: BarcodeFormat;
  scale?: number;
  height?: number;
  includeText?: boolean;
}

const isSupportedFormat = (value: string): value is BarcodeFormat =>
  value === "code128" || value === "code39" || value === "ean13";

const parsePayload = async (request: Request): Promise<BarcodePayload> => {
  if (request.method === "GET") {
    const { searchParams } = new URL(request.url);
    return {
      text: searchParams.get("text") ?? "",
      format: (searchParams.get("format") ?? DEFAULT_BARCODE_FORMAT) as BarcodeFormat,
      scale: Number(searchParams.get("scale") ?? "3"),
      height: Number(searchParams.get("height") ?? "12"),
      includeText: searchParams.get("includeText") !== "false",
    };
  }

  const body = (await request.json()) as Partial<BarcodePayload>;
  return {
    text: body.text ?? "",
    format: body.format ?? DEFAULT_BARCODE_FORMAT,
    scale: body.scale ?? 3,
    height: body.height ?? 12,
    includeText: body.includeText ?? true,
  };
};

const renderToBuffer = async ({
  text,
  format,
  scale,
  height,
  includeText,
}: Required<BarcodePayload>): Promise<Buffer> =>
  new Promise<Buffer>((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: format,
        text,
        scale,
        height,
        includetext: includeText,
        textxalign: "center",
        backgroundcolor: "FFFFFF",
      },
      (error: string | Error | null, png: Buffer) => {
        if (error) {
          reject(typeof error === "string" ? new Error(error) : error);
          return;
        }

        resolve(png);
      },
    );
  });

const handle = async (request: Request): Promise<Response> => {
  try {
    const payload = await parsePayload(request);
    const text = payload.text.trim();
    const format = payload.format ?? DEFAULT_BARCODE_FORMAT;
    const scale = payload.scale ?? 3;
    const height = payload.height ?? 12;
    const includeText = payload.includeText ?? true;

    if (!text) {
      return Response.json(
        { error: "Barcode text is required." },
        {
          status: 400,
        },
      );
    }

    if (!isSupportedFormat(format)) {
      return Response.json(
        { error: "Unsupported barcode format." },
        {
          status: 400,
        },
      );
    }

    if (!Number.isFinite(scale) || scale <= 0) {
      return Response.json(
        { error: "Scale must be a positive number." },
        {
          status: 400,
        },
      );
    }

    if (!Number.isFinite(height) || height <= 0) {
      return Response.json(
        { error: "Height must be a positive number." },
        {
          status: 400,
        },
      );
    }

    const png = await renderToBuffer({
      text,
      format,
      scale,
      height,
      includeText,
    });

    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown barcode rendering error.";
    return Response.json(
      { error: message },
      {
        status: 500,
      },
    );
  }
};

export const GET = handle;
export const POST = handle;
