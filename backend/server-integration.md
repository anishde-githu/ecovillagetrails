# Wiring the calendar backend into your existing server.js

Your `package.json` has `"type": "module"` set, so this project uses ES modules
(`import`/`export`) instead of CommonJS (`require`/`module.exports`). All files
in this package are already written that way.

1. Install dependencies (in your project root, where package.json lives):

```
npm install express groq-sdk dotenv cors
```

2. Copy the three backend files into your project's `backend/` folder:
   - backend/groqService.js
   - backend/calendarController.js
   - backend/calendarRoutes.js

3. Add your Groq API key to your `.env` file (see `.env.example`):

```
GROQ_API_KEY=your_real_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

4. Use the provided `server.js` at the project root, or if you already have
   one, add these lines to it:

```js
import calendarRoutes from './backend/calendarRoutes.js';

// ... after you create your `app` and add express.json()/cors() ...
app.use('/api', calendarRoutes);
```

That's it — your frontend can now POST to `/api/calendar-ai` with
`{ date, eventName, location, eventType }` and receive back the full
structured travel-intelligence JSON.

## Important: this only works with .js files here, not require()

Because of `"type": "module"`, every `.js` file in this project is parsed as
an ES module. If you ever paste in code that uses `require(...)`, you'll get
`ReferenceError: require is not defined in ES module scope`. Two fixes if
that happens:
- Rewrite the file to use `import`/`export` (what we've done here), **or**
- Rename that specific file to `.cjs` (Node will then treat it as CommonJS).

Stick with `import`/`export` everywhere in this feature — it's consistent
with the rest of your Next.js-style project.
