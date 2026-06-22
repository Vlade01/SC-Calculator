# SC Calcy (Scientific Hub Calculator)

SC Calcy is a Next.js (App Router) web application that provides:
- A **CAS + calculus + plotting + geometry + matrices + statistics + complex numbers** workspace (`MathEngine`)
- **Finance calculators** for **EMI** and **SIP** (`FinanceTools`)
- A **live currency converter** with hourly refresh (`CurrencyConverter`)
- **Email/password authentication** using **NextAuth Credentials** and **MongoDB** (`lib/auth.ts`, API routes, and Mongoose models)

---

## Tech stack

- **Next.js** 14 (App Router)
- **React**
- **Tailwind CSS**
- **NextAuth** (JWT sessions, credentials provider)
- **Mongoose** + MongoDB
- Math/graph libraries used by the calculator:
  - **mathjs** (numeric evaluation, matrices, statistics)
  - **nerdamer** (symbolic CAS and calculus)
  - **react-plotly.js** (2D/3D plotting)
  - **jsxgraph** (interactive dynamic geometry)
- **SWR** (currency data fetching + caching)

---

## Repository structure (key files)

- `app/`
  - `layout.tsx` – root layout wrapper
  - `page.tsx` – landing page
  - `dashboard/page.tsx` – authenticated workspace page
  - `login/page.tsx` – login form
  - `signup/page.tsx` – signup form
  - `api/auth/[...nextauth]/route.ts` – NextAuth route handler
  - `api/auth/signup/route.ts` – signup endpoint
  - `api/auth/signin-log/route.ts` – signin attempt logging endpoint
- `components/`
  - `MathEngine.tsx` – main math workspace (CAS + calculus + plot + geometry + matrix + stats + complex)
  - `FinanceTools.tsx` – EMI and SIP calculators
  - `CurrencyConverter.tsx` – live FX conversion
  - `Sidebar.tsx` – navigation sidebar
  - `Providers.tsx` – wraps app with NextAuth SessionProvider
- `lib/`
  - `auth.ts` – NextAuth configuration
  - `mongodb.ts` – MongoDB connection helper
- `models/`
  - `User.ts` – Mongoose user model/schema
  - `SigninAttempt.ts` – Mongoose signin attempt model/schema

---

## Code walkthrough (functions/components)

### `app/layout.tsx`

#### `metadata`
- Exports `Metadata` for the document title/description.

#### `RootLayout({ children })`
- Wraps the entire app in `<Providers>`.
- Returns the base HTML structure:
  - `<html lang="en">`
  - `<body>` containing `Providers`.

---

### `app/page.tsx`

#### `HomePage()`
- Landing page.
- Provides links to:
  - `/login`
  - `/signup`
- Does not perform any logic besides rendering UI.

---

### `app/dashboard/page.tsx`

#### `DashboardPage()` (async server component)
- Uses `getServerSession(authOptions)` to check authentication.
- If there is **no session**, it redirects to `/login`.
- Otherwise renders:
  - `<Sidebar />`
  - `<MathEngine />` (CAS & graphs)
  - `<FinanceTools />` (EMI & SIP)
  - `<CurrencyConverter />` (FX conversion)

---

### `app/login/page.tsx`

#### `LoginPage()`
- Client component.
- Maintains local state:
  - `email`, `password`, `error`, `loading`
- Internal helper:
  - `handleSubmit(event)`

#### `handleSubmit(event: FormEvent<HTMLFormElement>)`
- Prevents default form submit.
- Calls NextAuth `signIn("credentials", { redirect: false, email, password })`.
- If `result.error` exists, it sets the error message.
- Otherwise navigates to `/dashboard` using `router.push`.

---

### `app/signup/page.tsx`

#### `SignupPage()`
- Client component.
- Maintains local state:
  - `email`, `password`, `error`, `success`, `loading`
- Internal helper:
  - `handleSubmit(event)`

