// src/engines/MathParser.ts

export type MathFunctionType = 'parabola' | 'sine' | 'cubic' | 'gaussian' | 'custom';

export class MathParser {
  private static readonly H = 1e-5; // For central difference

  // Pre-configured well-behaved functions with analytical formulas and LaTeX representation
  public static readonly PRESETS: Record<
    string,
    {
      name: string;
      latex: string;
      derivativeLatex: string;
      fn: (x: number) => number;
      integral: (a: number, b: number) => number;
    }
  > = {
    parabola: {
      name: 'Parabola f(x) = 0.2x²',
      latex: 'f(x) = 0.2 x^2',
      derivativeLatex: "f'(x) = 0.4 x",
      fn: (x: number) => 0.2 * x * x,
      integral: (a: number, b: number) => (0.2 / 3) * (Math.pow(b, 3) - Math.pow(a, 3)),
    },
    sine: {
      name: 'Sine Wave f(x) = 2 sin(x)',
      latex: 'f(x) = 2 \\sin(x)',
      derivativeLatex: "f'(x) = 2 \\cos(x)",
      fn: (x: number) => 2 * Math.sin(x),
      integral: (a: number, b: number) => -2 * (Math.cos(b) - Math.cos(a)),
    },
    cubic: {
      name: 'Cubic f(x) = 0.1(x³ - 6x)',
      latex: 'f(x) = 0.1(x^3 - 6x)',
      derivativeLatex: "f'(x) = 0.1(3x^2 - 6)",
      fn: (x: number) => 0.1 * (Math.pow(x, 3) - 6 * x),
      integral: (a: number, b: number) => 0.1 * ((Math.pow(b, 4) / 4 - 3 * Math.pow(b, 2)) - (Math.pow(a, 4) / 4 - 3 * Math.pow(a, 2))),
    },
    gaussian: {
      name: 'Bell Curve f(x) = 3 e^(-x² / 4)',
      latex: 'f(x) = 3 e^{-x^2 / 4}',
      derivativeLatex: "f'(x) = -1.5 x e^{-x^2 / 4}",
      fn: (x: number) => 3 * Math.exp(-(x * x) / 4),
      integral: (a: number, b: number) => MathParser.numericalSimpson(x => 3 * Math.exp(-(x * x) / 4), a, b, 200),
    },
  };

  // Safe expression evaluator for simple user expressions like "0.5*x^2 - 2" or "sin(x)"
  public static compileExpression(expr: string): (x: number) => number {
    const cleaned = expr.trim().toLowerCase();
    
    // Check if preset key
    if (this.PRESETS[cleaned]) {
      return this.PRESETS[cleaned].fn;
    }

    // Build a safe evaluator using Math functions
    return (x: number) => {
      try {
        // Sanitize and replace tokens safely
        let s = cleaned
          .replace(/\bsin\b/g, 'Math.sin')
          .replace(/\bcos\b/g, 'Math.cos')
          .replace(/\btan\b/g, 'Math.tan')
          .replace(/\bsqrt\b/g, 'Math.sqrt')
          .replace(/\babs\b/g, 'Math.abs')
          .replace(/\bexp\b/g, 'Math.exp')
          .replace(/\bpi\b/g, 'Math.PI')
          .replace(/\be\b/g, 'Math.E')
          .replace(/\^/g, '**');

        // Insert implicit multiplication e.g. 2x -> 2*x
        s = s.replace(/(\d+)\s*x/g, '$1*x');
        s = s.replace(/x\s*(\d+)/g, 'x*$1');

        // Only allow safe math tokens
        if (/[^0-9x+\-*/.()MathsincotabepqEPI\s,]/.test(s)) {
          return 0;
        }

        // Safe Function constructor with x argument
        const func = new Function('x', `return (${s});`);
        const val = func(x);
        return isFinite(val) ? val : 0;
      } catch {
        return 0;
      }
    };
  }

  // Live derivative using central difference: f'(x) ≈ [f(x+h) - f(x-h)] / (2h)
  public static derivative(f: (x: number) => number, x: number): number {
    const h = this.H;
    return (f(x + h) - f(x - h)) / (2 * h);
  }

  // Second derivative: f''(x) ≈ [f(x+h) - 2f(x) + f(x-h)] / h^2
  public static secondDerivative(f: (x: number) => number, x: number): number {
    const h = this.H;
    return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
  }

  // Curvature κ(x) = |f''(x)| / (1 + (f'(x))^2)^(3/2)
  public static curvature(f: (x: number) => number, x: number): number {
    const dy = this.derivative(f, x);
    const d2y = this.secondDerivative(f, x);
    const denom = Math.pow(1 + dy * dy, 1.5);
    return Math.abs(d2y) / (denom < 1e-9 ? 1e-9 : denom);
  }

  // Exact Definite Integral using Simpson's Rule
  public static numericalSimpson(f: (x: number) => number, a: number, b: number, n: number = 200): number {
    if (a === b) return 0;
    if (a > b) return -this.numericalSimpson(f, b, a, n);

    // Make n even
    const steps = n % 2 === 0 ? n : n + 1;
    const dx = (b - a) / steps;
    let sum = f(a) + f(b);

    for (let i = 1; i < steps; i++) {
      const x = a + i * dx;
      sum += (i % 2 === 0 ? 2 : 4) * f(x);
    }

    return (dx / 3) * sum;
  }

  // Riemann Sum Calculation
  public static calculateRiemann(
    f: (x: number) => number,
    a: number,
    b: number,
    n: number,
    type: 'left' | 'right' | 'midpoint' | 'trapezoid' = 'midpoint'
  ): {
    rectangles: { x: number; width: number; height: number; sampleX: number }[];
    sum: number;
    exact: number;
    error: number;
  } {
    const minX = Math.min(a, b);
    const maxX = Math.max(a, b);
    const count = Math.max(2, Math.min(100, Math.round(n)));
    const dx = (maxX - minX) / count;

    const rectangles: { x: number; width: number; height: number; sampleX: number }[] = [];
    let sum = 0;

    for (let i = 0; i < count; i++) {
      const xLeft = minX + i * dx;
      const xRight = xLeft + dx;
      let sampleX = xLeft;

      if (type === 'left') {
        sampleX = xLeft;
        const h = f(sampleX);
        sum += h * dx;
        rectangles.push({ x: xLeft, width: dx, height: h, sampleX });
      } else if (type === 'right') {
        sampleX = xRight;
        const h = f(sampleX);
        sum += h * dx;
        rectangles.push({ x: xLeft, width: dx, height: h, sampleX });
      } else if (type === 'midpoint') {
        sampleX = (xLeft + xRight) / 2;
        const h = f(sampleX);
        sum += h * dx;
        rectangles.push({ x: xLeft, width: dx, height: h, sampleX });
      } else if (type === 'trapezoid') {
        const h1 = f(xLeft);
        const h2 = f(xRight);
        const avgH = (h1 + h2) / 2;
        sum += avgH * dx;
        rectangles.push({ x: xLeft, width: dx, height: avgH, sampleX: (xLeft + xRight) / 2 });
      }
    }

    const exact = this.numericalSimpson(f, minX, maxX, 300);
    const error = Math.abs(sum - exact);

    return { rectangles, sum, exact, error };
  }
}
