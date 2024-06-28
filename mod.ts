/**
 * Line Segments for squircles
 */
let accuracy = 101;
/**
 * Sets the accuracy to use for the module
 * @param acc The number of line segments to use for the squircle
 */
export function setAccuracy(acc: number) {
    accuracy = acc;
}
/**
 * Gets the accuracy used by the module
 * @returns The current accuracy
 */
export function getAccuracy() {
    return accuracy;
}

/**
 * Creates an SVG Path String representing a superellipse with given exponent, size.x and size.y.
 * Centered at size.x/2 size.y/2
 * @param exponent The exponent of the superellipse (1 = diamond, 2 = circle, infty = square) or a Point with x and y exponents
 * @param size The total size.x of the bounding box
 * @param center The center of the superellipse
 * @param rotation The rotation of the superellipse in radians (clockwise!)
 * @param clockwise Whether the superellipse should be drawn clockwise or counter-clockwise
 */
export function squirc(
    exponent: number|Point = 2,
    size: Size = new Point(1, 1),
    center: Point = new Point(size.x/2, size.y/2),
    rotation: number = 0,
    clockwise: boolean = true
): string {
    // clockwise array of bounding boxes starting top left
    let boundingBox: Point[] = [
        new Point(-size.x/2, -size.y/2),
        new Point( size.x/2, -size.y/2),
        new Point( size.x/2,  size.y/2),
        new Point(-size.x/2,  size.y/2)
    ].map(p => rotate(p, rotation)).map(p => add(p, center));

    // clockwise array of edge centers starting top edge
    let edgeCenters: Point[] = [
        new Point(0, -size.y/2),
        new Point(size.x/2,  0),
        new Point(0,  size.y/2),
        new Point(-size.x/2, 0)
    ].map(p => rotate(p, rotation)).map(p => add(p, center));

    if (!clockwise) {
        boundingBox = boundingBox.reverse();
        edgeCenters = edgeCenters.reverse();
    }

    // base case exponents are the same
    if (exponent instanceof Point) {
        if (exponent.x === exponent.y) {
            exponent = exponent.x;
        }
    }
    if (typeof exponent === "number") {
        return squirc_simple(exponent, size, center, rotation, clockwise, boundingBox, edgeCenters);
    }

    // hybridial squircle
    return hybridial_squircle(exponent, size, center, rotation, clockwise, boundingBox, edgeCenters);
}

function add(p: Point, q: Point) {
    return new Point(p.x + q.x, p.y + q.y);
}
function subtract(p: Point, q: Point) {
    return new Point(p.x - q.x, p.y - q.y);
}

function rotate(p: Point, angle: number) {
    return new Point(
        p.x * Math.cos(angle) - p.y * Math.sin(angle),
        p.x * Math.sin(angle) + p.y * Math.cos(angle)
    );
}

function squirc_simple(
    exponent: number,
    size: Size,
    center: Point,
    rotation: number,
    clockwise: boolean,
    boundingBox: Point[],
    edgeCenters: Point[]
): string {
    // base case square
    if (!isFinite(exponent)) {
        return `M${boundingBox[0]} L${
        boundingBox.slice(1).map(a => a.toString()).join(' ')}Z`;
    }
    // base case diamond
    if (exponent === 1) {
        return `M${edgeCenters[0]} L${
        edgeCenters.slice(1).map(a => a.toString()).join(' ')}Z`;
    }
    // base case circle
    if (exponent === 2) {
        let ps = `M${edgeCenters[0]}A${size.x/2} ${size.y/2} 0 0 ${clockwise ? 1 : 0} ${edgeCenters[2]} ` +
            `${size.x/2} ${size.y/2} 0 0 ${clockwise ? 1 : 0} ${edgeCenters[0]}`;
        return ps;
    }

    // conventional superellipse
    let pathString = `M${clockwise ? edgeCenters[0] : edgeCenters[3]}`;

    // angle starts at PI/2 and should go down if clockwise and up if counter-clockwise
    const origin = Math.PI / 2;

    const step = 2 * Math.PI / accuracy;

    for (let i = 1; i < accuracy; i++) {
        let angle = clockwise ? origin - i * step : origin + i * step;
        let p = new Point(
            size.x/2 * squirc_cos(angle, exponent),
            // the sin function calculates the y coordinate in the opposite direction
            size.y/2 * (-squirc_sin(angle, exponent))
        );
        p = rotate(p, rotation);
        p = add(p, center);
        pathString += `L${p}`;
    }

    return pathString + "Z";
}

