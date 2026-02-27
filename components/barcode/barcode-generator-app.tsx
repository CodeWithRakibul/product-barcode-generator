"use client";

import { useMemo, useState } from "react";

import type { BarcodeGeneratorConfigInput, ConfigField } from "@/lib/config";
import { DEFAULT_BARCODE_FORMAT, DEFAULT_GENERATION_MODE } from "@/lib/config";
import { BarcodeConfigError, generateBarcodes } from "@/lib/generator";

import { BarcodeConfigForm, type BarcodeFormValues } from "@/components/barcode/barcode-config-form";
import { BarcodePreviewGrid } from "@/components/barcode/barcode-preview-grid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type FieldErrorMap = Partial<Record<ConfigField, string>>;

const DEFAULT_FORM_VALUES: BarcodeFormValues = {
  companyName: "",
  prefix: "",
  format: DEFAULT_BARCODE_FORMAT,
  mode: DEFAULT_GENERATION_MODE,
  quantity: "24",
  rangeStart: "1",
  rangeEnd: "100",
};

const parseIntegerInput = (value: string): number | undefined => {
  if (value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toConfigInput = (formValues: BarcodeFormValues): BarcodeGeneratorConfigInput => ({
  companyName: formValues.companyName,
  prefix: formValues.prefix,
  format: formValues.format,
  mode: formValues.mode,
  quantity: parseIntegerInput(formValues.quantity),
  rangeStart: parseIntegerInput(formValues.rangeStart),
  rangeEnd: parseIntegerInput(formValues.rangeEnd),
});

const toErrorMap = (error: BarcodeConfigError): FieldErrorMap => {
  const map: FieldErrorMap = {};

  for (const item of error.errors) {
    if (!map[item.field]) {
      map[item.field] = item.message;
    }
  }

  return map;
};

export function BarcodeGeneratorApp() {
  const [formValues, setFormValues] = useState<BarcodeFormValues>(DEFAULT_FORM_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canRenderPreview = useMemo(() => barcodes.length > 0, [barcodes.length]);

  const updateField = <K extends keyof BarcodeFormValues>(field: K, value: BarcodeFormValues[K]) => {
    setFormValues((previous) => ({ ...previous, [field]: value }));
  };

  const resetAll = () => {
    setFormValues(DEFAULT_FORM_VALUES);
    setFieldErrors({});
    setGlobalError(null);
    setBarcodes([]);
  };

  const handleGenerate = async () => {
    setIsSubmitting(true);
    setGlobalError(null);
    setFieldErrors({});

    try {
      const generated = await generateBarcodes(toConfigInput(formValues));
      setBarcodes(generated);
    } catch (error) {
      if (error instanceof BarcodeConfigError) {
        setFieldErrors(toErrorMap(error));
      } else {
        const message =
          error instanceof Error ? error.message : "Unexpected error while generating barcodes.";
        setGlobalError(message);
      }
      setBarcodes([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Product Barcode Generator</CardTitle>
          <CardDescription>
            Enterprise-ready POS barcode generation with serial-friendly output and API rendering.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">Next.js 16 App Router</Badge>
          <Badge variant="secondary">shadcn/ui</Badge>
          <Badge variant="secondary">bwip-js</Badge>
          <Badge variant="outline">Multi-tenant ready</Badge>
          <Badge variant="outline">PDF export ready</Badge>
          <Badge variant="outline">Thermal print ready</Badge>
        </CardContent>
      </Card>

      <BarcodeConfigForm
        values={formValues}
        errors={fieldErrors}
        isSubmitting={isSubmitting}
        onChange={updateField}
        onSubmit={handleGenerate}
        onReset={resetAll}
      />

      {globalError ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-destructive">{globalError}</p>
          </CardContent>
        </Card>
      ) : null}

      {canRenderPreview ? (
        <BarcodePreviewGrid values={barcodes} format={formValues.format} />
      ) : (
        <BarcodePreviewGrid values={[]} format={formValues.format} />
      )}
    </div>
  );
}
