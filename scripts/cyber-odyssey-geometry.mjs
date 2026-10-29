/**
 * Orbit geometry measured from assets/original/CapriWebServices-Logo.png (921 × 725).
 * Each orbit was fitted to its visible stroke pixels with a least-squares geometric
 * (Sampson-distance) ellipse fit; residual RMS ≈ 4.5 px, i.e. the stroke's own half-width spread.
 * theta is the major-axis rotation in radians (screen space, y down).
 */
export const SOURCE_SIZE = { width: 921, height: 725 };

export const RINGS = [
    { id: "inner", cx: 458.678, cy: 378.744, theta: -0.517, a: 201.774, b: 79.866 },
    { id: "middle", cx: 461.614, cy: 375.891, theta: -0.52, a: 333.172, b: 133.206 },
    { id: "outer", cx: 465.435, cy: 373.585, theta: -0.522, a: 473.88, b: 189.801 },
];

/** Planet discs detected on the outer orbit (centre + radius in source pixels). */
export const PLANETS = [
    { x: 260.17, y: 281.9, r: 33.5 },
    { x: 761.58, y: 390.63, r: 35.4 },
    { x: 54.37, y: 524.74, r: 32 },
];