#### `handleSubmit(event: FormEvent<HTMLFormElement>)`
- Prevents default form submit.
- POSTs to `/api/auth/signup` with JSON body `{ email, password }`.
- If response is not OK, reads `{ error }` from JSON.
- On success:
  - shows success message
  - after ~1.2s, redirects to `/login`.

---

## Auth and database layer

### `app/api/auth/[...nextauth]/route.ts`

#### `handler = NextAuth(authOptions)`
- Exports the NextAuth handler for both GET and POST.
- NextAuth takes over the rest of the auth flow.

---

### `app/api/auth/signup/route.ts`

#### `POST(request: NextRequest)`
- Parses JSON body: `{ email, password }`.
- Normalizes `email`:
  - `trim()` + `toLowerCase()`
- Validations:
  - returns 400 if email/password missing
- Uses `dbConnect()` then checks if a user already exists:
  - `User.findOne({ email })`
  - returns 409 on conflict
- Password hashing:
  - `bcrypt.hash(password, 12)`
- Username generation:
  - derives local part from email (`email.split('@')[0]`)
  - appends a timestamp suffix: `${local}_${Date.now().toString(36)}`
- Creates user:
  - `User.create({ username, email, password: hashedPassword })`
- Returns `{ success: true }` with status 201.

---

### `app/api/auth/signin-log/route.ts`

#### `POST(request: NextRequest)`
- Parses JSON body: `{ email, userId, success, error }`.
- Validations:
  - returns 400 if `email` missing
- Calls `dbConnect()`.
- Reads request metadata:
  - IP: `x-forwarded-for` or `x-real-ip`
  - user agent: `user-agent`
- Creates a `SigninAttempt` record with all fields.
- Returns `{ logged: true }` on success.
- Catches and logs errors; returns 500.

> Note: This route logs signin attempts, but the current UI code does not obviously call this endpoint.

---

### `lib/mongodb.ts`

#### `dbConnect()`
- Provides a cached Mongoose connection to avoid reconnecting on every request.

Internal details:
- Reads `process.env.MONGODB_URI` into `uri`.
- Throws if `MONGODB_URI` is missing.
- Uses a module-level cache stored on `global` (`globalAny.mongoose`) to persist in dev.
- Logic:
  - If `cached.conn` exists: return it.
  - If `cached.promise` is missing: create it via `mongoose.connect(uri)`.
  - Await `cached.promise`, set `cached.conn`, then return.

---

### `lib/auth.ts`

#### `authOptions` (NextAuth configuration)

##### Credentials provider
- Provider named **Credentials**.
- `credentials` schema declares:
  - `email` (type: email)
  - `password`
- Internal method:
  - `authorize(credentials)`

#### `authorize(credentials)`
- Validations:
  - throws if `email` or `password` missing
- Connects to MongoDB via `dbConnect()`.
- Looks up user:
  - `UserModel.findOne({ email: credentials.email.toLowerCase().trim() })`
- If no user, throws `Invalid credentials`.
- Compares password:
  - `bcrypt.compare(credentials.password, user.password)`
- If invalid, throws `Invalid credentials`.
- On success returns:
  - `{ id: user._id.toString(), email: user.email }`

##### Session strategy
- `strategy: "jwt"`
- `maxAge: 7 days`

##### Callbacks
- `jwt({ token, user })`
  - when `user` exists, stores `user.id` into `token.id`
- `session({ session, token })`
  - copies `token.id` into `session.user.id`

##### Pages
- `signIn: "/login"`

##### Secret
- Uses `process.env.NEXTAUTH_SECRET`.

---

### `models/User.ts`

#### `IUser` interface
- Declares fields expected on the Mongoose document.

#### `UserSchema`
- Fields:
  - `username`: optional string (default `null`)
  - `email`: required, unique, stored lowercase+trimmed
  - `password`: required hashed string
  - `createdAt`: defaults to `Date.now`
- `{ timestamps: true }` also adds `createdAt`/`updatedAt`.

#### `User` model export
- Uses existing mongoose model if present, else creates one.

---

### `models/SigninAttempt.ts`

#### `ISigninAttempt` interface
- Declares structure for signin logging.

