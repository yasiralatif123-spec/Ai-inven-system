const {
  toBasePieces,
  fromBasePieces,
  normalizeUnit,
  convertPrice,
  pricePerPiece,
  priceForUnit,
  parseCanonicalPrice,
  parseMoneyInput,
  parseStoredMoney,
  roundCanonicalPrice,
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

  test("keeps canonical per-Piece precision when splitting display prices", () => {
    const purchase = pricePerPiece(1000, "Carton");
    const wholesale = pricePerPiece(1500, "Carton");
    const retail = pricePerPiece(2000, "Carton");

    expect(purchase).toBeCloseTo(41.66666667, 8);
    expect(wholesale).toBe(62.5);
    expect(retail).toBeCloseTo(83.33333333, 8);

    expect(priceForUnit(purchase, "Box")).toBe(500);
    expect(priceForUnit(purchase, "Piece")).toBe(41.67);
    expect(priceForUnit(purchase, "Carton")).toBe(1000);
    expect(priceForUnit(retail, "Box")).toBe(1000);
    expect(priceForUnit(retail, "Carton")).toBe(2000);
  });

  test("round-trips Carton -> Box -> Piece -> Carton repeatedly without drift", () => {
    for (let pass = 0; pass < 20; pass += 1) {
      const purchase = pricePerPiece(1000, "Carton");
      const wholesale = pricePerPiece(1500, "Carton");
      const retail = pricePerPiece(2000, "Carton");

      expect(priceForUnit(purchase, "Box")).toBe(500);
      expect(priceForUnit(wholesale, "Box")).toBe(750);
      expect(priceForUnit(retail, "Box")).toBe(1000);

      expect(priceForUnit(purchase, "Piece")).toBe(41.67);
      expect(priceForUnit(wholesale, "Piece")).toBe(62.5);
      expect(priceForUnit(retail, "Piece")).toBe(83.33);

      expect(priceForUnit(purchase, "Carton")).toBe(1000);
      expect(priceForUnit(wholesale, "Carton")).toBe(1500);
      expect(priceForUnit(retail, "Carton")).toBe(2000);
    }
  });

  test("round-trips Box -> Piece -> Carton -> Box", () => {
    for (const value of [1000, 1500, 2000]) {
      const perPiece = pricePerPiece(value, "Box");
      expect(priceForUnit(perPiece, "Piece")).toBe(Number((value / 12).toFixed(2)));
      expect(priceForUnit(perPiece, "Carton")).toBe(value * 2);
      expect(priceForUnit(perPiece, "Box")).toBe(value);
    }
  });

  test("preserves Piece prices through repeated switching", () => {
    for (const value of [41.67, 62.5, 83.33]) {
      let perPiece = pricePerPiece(value, "Piece");
      for (let pass = 0; pass < 20; pass += 1) {
        expect(priceForUnit(perPiece, "Carton")).toBeCloseTo(value * 24, 2);
        expect(priceForUnit(perPiece, "Box")).toBeCloseTo(value * 12, 2);
        perPiece = pricePerPiece(priceForUnit(perPiece, "Piece"), "Piece");
        expect(perPiece).toBe(value);
      }
    }
  });

  test("parses canonical prices without display rounding", () => {
    expect(parseCanonicalPrice(41.66666667)).toBeCloseTo(41.66666667, 8);
    expect(parseCanonicalPrice("1,250.12345678")).toBeCloseTo(1250.12345678, 8);
    expect(parseCanonicalPrice(0)).toBe(0);
    expect(parseCanonicalPrice("")).toBeNull();
    expect(parseCanonicalPrice(undefined)).toBeNull();
    expect(parseCanonicalPrice(-1)).toBeNull();
    expect(roundCanonicalPrice(1 / 24)).toBeCloseTo(0.04166667, 8);
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
