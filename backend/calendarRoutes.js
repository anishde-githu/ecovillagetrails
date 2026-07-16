// ============================================================
// calendarRoutes.js
// Defines the /api/calendar-ai route and wires it to the controller.
// Mount this router in your main server.js (see server-integration.md).
// ============================================================

import express from 'express';
import { generateCalendarInsights } from './calendarController.js';

const router = express.Router();

// POST /api/calendar-ai
// Body: { date, eventName, location, eventType }
router.post('/calendar-ai', generateCalendarInsights);

export default router;