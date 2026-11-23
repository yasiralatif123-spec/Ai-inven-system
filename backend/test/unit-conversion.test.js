const { toBasePieces, fromBasePieces, normalizeUnit, convertPrice } = require("../src/utils/units");

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
});
