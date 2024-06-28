import { expect, test } from 'bun:test';
import { squirc, Point, setAccuracy } from './mod.ts';

function tests() {
    // for testing purposes, set the accuracy to 4000
    setAccuracy(401);

    let testArgs: Parameters<typeof squirc>[] = [
        // basic shape tests
        [Infinity], // should produce a square!
        [2], // should produce a circle!
        [1], // should produce a diamond!
        [3], // should produce a superellipse!
        [6], // should produce a flatter superellipse!
        [0.5], // should produce an inwards superellipse!
        [new Point(2, 0.5), new Point(20, 10)], // should produce an eye-shaped superellipse!

        // position tests
        [5, new Point(10, 15), new Point(2, 4)], // should produce a superellipse with a 10x15 bounding box centered at 2,4!

        // rotation tests
        [4, new Point(2, 2), new Point(1, 1), Math.PI/4], // should produce a superellipse with a 2x2 bounding box centered at 1,1 and rotated by 45 degrees!
    
        // anticlockwise tests
        [Infinity, new Point(1, 1), new Point(0.5, 0.5), 0, false], 
        [2, new Point(1, 1), new Point(0.5, 0.5), 0, false],
        [1, new Point(1, 1), new Point(0.5, 0.5), 0, false],
        [3, new Point(1, 1), new Point(0.5, 0.5), 0, false],
        [6, new Point(1, 1), new Point(0.5, 0.5), 0, false],
        [0.5, new Point(1, 1), new Point(0.5, 0.5), 0, false],
        [new Point(2, 0.5), new Point(20, 10), new Point(1, 1), 0, false],

        // the ultimate test
        [new Point(5, 1), new Point(10, 10), new Point(2, 4), Math.PI/11]
    ];

    const sW = 0.1; // stroke size.x

    testArgs.forEach(async (args, i) => {
        let pathString = squirc(...args);
        await Bun.write(`./out/test${i+1}.svg`, wrapPath(pathString ?? "hi", [
            new Point(
                (-Math.sqrt(2) * (args[1]?.x ?? 1)/2) + (args[2]?.x ?? (args[1]?.x ?? 1)/2) - sW, 
                (-Math.sqrt(2) * (args[1]?.y ?? 1)/2) + (args[2]?.y ?? (args[1]?.y ?? 1)/2) - sW
            ), new Point(
                Math.sqrt(2) * (args[1]?.x ?? 1) + 2 * sW,
                Math.sqrt(2) * (args[1]?.y ?? 1) + 2 * sW
            )
        ], "orange", "blue")).catch(e => console.error(e)).then((e) => {
            console.log(`Test ${i+1} passed!`);
        });
    });
}

function wrapPath(pathString: string, viewBox: [Point, Point], fill: string = "transparent", stroke: string = "black"): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.map(a=>`${a}`).join(' ')}">
    <path fill="${fill}" stroke="${stroke}" stroke-width="0.1" d="${pathString}" />
</svg>`;
}

tests();