#### `SigninAttemptSchema`
- Fields:
  - `email` (required, lowercase+trim)
  - `userId` (optional)
  - `success` (required boolean)
  - `ipAddress`, `userAgent` (optional)
  - `error` (optional string)
  - `createdAt` defaults to `Date.now`

#### `SigninAttempt` model export
- Same “use existing model or create new” pattern.

---

## UI / math / finance components

### `components/Sidebar.tsx`

#### `navItems`
- Simple array of sidebar links.

#### `Sidebar()`
- Renders navigation links using `next/link`.
- Styled as a left sidebar (hidden on small screens via Tailwind classes).

---

### `components/Providers.tsx`

#### `Providers({ children })`
- Wraps children in NextAuth `SessionProvider`.
- Enables client components to use auth session hooks.

---

## `components/MathEngine.tsx` (math functions + CAS)

This is the most feature-heavy file.
It is a **client component** and provides multiple tabs:
- `symbolic` (simplify/expand/factor)
- `calculus` (limit/derive/integrate)
- `plot` (2D/3D plotting)
- `geometry` (JSXGraph board)
- `matrix` (inverse/determinant/rref/eigen)
- `stats` (mean/median/std/variance/etc.)
- `complex` (complex arithmetic)

#### External libraries used
- `mathjs`:
  - `create(all)` creates an instance with many functions enabled.
  - used for numeric evaluation (`compile`, `evaluate`), matrices, statistics.
- `nerdamer`:
  - symbolic manipulation and calculus operations.
- `react-plotly.js`:
  - renders Plotly charts.
- `jsxgraph`:
  - renders interactive dynamic geometry.

---

### `MathEngine()` (main exported component)

State variables:
- `activeTab: Tab` – which tool is displayed.
- `expression` / `symbolicOutput`
- `calcInput` / `calcOutput`
- `graphInput`, `graphType`, `graphData`, `graphLayout`
- `sampleTable` (x/y samples from plots)
- `matrixExpression` / `matrixResult`
- `statsInput` / `statsResult`
- `complexInput` / `complexOutput`
- `error` – shared error banner
- `boardRef` – DOM node for JSXGraph initialization

#### `tabs`
- Maps tab keys to labels.

---

### `useEffect(..., [activeTab])` for geometry

When `activeTab === "geometry"`, it dynamically imports `jsxgraph` and initializes a board:
- Removes an existing board if found.
- Calls:
  - `initBoard(boardRef.current, { boundingbox, axis, showNavigation, keepAspectRatio })`
- Creates:
  - Origin point `O`
  - Points `A`, `B`
  - A line through `A` and `B`
  - A circle with endpoints `A` and `B`

---

## Math-engine helper functions (with math details)

### `buildSampleTable(fn: (x: number) => number)`
- Generates 11 sample points for `x` in the range `[-5, 5]` (inclusive).
- For each index:
  - `x = -5 + index`
  - `y = fn(x)` formatted to 6 decimals if finite, else `NaN`
- Updates `sampleTable`.

Used by:
- `plot2D` to show an intercept/value table approximation.

---

### `plot2D()`

Purpose: render a **2D curve** `y = f(x)`.

Steps:
1. `setError(null)`
2. Compile the expression:
   - `math.compile(graphInput.replace(/\^/g, "**"))`
   - This converts `^` exponent notation into JS/mathjs power operator `**`.
3. Sample points:
   - `xs`: 201 points from `-10` to `+10` step `0.1`
   - For each `x`, evaluate compiled expression with scope `{ x }`.
   - Non-finite values become `NaN`.
4. Update Plotly data:
   - sets `graphData` to a line trace with `mode: "lines"`.
5. Update Plotly layout (`title`, background colors, axes titles/grid colors).
6. Also calls:
   - `buildSampleTable((x) => compiled.evaluate({ x }))`

Error handling:
- If parsing/evaluation fails, sets `error = "Unable to parse the graph expression."`.

---

### `plot3D()`

Purpose: render a **3D surface** `z = f(x, y)`.