function hybridial_squircle(
    exponent: Point,
    size: Size,
    center: Point,
    rotation: number,
    clockwise: boolean,
    boundingBox: Point[],
    edgeCenters: Point[]
): string {
    // hybridial squircle
    let pathString = `M${clockwise ? edgeCenters[0] : edgeCenters[3]}L`;

    if (exponent.x >= 1.5 && exponent.y >= 1.5) {
        // angle starts at PI/2 and should go down if clockwise and up if counter-clockwise
        const origin = Math.PI / 2;

        const step = 2 * Math.PI / accuracy;
        for (let i = 1; i < accuracy; i++) {
            let angle = clockwise ? origin - i * step : origin + i * step;
            let p = new Point(
                size.x/2 * hybridial_squircular_cos(angle, exponent),
                // the sin function calculates the y coordinate in the opposite direction
                size.y/2 * (-hybridial_squircular_sin(angle, exponent))
            );
            p = rotate(p, rotation);
            p = add(p, center);
            pathString += `${p} `;
        }
    } else {
        // no angle solution is better for squircles with exponents less than 2
        // defaulting to exponent.x > exponent.y for better results
        if (exponent.x < exponent.y) {
            exponent = new Point(exponent.y, exponent.x);
            rotation += Math.PI/2;
        }

        let step = 4 / accuracy;
        let cws = (clockwise ? 1 : -1);
        for (let i = 1; i < accuracy/4; i++) {
            let x = i * step;
            let y = hybridial_squircular_quadrant_explicit(x, exponent);
            let p = new Point(
                cws * size.x/2 * x,
                -size.y/2 * y
            );
            p = rotate(p, rotation);
            p = add(p, center);
            pathString += `${p} `;
        }
        for (let i = Math.floor(accuracy/4); i >= 1; i--) {
            let x = i * step;
            let y = hybridial_squircular_quadrant_explicit(x, exponent);
            let p = new Point(
                cws * size.x/2 * x,
                size.y/2 * y
            );
            p = rotate(p, rotation);
            p = add(p, center);
            pathString += `${p} `;
        }
        for (let i = 1; i < accuracy/4; i++) {
            let x = i * step;
            let y = hybridial_squircular_quadrant_explicit(x, exponent);
            let p = new Point(
                -cws * size.x/2 * x,
                size.y/2 * y
            );
            p = rotate(p, rotation);
            p = add(p, center);
            pathString += `${p} `;
        }
        for (let i = Math.floor(accuracy/4); i >= 1; i--) {
            let x = i * step;
            let y = hybridial_squircular_quadrant_explicit(x, exponent);
            let p = new Point(
                -cws * size.x/2 * x,
                -size.y/2 * y
            );
            p = rotate(p, rotation);
            p = add(p, center);
            pathString += `${p} `;
        }
    }
    return pathString + "Z";
}

export class Point {
    constructor(public x: number, public y: number) {}
    public toString() {
        return `${this.x} ${this.y}`;
    }
}

type Size = Point;

function squirc_cos(angle: number, exponent: number): number {
    angle = angle % (2*Math.PI);
    if (angle < 0) {
        return squirc_cos(-angle, exponent);
    }
    // formula only valid in first quadrant
    if (angle > Math.PI/2) {
        return -squirc_cos(Math.PI - angle, exponent);
    }

    // first quadrant yay
    return 1 / Math.pow(1 + Math.pow(Math.tan(angle), exponent), 1/exponent);
}

function squirc_sin(angle: number, exponent: number): number {
    return squirc_cos(Math.PI/2 - angle, exponent);
}

function hybridial_squircular_cos(angle: number, exponent: Point): number {
    // i was forced to solve this transcendental equation numerically...

    // Yet again only valid between 0 and PI/2
    // Reflection formulas:
    // cos(a, x, y) = cos(-a, x, y), shape is symmetric around x-axis
    // cos(a, x, y) = -cos(PI - a, x, y), shape is symmetric around y-axis
    // sin(a, x, y) = cos(PI/2 - a, y, x), transposition formula
    // cos(a, x, y) = sin(PI/2 - a, y, x), transposition formula

    // reflection for negatives
    if (angle < 0) {
        return hybridial_squircular_cos(-angle, exponent);
    }
    // reflection for Quarters 2-4
    if (angle > Math.PI/2) {
        return -hybridial_squircular_cos(Math.PI - angle, exponent);
    }

    // function to find the root of: f(x) = x^exponent.x + (tan(angle)x)^exponent.y - 1
    // derivative: f'(x) = exponent.x * x^(exponent.x - 1) + exponent.y * tan(angle)^exponent.y * x^(exponent.y - 1)
    // newton's method: x_{n+1} = x_n - f(x_n) / f'(x_n)
    // initial guess: x_0 = 1
    let x = 1;
    const steps = 3; // more than that doesn't really make sense on floats

    let f = (x: number): number => {
        return Math.pow(x, exponent.x) + Math.pow(Math.tan(angle) * x, exponent.y) - 1;
    };

    let df = (x: number): number => {
        return exponent.x * Math.pow(x, exponent.x - 1) + exponent.y * Math.pow(Math.tan(angle), exponent.y) * Math.pow(x, exponent.y - 1);
    };

    for (let i = 0; i < 5; i++) {
        let dfx = df(x);
        let fx = f(x);
        x = x - fx / dfx;
    }
    return isNaN(x) ? 1 : x;
}

function hybridial_squircular_sin(angle: number, exponent: Point): number {
    return hybridial_squircular_cos(Math.PI/2 - angle, new Point(exponent.y, exponent.x));
}

function hybridial_squircular_quadrant_explicit(x: number, exponent: Point): number {
    return Math.pow(1 - Math.pow(x, exponent.x), 1/exponent.y);
}