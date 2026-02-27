import {
  type BarcodeGeneratorConfig,
  type BarcodeGeneratorConfigInput,
  type ChecksumStrategy,
  type ConfigValidationError,
  type UniqueBarcodeValidator,
  validateGeneratorConfig,
} from "@/lib/config";

export class BarcodeConfigError extends Error {
  public readonly errors: ConfigValidationError[];

  constructor(errors: ConfigValidationError[]) {
    super("Invalid barcode generation configuration.");
    this.name = "BarcodeConfigError";
    this.errors = errors;
  }
}

export interface GeneratorDependencies {
  now?: () => number;
  uniqueValidator?: UniqueBarcodeValidator;
  checksumStrategy?: ChecksumStrategy;
}

const composeBarcodeValue = (
  prefix: string,
  numericPart: string,
  checksumStrategy?: ChecksumStrategy,
): string => {
  const baseValue = prefix ? `${prefix}${numericPart}` : numericPart;
  return checksumStrategy ? checksumStrategy.apply(baseValue) : baseValue;
};

const generateTimestampBatch = (
  config: BarcodeGeneratorConfig,
  now: () => number,
  checksumStrategy?: ChecksumStrategy,
): string[] => {
  const base = now();
  const generated: string[] = [];

  for (let index = 0; index < config.quantity; index += 1) {
    const numericPart = String(base + index);
    generated.push(composeBarcodeValue(config.prefix, numericPart, checksumStrategy));
  }

  return generated;
};

const generateRangeBatch = (
  config: BarcodeGeneratorConfig,
  checksumStrategy?: ChecksumStrategy,
): string[] => {
  const generated: string[] = [];

  for (let value = config.rangeStart; value <= config.rangeEnd; value += 1) {
    generated.push(composeBarcodeValue(config.prefix, String(value), checksumStrategy));
  }

  return generated;
};

const enforceUniquenessIfNeeded = async (
  barcodes: string[],
  config: BarcodeGeneratorConfig,
  uniqueValidator?: UniqueBarcodeValidator,
): Promise<string[]> => {
  if (!uniqueValidator) {
    return barcodes;
  }

  for (let index = 0; index < barcodes.length; index += 1) {
    const barcode = barcodes[index];
    const isUnique = await uniqueValidator(barcode, { index, config });

    if (!isUnique) {
      throw new Error(`Generated barcode is not unique: ${barcode}`);
    }
  }

  return barcodes;
};

export const generateBarcodes = async (
  input: BarcodeGeneratorConfigInput,
  dependencies: GeneratorDependencies = {},
): Promise<string[]> => {
  const validation = validateGeneratorConfig(input);

  if (!validation.config) {
    throw new BarcodeConfigError(validation.errors);
  }

  const now = dependencies.now ?? Date.now;
  const config = validation.config;

  const barcodes =
    config.mode === "timestamp"
      ? generateTimestampBatch(config, now, dependencies.checksumStrategy)
      : generateRangeBatch(config, dependencies.checksumStrategy);

  return enforceUniquenessIfNeeded(barcodes, config, dependencies.uniqueValidator);
};