Steps:
1. `expr = graphInput.replace(/\^/g, "**")`
2. `compiled = math.compile(expr)`
3. Build grids:
   - `xValues`: 35 points from `-4` to `+4` step `0.25`
   - `yValues`: 35 points from `-4` to `+4` step `0.25`
4. Build `zValues` as a 2D array:
   - For each `x` and `y`, evaluate `compiled.evaluate({ x, y })`.
   - Non-finite becomes `NaN`.
5. Update Plotly:
   - Creates a Plotly surface trace (`type: "surface"`).
6. Clears `sampleTable` since there is no 1D x/y table for 3D.

Error handling:
- Sets an error message if the expression can’t be parsed.

---

### `runSymbolic(operation: "simplify" | "expand" | "factor")`

Purpose: compute symbolic transformations on `expression` using **nerdamer**.

Math/CAS operations:
- `simplify`: `nerdamer(expression).toString()`
- `expand`: `nerdamer(expression).expand().toString()`
- `factor`: `nerdamer(expression).factor().toString()`

Validation:
- If `expression.trim()` is empty, throws `Enter a valid expression.`

Outputs:
- Sets `symbolicOutput` to the nerdamer result string.

---

### `runCalculus(action: "limit" | "derive" | "integrate")`

Purpose: perform calculus operations on `calcInput`.

Math/CAS operations (nerdamer):
- `limit`:
  - `nerdamer.limit(calcInput, "x", 0).toString()`
  - Computes **lim\_{x→0} f(x)** (fixed limit at x→0)
- `derive`:
  - `nerdamer.diff(calcInput, "x").toString()`
  - Computes **d/dx f(x)**
- `integrate`:
  - `nerdamer.integrate(calcInput, "x").toString()`
  - Computes an **indefinite integral** with respect to `x`

Validation:
- If `calcInput.trim()` is empty, throws `Enter a calculus expression.`

Outputs:
- Sets `calcOutput`.

---

### `runMatrixOperation(operation: "inverse" | "determinant" | "rref" | "eigen")`

Purpose: perform matrix operations on a JSON matrix string.

Input format:
- `matrixExpression` must be valid JSON representing a 2D numeric array,
  - e.g. `[[2,1],[1,3]]`.

Common parsing:
- `const matrix = math.matrix(JSON.parse(matrixExpression));`

Operations:
- `inverse`:
  - `math.inv(matrix)`
  - computes **A^{-1}** (if invertible)
- `determinant`:
  - `math.det(matrix)`
  - computes **det(A)**
- `rref`:
  - `(math as any).rref(matrix)`
  - reduced row echelon form (function accessed via `as any`)
- `eigen`:
  - `(math as any).eigs?.(matrix)`
  - if available, returns eigen decomposition output (code uses `eigen.values`)
  - otherwise: sets an error-like string: `"Eigen decomposition unavailable"`

Output:
- `setMatrixResult(JSON.stringify(result, null, 2))`

Error handling:
- `JSON.parse` errors or math errors set:
  - `"Matrix operation failed. Provide a valid JSON matrix."`

---

### `runStats()`

Purpose: compute basic descriptive statistics for a comma-separated dataset.

Input:
- `statsInput` like: `"1, 2, 4, 7, 9"`

Parsing:
- Splits by `,`
- Trims each token
- Converts to Number
- Filters out `NaN`

Validation:
- If `values.length === 0`, throws `Enter a numeric dataset.`

Math/statistics functions (mathjs):
- Mean: `math.mean(values)`
- Median: `math.median(values)`
- Std dev: `math.std(values)`
- Variance:
  - tries `math.var(values)` if present
  - otherwise falls back to `math.variance(values)`

Additional computed values:
- Sorted values (`sorted = [...values].sort((a,b)=>a-b)`)
- Min = `sorted[0]`
- Max = `sorted[n-1]`
- Count = `n`

Output:
- Builds a multi-line string:
  - `Mean`, `Median`, `Std Dev`, `Variance`, `Min`, `Max`, `Count`

