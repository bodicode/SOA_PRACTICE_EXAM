import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const EXAM_P_FORMULAS = [
    // Basic Probability
    {
        name: "Conditional Probability",
        category: "Probability",
        formula: "P(A|B) = \\frac{P(A \\cap B)}{P(B)}",
        explanation: "The probability of event A occurring given that event B has occurred.",
        example: "If P(A ∩ B) = 0.3 and P(B) = 0.5, then P(A|B) = 0.3/0.5 = 0.6",
        difficulty: 1
    },
    {
        name: "Bayes' Theorem",
        category: "Probability",
        formula: "P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}",
        explanation: "Updates the probability of hypothesis A given new evidence B. Used extensively in actuarial science for risk assessment.",
        example: "Given: P(Disease) = 0.01, P(Positive|Disease) = 0.95, P(Positive|No Disease) = 0.05. Find P(Disease|Positive).",
        difficulty: 2
    },
    {
        name: "Law of Total Probability",
        category: "Probability",
        formula: "P(A) = \\sum_{i=1}^{n} P(A|B_i) \\cdot P(B_i)",
        explanation: "Calculates the total probability of event A by considering all possible conditions B_i that partition the sample space.",
        example: "If a bag has 3 red and 2 blue balls, and you draw without replacement, find P(2nd is red).",
        difficulty: 2
    },
    {
        name: "Independence",
        category: "Probability",
        formula: "P(A \\cap B) = P(A) \\cdot P(B)",
        explanation: "Two events A and B are independent if the occurrence of one does not affect the probability of the other.",
        example: "Two fair dice: P(First=6 AND Second=6) = 1/6 × 1/6 = 1/36",
        difficulty: 1
    },
    {
        name: "Complement Rule",
        category: "Probability",
        formula: "P(A^c) = 1 - P(A)",
        explanation: "The probability that event A does NOT occur.",
        example: "If P(rain) = 0.3, then P(no rain) = 1 - 0.3 = 0.7",
        difficulty: 1
    },

    // Expected Value & Variance
    {
        name: "Expected Value (Discrete)",
        category: "Expected Value",
        formula: "E[X] = \\sum_{i} x_i \\cdot P(X = x_i)",
        explanation: "The weighted average of all possible values, where weights are the probabilities.",
        example: "For a fair die: E[X] = (1+2+3+4+5+6)/6 = 3.5",
        difficulty: 1
    },
    {
        name: "Expected Value (Continuous)",
        category: "Expected Value",
        formula: "E[X] = \\int_{-\\infty}^{\\infty} x \\cdot f(x) \\, dx",
        explanation: "The continuous analog of discrete expected value, integrating over the PDF.",
        example: "For Uniform(0,1): E[X] = ∫₀¹ x dx = 1/2",
        difficulty: 2
    },
    {
        name: "Variance Formula",
        category: "Expected Value",
        formula: "Var(X) = E[X^2] - (E[X])^2",
        explanation: "The shortcut formula for variance. Measures the spread around the mean.",
        example: "If E[X] = 3 and E[X²] = 10, then Var(X) = 10 - 9 = 1",
        difficulty: 1
    },
    {
        name: "Standard Deviation",
        category: "Expected Value",
        formula: "\\sigma = \\sqrt{Var(X)}",
        explanation: "Square root of variance, gives measure of spread in same units as X.",
        example: "If Var(X) = 16, then σ = 4",
        difficulty: 1
    },
    {
        name: "Covariance",
        category: "Expected Value",
        formula: "Cov(X,Y) = E[XY] - E[X]E[Y]",
        explanation: "Measures how two random variables change together.",
        example: "If E[XY] = 10, E[X] = 2, E[Y] = 4, then Cov(X,Y) = 10 - 8 = 2",
        difficulty: 2
    },
    {
        name: "Correlation",
        category: "Expected Value",
        formula: "\\rho_{X,Y} = \\frac{Cov(X,Y)}{\\sigma_X \\sigma_Y}",
        explanation: "Standardized covariance, always between -1 and 1.",
        example: "If Cov(X,Y) = 6, σₓ = 2, σᵧ = 3, then ρ = 6/(2×3) = 1",
        difficulty: 2
    },

    // Discrete Distributions
    {
        name: "Binomial PMF",
        category: "Distributions",
        formula: "P(X=k) = \\binom{n}{k} p^k (1-p)^{n-k}",
        explanation: "Number of successes in n independent Bernoulli trials. Parameters: n (trials), p (success probability).",
        example: "5 coin flips, P(exactly 3 heads) = C(5,3)(0.5)³(0.5)² = 10/32",
        difficulty: 2
    },
    {
        name: "Binomial Mean & Variance",
        category: "Distributions",
        formula: "E[X] = np, \\quad Var(X) = np(1-p)",
        explanation: "Mean and variance formulas for Binomial(n,p) distribution.",
        example: "For n=10, p=0.3: E[X] = 3, Var(X) = 2.1",
        difficulty: 1
    },
    {
        name: "Poisson PMF",
        category: "Distributions",
        formula: "P(X=k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}",
        explanation: "Models rare events occurring at a constant rate λ. Mean = Variance = λ.",
        example: "If λ=3 calls/hour, P(exactly 2 calls) = 3²e⁻³/2! ≈ 0.224",
        difficulty: 2
    },
    {
        name: "Geometric PMF",
        category: "Distributions",
        formula: "P(X=k) = (1-p)^{k-1} p",
        explanation: "Number of trials until first success. Mean = 1/p.",
        example: "P(first head on 4th flip) = (0.5)³(0.5) = 1/16",
        difficulty: 2
    },
    {
        name: "Negative Binomial PMF",
        category: "Distributions",
        formula: "P(X=k) = \\binom{k-1}{r-1} p^r (1-p)^{k-r}",
        explanation: "Number of trials until rth success. Generalization of Geometric.",
        example: "P(3rd head on 5th flip) = C(4,2)(0.5)³(0.5)² = 6/32",
        difficulty: 3
    },

    // Continuous Distributions
    {
        name: "Uniform Distribution",
        category: "Distributions",
        formula: "f(x) = \\frac{1}{b-a}, \\quad x \\in [a,b]",
        explanation: "All values equally likely. E[X] = (a+b)/2, Var(X) = (b-a)²/12",
        example: "Uniform(0,10): f(x) = 0.1, E[X] = 5, Var(X) = 100/12",
        difficulty: 1
    },
    {
        name: "Exponential PDF",
        category: "Distributions",
        formula: "f(x) = \\lambda e^{-\\lambda x}, \\quad x \\geq 0",
        explanation: "Time until first event in Poisson process. Memoryless property. E[X] = 1/λ.",
        example: "If λ=2 failures/hour, E[time to failure] = 0.5 hours",
        difficulty: 2
    },
    {
        name: "Normal PDF",
        category: "Distributions",
        formula: "f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}",
        explanation: "The bell curve. Most important distribution. Parameters: μ (mean), σ (std dev).",
        example: "68% of data within 1σ, 95% within 2σ, 99.7% within 3σ",
        difficulty: 2
    },
    {
        name: "Standard Normal",
        category: "Distributions",
        formula: "Z = \\frac{X - \\mu}{\\sigma}",
        explanation: "Transform any Normal to Standard Normal N(0,1) for table lookup.",
        example: "If X ~ N(100, 15), then P(X > 115) = P(Z > 1) ≈ 0.1587",
        difficulty: 1
    },
    {
        name: "Gamma Distribution",
        category: "Distributions",
        formula: "f(x) = \\frac{\\lambda^\\alpha}{\\Gamma(\\alpha)} x^{\\alpha-1} e^{-\\lambda x}",
        explanation: "Sum of α independent Exponential(λ) variables. E[X] = α/λ, Var(X) = α/λ².",
        example: "Time until αth event in Poisson process with rate λ.",
        difficulty: 3
    },

    // Moment Generating Functions
    {
        name: "MGF Definition",
        category: "MGF",
        formula: "M_X(t) = E[e^{tX}]",
        explanation: "Uniquely determines a distribution. Use to find moments: E[Xⁿ] = M⁽ⁿ⁾(0).",
        example: "For Poisson(λ): M(t) = e^{λ(eᵗ-1)}",
        difficulty: 2
    },
    {
        name: "MGF of Sum",
        category: "MGF",
        formula: "M_{X+Y}(t) = M_X(t) \\cdot M_Y(t)",
        explanation: "If X and Y are independent, the MGF of their sum is the product of their MGFs.",
        example: "Sum of two independent Poisson(λ₁) and Poisson(λ₂) is Poisson(λ₁+λ₂).",
        difficulty: 2
    },

    // Transformations
    {
        name: "Linear Transformation",
        category: "Transformations",
        formula: "E[aX + b] = aE[X] + b, \\quad Var(aX + b) = a^2 Var(X)",
        explanation: "Adding a constant shifts the mean, multiplying scales both mean and variance.",
        example: "If Y = 2X + 3, and E[X] = 5, Var(X) = 4, then E[Y] = 13, Var(Y) = 16",
        difficulty: 1
    },
    {
        name: "CDF Method",
        category: "Transformations",
        formula: "F_Y(y) = P(Y \\leq y) = P(g(X) \\leq y)",
        explanation: "Find CDF of Y = g(X) by expressing in terms of X, then differentiate.",
        example: "If Y = X², find F_Y(y) = P(X² ≤ y) = P(-√y ≤ X ≤ √y)",
        difficulty: 3
    },
    {
        name: "Change of Variables",
        category: "Transformations",
        formula: "f_Y(y) = f_X(g^{-1}(y)) \\cdot |\\frac{d}{dy}g^{-1}(y)|",
        explanation: "Direct formula for PDF of Y = g(X) when g is monotonic.",
        example: "If X ~ Exp(1) and Y = √X, find f_Y(y).",
        difficulty: 3
    },

    // Joint Distributions
    {
        name: "Marginal PDF",
        category: "Joint",
        formula: "f_X(x) = \\int_{-\\infty}^{\\infty} f_{X,Y}(x,y) \\, dy",
        explanation: "Integrate out the other variable to get the marginal distribution.",
        example: "If f(x,y) = 2 for 0<x<y<1, then f_X(x) = ∫ₓ¹ 2 dy = 2(1-x)",
        difficulty: 2
    },
    {
        name: "Conditional PDF",
        category: "Joint",
        formula: "f_{Y|X}(y|x) = \\frac{f_{X,Y}(x,y)}{f_X(x)}",
        explanation: "The distribution of Y given a specific value of X.",
        example: "Used to find E[Y|X=x] and Var(Y|X=x).",
        difficulty: 2
    },
    {
        name: "Double Expectation",
        category: "Joint",
        formula: "E[Y] = E[E[Y|X]]",
        explanation: "Take expectation of the conditional expectation over X.",
        example: "E[Y] = ∫ E[Y|X=x] f_X(x) dx",
        difficulty: 2
    },
    {
        name: "Variance Decomposition",
        category: "Joint",
        formula: "Var(Y) = E[Var(Y|X)] + Var(E[Y|X])",
        explanation: "Total variance = Expected conditional variance + Variance of conditional mean.",
        example: "EVVE formula: useful in credibility theory and hierarchical models.",
        difficulty: 3
    }
]

export async function GET() {
    try {
        // Check if cards already exist
        const count = await prisma.formulaCard.count()
        if (count > 0) {
            return NextResponse.json({
                message: `Database already has ${count} formula cards. Skipping seed.`,
                seeded: false,
                count
            })
        }

        // Seed the formulas
        await prisma.formulaCard.createMany({
            data: EXAM_P_FORMULAS
        })

        return NextResponse.json({
            message: `Successfully seeded ${EXAM_P_FORMULAS.length} formula cards!`,
            seeded: true,
            count: EXAM_P_FORMULAS.length,
            categories: [...new Set(EXAM_P_FORMULAS.map(f => f.category))]
        })
    } catch (error) {
        console.error('Error seeding flashcards:', error)
        return NextResponse.json(
            { error: 'Failed to seed flashcards' },
            { status: 500 }
        )
    }
}
