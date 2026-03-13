const normalizePart = (value) => String(value || "").trim().toLowerCase();
const normalizeAxisName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

const uniqueClean = (values) => {
  const seen = new Set();
  const out = [];
  for (const raw of values || []) {
    const value = String(raw || "").trim();
    if (!value) continue;
    const key = normalizePart(value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
};

export const parseVariantAxis = (text) =>
  uniqueClean(String(text || "").split(","));

export const createVariantKey = (size, color) =>
  `${normalizePart(size)}|${normalizePart(color)}`;

export const createDynamicVariantKey = (selection = {}) => {
  const entries = Object.entries(selection || {})
    .map(([axis, value]) => [normalizeAxisName(axis), normalizePart(value)])
    .filter(([axis, value]) => axis && value)
    .sort((a, b) => a[0].localeCompare(b[0]));
  return entries.map(([axis, value]) => `${axis}=${value}`).join("|");
};

const normalizeAttributes = (attributes = []) => {
  const out = [];
  const seenAxes = new Set();
  for (const rawAttr of attributes || []) {
    const name = String(rawAttr?.name || "").trim();
    const axisKey = normalizeAxisName(name);
    if (!name || !axisKey || seenAxes.has(axisKey)) continue;
    seenAxes.add(axisKey);
    const values = uniqueClean(rawAttr?.values || []);
    if (!values.length) continue;
    out.push({ name, axisKey, values });
  }
  return out;
};

const buildCombinationsFromAttributes = (attributes = []) => {
  if (!attributes.length) return [];
  let combinations = [{}];
  attributes.forEach((attr) => {
    const next = [];
    combinations.forEach((current) => {
      attr.values.forEach((value) => {
        next.push({ ...current, [attr.axisKey]: value });
      });
    });
    combinations = next;
  });
  return combinations;
};

export const buildVariantCombinations = (sizes = [], colors = [], attributes = []) => {
  const normalizedAttributes = normalizeAttributes(attributes);
  if (normalizedAttributes.length > 0) {
    return buildCombinationsFromAttributes(normalizedAttributes).map((selection) => ({
      selection,
      size: selection.size || "",
      color: selection.color || "",
      key: createDynamicVariantKey(selection),
      label: normalizedAttributes
        .map((attr) => `${attr.name}: ${selection[attr.axisKey] || "-"}`)
        .join(" / "),
    }));
  }

  const cleanSizes = uniqueClean(sizes);
  const cleanColors = uniqueClean(colors);

  if (cleanSizes.length > 0 && cleanColors.length > 0) {
    return cleanSizes.flatMap((size) =>
      cleanColors.map((color) => ({
        size,
        color,
        selection: { size, color },
        key: createVariantKey(size, color),
        label: `${size || "Any Size"} / ${color || "Any Color"}`,
      }))
    );
  }
  if (cleanSizes.length > 0) {
    return cleanSizes.map((size) => ({
      size,
      color: "",
      selection: { size },
      key: createVariantKey(size, ""),
      label: `${size || "Any Size"} / Any Color`,
    }));
  }
  if (cleanColors.length > 0) {
    return cleanColors.map((color) => ({
      size: "",
      color,
      selection: { color },
      key: createVariantKey("", color),
      label: `Any Size / ${color || "Any Color"}`,
    }));
  }
  return [];
};

const toEntries = (rawPrices) => {
  if (!rawPrices) return [];
  if (rawPrices instanceof Map) return Array.from(rawPrices.entries());
  if (typeof rawPrices === "object") return Object.entries(rawPrices);
  return [];
};

const parsePriceValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const resolveCombinationPrice = (rawPrices, size, color) => {
  const entries = toEntries(rawPrices);
  if (!entries.length) return null;

  const sizePart = normalizePart(size);
  const colorPart = normalizePart(color);
  const candidates = [
    `${sizePart}|${colorPart}`,
    `${sizePart}-${colorPart}`,
    `${sizePart}_${colorPart}`,
    `${sizePart}:${colorPart}`,
    sizePart && !colorPart ? sizePart : null,
    colorPart && !sizePart ? colorPart : null,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const exact = entries.find(([key]) => String(key).trim() === candidate);
    if (exact) {
      const parsed = parsePriceValue(exact[1]);
      if (parsed !== null) return parsed;
    }
    const normalized = entries.find(([key]) => normalizePart(key) === candidate);
    if (normalized) {
      const parsed = parsePriceValue(normalized[1]);
      if (parsed !== null) return parsed;
    }
  }
  return null;
};

export const normalizeVariantStateForForm = (rawVariants = {}, basePrice = "") => {
  const sizes = uniqueClean(rawVariants?.sizes || []);
  const colors = uniqueClean(rawVariants?.colors || []);
  const attributes = normalizeAttributes(rawVariants?.attributes || []).map((attr) => ({
    name: attr.name,
    values: attr.values,
  }));
  const combinations = buildVariantCombinations(sizes, colors, attributes);
  const fallbackPrice = parsePriceValue(basePrice);

  const prices = {};
  const stockMap = {};
  const imageMap = {};
  combinations.forEach(({ size, color, key }) => {
    const resolved = resolveCombinationPrice(rawVariants?.prices, size, color);
    if (resolved !== null) prices[key] = resolved;
    else if (fallbackPrice !== null) prices[key] = fallbackPrice;

    const stockValue = parsePriceValue(rawVariants?.stockMap?.[key]);
    if (stockValue !== null) stockMap[key] = stockValue;

    const imageValue = String(rawVariants?.imageMap?.[key] || "").trim();
    if (imageValue) imageMap[key] = imageValue;
  });

  const defaultVariant = {
    size: String(rawVariants?.defaultVariant?.size || "").trim(),
    color: String(rawVariants?.defaultVariant?.color || "").trim(),
  };
  const defaultSelection = rawVariants?.defaultSelection && typeof rawVariants.defaultSelection === "object"
    ? Object.entries(rawVariants.defaultSelection).reduce((acc, [key, value]) => {
      const axis = normalizeAxisName(key);
      const normalizedValue = String(value || "").trim();
      if (axis && normalizedValue) acc[axis] = normalizedValue;
      return acc;
    }, {})
    : {};

  return { sizes, colors, attributes, prices, stockMap, imageMap, defaultVariant, defaultSelection };
};

export const syncVariantPricesWithAxes = (
  currentPrices = {},
  currentStockMap = {},
  currentImageMap = {},
  sizes = [],
  colors = [],
  attributes = [],
  fallbackPrice = ""
) => {
  const combinations = buildVariantCombinations(sizes, colors, attributes);
  const nextPrices = {};
  const nextStockMap = {};
  const nextImageMap = {};
  const parsedFallback = parsePriceValue(fallbackPrice);

  combinations.forEach(({ key }) => {
    const parsedCurrentPrice = parsePriceValue(currentPrices[key]);
    const parsedCurrentStock = parsePriceValue(currentStockMap[key]);
    const currentImage = String(currentImageMap[key] || "").trim();

    if (parsedCurrentPrice !== null) {
      nextPrices[key] = parsedCurrentPrice;
    } else if (parsedFallback !== null) {
      nextPrices[key] = parsedFallback;
    }

    if (parsedCurrentStock !== null) {
      nextStockMap[key] = parsedCurrentStock;
    }
    if (currentImage) {
      nextImageMap[key] = currentImage;
    }
  });
  return {
    prices: nextPrices,
    stockMap: nextStockMap,
    imageMap: nextImageMap,
  };
};

export const buildVariantPayload = (rawVariants = {}) => {
  const sizes = uniqueClean(rawVariants?.sizes || []);
  const colors = uniqueClean(rawVariants?.colors || []);
  const attributes = normalizeAttributes(rawVariants?.attributes || []).map((attr) => ({
    name: attr.name,
    values: attr.values,
  }));
  const combinations = buildVariantCombinations(sizes, colors, attributes);
  const prices = {};
  const stockMap = {};
  const imageMap = {};

  combinations.forEach(({ key }) => {
    const parsedPrice = parsePriceValue(rawVariants?.prices?.[key]);
    if (parsedPrice !== null) {
      prices[key] = parsedPrice;
    }

    const parsedStock = parsePriceValue(rawVariants?.stockMap?.[key]);
    if (parsedStock !== null) {
      stockMap[key] = parsedStock;
    }

    const image = String(rawVariants?.imageMap?.[key] || "").trim();
    if (image) {
      imageMap[key] = image;
    }
  });

  const defaultVariant = {
    size: String(rawVariants?.defaultVariant?.size || "").trim(),
    color: String(rawVariants?.defaultVariant?.color || "").trim(),
  };
  const defaultSelection = rawVariants?.defaultSelection && typeof rawVariants.defaultSelection === "object"
    ? Object.entries(rawVariants.defaultSelection).reduce((acc, [key, value]) => {
      const axis = normalizeAxisName(key);
      const normalizedValue = String(value || "").trim();
      if (axis && normalizedValue) acc[axis] = normalizedValue;
      return acc;
    }, {})
    : {};

  const hasVariants = attributes.length > 0 || sizes.length > 0 || colors.length > 0;
  if (!hasVariants) return { sizes: [], colors: [], attributes: [], prices: {}, stockMap: {}, imageMap: {}, defaultVariant: {}, defaultSelection: {} };

  return {
    sizes,
    colors,
    attributes,
    prices,
    stockMap,
    imageMap,
    defaultVariant,
    defaultSelection,
  };
};