Error handling:
- Sets `"Statistics analysis failed. Ensure your dataset is valid."`

---

### `runComplex()`

Purpose: evaluate a complex expression entered as a string.

Input:
- `complexInput` like: `"(2 + 3i)^2"`

Steps:
1. Evaluate expression:
   - `math.evaluate(complexInput.replace(/i/g, "i"))`
   - (The replace is effectively a no-op because it replaces `i` with `i`, but it is meant to normalize input.)
2. Convert result to a complex object:
   - `complexResult = math.complex(value)`
3. Format:
   - If `complexResult.format` exists, uses:
     - `{ notation: "fixed", precision: 6 }`
   - Otherwise falls back to `complexResult.toString()`

Output:
- `setComplexOutput(formatted.toString())`

Error handling:
- Sets `"Complex evaluation failed. Use a valid complex expression like 3 + 2i."`

---

### `analysisOutput` (useMemo)

Purpose: small derived analysis for the 2D plot.

Logic:
- Finds x-values where the sampled y-values are near zero:
  - `Math.abs(row.y) < 1e-2`
- Produces:
  - If any roots: `Intercepts near x = ...`
  - Else: `No intercepts detected in sampled range.`

---

## `components/FinanceTools.tsx` (EMI + SIP math)

### `FinanceTools()` (main exported component)
Maintains input state (all stored as strings):
- `principal`, `interestRate`, `tenure` for EMI
- `monthlyInvestment`, `returnRate`, `timePeriod` for SIP

#### `emi` (useMemo)
Computes monthly EMI using the standard amortizing loan formula:

- Inputs:
  - `P = Number(principal)`
  - `r = Number(interestRate) / 1200`
    - (annual % → monthly decimal)
  - `n = Number(tenure) * 12`
- Validation:
  - if `!P || !r || !n` returns `0`
- Formula used:
  - **EMI = (P * r) / (1 - (1 + r)^(-n))**

#### `emiInfo` (useMemo)
Derives totals from `emi`:
- `n = tenure * 12`
- `totalPayment = emi * n`
- `totalInterest = totalPayment - principal`

Returns an object with:
- `monthly`, `totalInterest`, `totalPayment`

#### `sip` (useMemo)
Computes future value for monthly SIP with monthly compounding.

- Inputs:
  - `m = Number(monthlyInvestment)`
  - `annual = Number(returnRate) / 100`
  - `months = Number(timePeriod) * 12`
  - `monthlyRate = annual / 12`

Validation:
- if `!m || !months` returns zeros

Formula used (as implemented):
- `total = m * (( (1 + monthlyRate)^months - 1 ) / monthlyRate) * (1 + monthlyRate)`
- `invested = m * months`
- `returns = total - invested`

#### `pieData` (useMemo)
Creates Plotly pie chart trace showing:
- interest vs principal for the EMI breakdown.

---

## `components/CurrencyConverter.tsx` (math)

### `fetcher(url)`
- Fetches from the FX API.
- Throws if response not OK.
- Validates returned JSON shape:
  - expects `data.result === "success"` or `data.result === undefined`

Returns the parsed JSON.

### `CurrencyConverter()`
States:
- `fromCurrency`, `toCurrency`, `amount`

Uses SWR:
- `useSWR(apiUrl, fetcher, { refreshInterval: 1 hour, revalidateOnFocus: false })`

#### `rate` (useMemo)
Computes conversion ratio using the API base currency USD:
- `baseToFrom = data.rates[fromCurrency]`
- `baseToTo = data.rates[toCurrency]`
- **rate = baseToTo / baseToFrom**

#### `result` (useMemo)
- `numeric = Number(amount)`
- If rate is 0 or numeric is NaN → returns 0
- Else:
  - **result = numeric * rate**

---

## Notes / limitations
- `MathEngine` relies on expression parsing of `mathjs` and symbolic ops of `nerdamer`.
- If an expression uses unsupported syntax, the UI will display a parsing error via the shared `error` state.
- The signup/login forms store passwords in memory only for submission; they are hashed server-side.

