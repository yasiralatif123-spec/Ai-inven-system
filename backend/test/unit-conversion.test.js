const {
  toBasePieces,
  fromBasePieces,
  normalizeUnit,
  convertPrice,
  pricePerPiece,
  priceForUnit,
  parseMoneyInput,
  parseStoredMoney,
  roundMoney,
} = require("../src/utils/units");

describe("unit conversion utility", () => {
  test("normalizes supported units", () => {
    expect(normalizeUnit("Carton")).toBe("Carton");
    expect(normalizeUnit("cartons")).toBe("Carton");
    expect(normalizeUnit("Box")).toBe("Box");
    expect(normalizeUnit("boxes")).toBe("Box");
    expect(normalizeUnit("Piece")).toBe("Piece");
    expect(normalizeUnit("pcs")).toBe("Piece");
    expect(normalizeUnit("pc")).toBe("Piece");
    expect(normalizeUnit("")).toBe("");
    expect(normalizeUnit("kg")).toBe("");
  });

  test("converts quantities to base pieces", () => {
    expect(toBasePieces(1, "Carton")).toBe(24);
    expect(toBasePieces(2, "Carton")).toBe(48);
    expect(toBasePieces(1, "Box")).toBe(12);
    expect(toBasePieces(2, "Box")).toBe(24);
    expect(toBasePieces(1, "Piece")).toBe(1);
    expect(toBasePieces(5, "Piece")).toBe(5);
  });

  test("converts mixed quantities to base pieces", () => {
    const total =
      toBasePieces(2, "Carton") + toBasePieces(3, "Box") + toBasePieces(5, "Piece");
    expect(total).toBe(89);
  });

  test("formats base pieces into cartons/boxes/pieces", () => {
    expect(fromBasePieces(89)).toEqual({ cartons: 3, boxes: 1, pieces: 5, totalPieces: 89 });
    expect(fromBasePieces(24)).toEqual({ cartons: 1, boxes: 0, pieces: 0, totalPieces: 24 });
    expect(fromBasePieces(12)).toEqual({ cartons: 0, boxes: 1, pieces: 0, totalPieces: 12 });
    expect(fromBasePieces(1)).toEqual({ cartons: 0, boxes: 0, pieces: 1, totalPieces: 1 });
  });

  test("converts prices by unit", () => {
    expect(convertPrice(240, "Carton", "Piece")).toBe(10);
    expect(convertPrice(240, "Carton", "Box")).toBe(120);
    expect(convertPrice(120, "Box", "Piece")).toBe(10);
    expect(convertPrice(120, "Box", "Carton")).toBe(240);
    expect(convertPrice(10, "Piece", "Box")).toBe(120);
    expect(convertPrice(10, "Piece", "Carton")).toBe(240);
  });

  test("converts canonical per-Piece prices into each unit", () => {
    expect(pricePerPiece(240, "Carton")).toBe(10);
    expect(pricePerPiece(120, "Box")).toBe(10);
    expect(priceForUnit(10, "Carton")).toBe(240);
    expect(priceForUnit(10, "Box")).toBe(120);
    expect(priceForUnit(10, "Piece")).toBe(10);
    expect(priceForUnit(10, "kg")).toBeNull();
  });

  test("parses money without silently accepting malformed values", () => {
    expect(parseMoneyInput(undefined)).toBe(0);
    expect(parseMoneyInput("")).toBe(0);
    expect(parseMoneyInput("1,250.50")).toBe(1250.5);
    expect(parseMoneyInput(12.345)).toBe(12.35);
    expect(parseMoneyInput("NaN")).toBeNull();
    expect(parseMoneyInput("Infinity")).toBeNull();
    expect(parseMoneyInput(Number.POSITIVE_INFINITY)).toBeNull();
    expect(parseMoneyInput(-1)).toBeNull();
    expect(parseMoneyInput("12abc")).toBeNull();
    expect(parseMoneyInput({})).toBeNull();
  });

  test("distinguishes missing saved money from an explicit zero", () => {
    expect(parseStoredMoney(undefined)).toBeNull();
    expect(parseStoredMoney(null)).toBeNull();
    expect(parseStoredMoney("")).toBeNull();
    expect(parseStoredMoney(0)).toBe(0);
    expect(parseStoredMoney("240.50")).toBe(240.5);
  });

  test("rounds money safely", () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(Number.NaN)).toBe(0);
    expect(roundMoney(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
