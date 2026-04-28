# Frontend Integration Checklist

This checklist captures what the backend must expose, document, or clarify before the existing Vite/React frontend can move from mock state to real API data.

The current frontend is still mock-driven:

- `Login.jsx` authenticates against hardcoded `admin/admin` and `user/user` credentials.
- `App.jsx` stores `role`, `isGenerated`, `isPublished`, and `publishedWeek` only in React state.
- `ScheduleGrid.jsx`, `EmployeeDashboard.jsx`, and `ManagerDashboard.jsx` all read from `frontend/src/constants/scheduleData.js`.
- The frontend currently expects display-ready shift fields: employee name, role/job name, day label, start/end time, and estimated earnings.
- The manager flow currently assumes generate, review, publish, previous/next week navigation, team totals, labor cost, labor percentage, alerts, and schedule-posted notification behavior.

## Integration Blockers

- [x] Add CORS support for the Vite frontend origin.
  - Local frontend default is `http://localhost:5173`.
  - Backend currently does not enable CORS in `SecurityConfig`, so browser calls from Vite will fail preflight.
  - Allow `Authorization`, `Content-Type`, normal REST methods, and credentials policy explicitly.

- [x] Define the frontend API base URL contract.
  - Add a frontend env variable such as `VITE_API_BASE_URL=http://localhost:8080`.
  - Decide whether frontend routes call `/auth/login` directly, use a Vite proxy, or call `/api/...` through a deployed reverse proxy.
  - Document local dev startup order and ports.

- [x] Define the auth/session contract.
  - Backend login endpoint: `POST /auth/login`.
  - Login request body should be documented as `{ "email": "...", "password": "..." }`.
  - Login response currently returns `token`, `userId`, `email`, `role`, and `restaurantId`.
  - Frontend needs the exact auth header format: `Authorization: Bearer <token>`.
  - Decide storage: memory only, `localStorage`, `sessionStorage`, or httpOnly cookie. Current backend is JWT bearer-token based.
  - Define logout behavior, token expiration handling, invalid-token handling, and whether the frontend should auto-logout on `401`.
  - Frontend role values are currently lowercase `manager` and `employee`; backend returns `MANAGER` and `EMPLOYEE`. Add mapping or change one side.

- [x] Expand `GET /auth/me` for frontend bootstrapping.
  - Current response: `userId`, `email`, `role`, `restaurantId`.
  - Frontend dashboards need display name, and manager screens benefit from restaurant name.
  - Add at least `name` and `restaurantName`, or document that the frontend must call additional endpoints after `/auth/me`.

- [ ] Repair or remove the broken Maven wrapper.
  - `backend/api/mvnw` exists, but `backend/api/.mvn/wrapper/maven-wrapper.properties` is missing.
  - Backend handoff should have one reliable command from a clean checkout: either `mvn test` or `./mvnw test`.

## Existing Backend Endpoints To Wire

- [ ] Auth
  - `POST /auth/login`: authenticate and return JWT/user context.
  - `GET /auth/me`: load current user context.

- [ ] Employees
  - `GET /employees`: manager-only employee list.
  - `GET /employees/{id}`: manager-only employee details.
  - `POST /employees`: manager-only employee creation.
  - `PUT /employees/{id}`: manager-only employee update.
  - `DELETE /employees/{id}`: manager-only employee deletion.

- [ ] Job codes and role qualifications
  - `GET /job-codes`: manager-only job code list.
  - `PUT /job-codes`: manager-only upsert.
  - `GET /employee-job-codes`: manager-only employee/job-code assignments.
  - `GET /employee-job-codes/employee/{employeeId}`: manager-only assignments for one employee.
  - `PUT /employee-job-codes/employee/{employeeId}`: manager-only assign job code.
  - `DELETE /employee-job-codes/employee/{employeeId}/job-code/{jobCodeId}`: manager-only remove assignment.

- [ ] Availability
  - `GET /availability/my`: employee-only current-user availability.
  - `PUT /availability/my`: employee-only upsert one availability row.
  - `GET /availability`: manager-only restaurant availability.
  - `GET /availability/employee/{employeeId}`: manager-only employee availability.

- [ ] Time off
  - `POST /time-off-requests`: employee or manager creates request for self.
  - `GET /time-off-requests/my`: employee or manager fetches own requests.
  - `GET /time-off-requests`: manager-only restaurant requests.
  - `PATCH /time-off-requests/{id}/status`: manager-only approve/reject flow.

- [ ] Restaurant settings
  - `GET /restaurant/settings`: manager-only settings.
  - `PUT /restaurant/settings`: manager-only settings update.

- [ ] Staffing rules and forecasts
  - `GET /staffing-rules`: manager-only list.
  - `GET /staffing-rules/{dayOfWeek}`: manager-only list for day.
  - `PUT /staffing-rules`: manager-only upsert.
  - `GET /forecasts/week?startDate=YYYY-MM-DD`: manager-only weekly forecast.
  - `PUT /forecasts/{date}`: manager-only forecast upsert.

- [ ] Role priorities
  - `GET /employee-role-priorities`: manager-only list.
  - `GET /employee-role-priorities/employee/{employeeId}`: manager-only list for employee.
  - `PUT /employee-role-priorities`: manager-only upsert.

- [ ] Shift templates
  - `GET /shift-templates`: manager-only list.
  - `GET /shift-templates/{dayOfWeek}`: manager-only list for day.
  - `PUT /shift-templates`: manager-only upsert.
  - `DELETE /shift-templates/{id}`: manager-only delete.

- [ ] Schedule generation
  - `POST /schedules/generate`: manager-only generation for a week.
  - Request body should be documented as `{ "startDate": "YYYY-MM-DD" }`.
  - Response currently includes schedule id, date range, status, and shifts.

## Missing Backend Endpoints Needed By Current Frontend UX

- [x] Add schedule read endpoints.
  - Needed for manager previous/next week navigation without regenerating.
  - Needed for employee schedule view after publish.
  - Suggested:
    - `GET /schedules?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
    - `GET /schedules/week?startDate=YYYY-MM-DD`
    - `GET /schedules/{id}`
    - `GET /schedules/current`
    - `GET /schedules/upcoming`
  - Manager should be able to read draft and published schedules.
  - Employee should only see published schedules and only the fields appropriate for employee use.

- [x] Add current employee schedule endpoints.
  - Suggested:
    - `GET /schedules/my?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
    - `GET /schedules/my/upcoming`
  - Frontend dashboards need upcoming shifts, next shift, weekly hours, and estimated wages without hardcoded employee names.

- [x] Add shift editing endpoints.
  - Needed because generated schedules can contain `UNASSIGNED` shifts and managers need to correct them before publishing.
  - Suggested:
    - `POST /schedules/{scheduleId}/shifts`
    - `PATCH /schedules/{scheduleId}/shifts/{shiftId}`
    - `DELETE /schedules/{scheduleId}/shifts/{shiftId}`
    - `PATCH /schedules/{scheduleId}/shifts/{shiftId}/assign`
    - `DELETE /schedules/{scheduleId}/shifts/{shiftId}/assignment`
  - Editable fields: `shiftDate`, `startTime`, `endTime`, `jobCodeId`, `employeeId`, `status`, and possibly `source`.
  - Validate same restaurant, employee qualification, availability, approved time off, overlapping shifts, and published-schedule edit rules.

- [x] Add publish workflow endpoints.
  - Current frontend has a publish button and employee notification banner, but backend only has `DRAFT` and `PUBLISHED` enum values with no status-change endpoint.
  - Suggested:
    - `POST /schedules/{id}/publish`
    - `POST /schedules/{id}/unpublish` or `POST /schedules/{id}/reopen`
  - Define whether published schedules are immutable.
  - Prevent accidental regeneration of a published schedule or require an explicit `force` option.

- [ ] Add schedule summaries for dashboards.
  - Manager dashboard currently shows total team hours, total labor cost, labor percentage, manager's own upcoming shifts, and alerts.
  - Employee dashboard currently shows hours this week, estimated wages, next shift, and upcoming shifts.
  - Suggested:
    - `GET /dashboard/manager?weekStart=YYYY-MM-DD`
    - `GET /dashboard/employee?weekStart=YYYY-MM-DD`
  - Alternative: document that the frontend must derive these from schedule, employee, restaurant, and forecast endpoints.

- [ ] Add alerts or structured schedule warnings.
  - Current manager dashboard mocks alerts such as missing role coverage and time-off requests.
  - Schedule generation should return or expose warnings for unassigned shifts and coverage gaps.
  - Useful fields: `type`, `severity`, `scheduleId`, `shiftId`, `date`, `jobCodeId`, `message`, and machine-readable `reason`.

- [ ] Add announcement/message endpoints or remove those frontend views from integration scope.
  - Navbar includes `messages`.
  - Dashboards show announcements.
  - No backend message or announcement API currently exists.

- [ ] Add earnings/labor-cost support or remove those frontend views from integration scope.
  - Navbar includes `earnings`.
  - Dashboards show estimated wages, team labor cost, and labor percentage.
  - Backend currently has no employee pay rate, overtime, tip, or wage model.

- [ ] Add team page data contract.
  - Navbar includes `team`.
  - Existing employee, job-code, availability, role-priority, and time-off APIs can support much of this, but the frontend needs a clear composition contract.

## Data Shape Mapping

- [x] Normalize date and time formats in frontend API adapters.
  - Backend returns `LocalDate` as `YYYY-MM-DD`.
  - Backend returns `LocalTime` as `HH:mm:ss` unless Jackson is configured otherwise.
  - Current frontend mock data uses day names and 12-hour strings such as `Monday`, `10:00 AM`, and `4:00 PM`.
  - Frontend needs a conversion layer for day labels, week labels, and 12-hour display.

- [x] Normalize role/job naming.
  - Backend uses job codes: `jobCodeId`, `jobCodeName`, `jobCodeRank`.
  - Current frontend uses `role` display names and `roleColors`.
  - Frontend should map `jobCodeName` to display role and color, preferably using stable IDs or ranks instead of free-text names.

- [ ] Decide how to handle shift periods.
  - Current frontend divides shifts into "Morning" and "Evening" based on exact hardcoded starts: `10:00 AM` and `4:00 PM`.
  - Backend supports arbitrary `startTime` and `endTime`.
  - Add a frontend rule for deriving dayparts, or expose `daypart`/template name from backend.

- [x] Decide how to represent unassigned shifts.
  - Backend schedule shifts can have `employeeId = null`, `employeeName = null`, and `status = UNASSIGNED`.
  - Frontend tables currently assume every shift has an employee name.
  - UI needs "Unassigned" display and manager assignment controls.

- [ ] Decide how to compute estimated earnings.
  - Current mock shifts include `estimatedEarnings`.
  - Backend `ShiftResponse` does not include pay rate, estimated earnings, or labor cost.
  - Either add backend pay-rate/labor fields or remove earnings from integrated UI.

- [ ] Add display names where frontend would otherwise join repeatedly.
  - `ShiftResponse` already includes `jobCodeName`, `shiftTemplateName`, and `employeeName`.
  - Time-off responses currently include `userEmail` but not employee display name.
  - Auth responses currently include email but not display name.
  - Employee-job-code and role-priority responses already include employee and job-code names.

- [ ] Document enum values.
  - Auth roles: `MANAGER`, `EMPLOYEE`.
  - Time-off statuses: document values from `TimeOffStatus`.
  - Schedule statuses: `DRAFT`, `PUBLISHED`.
  - Shift statuses: `ASSIGNED`, `UNASSIGNED`.
  - Shift sources: generated/manual values from `ShiftSource`.
  - Day values use Java `DayOfWeek`: `MONDAY` through `SUNDAY`.

## Schedule Generation Decisions

- [x] Decide what `POST /schedules/generate` does when a schedule already exists.
  - Current generation finds or creates the week schedule, sets status to `DRAFT`, deletes generated shifts only, and preserves manual shifts.
  - Confirm whether this is desired after managers can edit generated shifts.
  - Define behavior when the existing schedule is `PUBLISHED`.

- [ ] Add generation diagnostics.
  - The generator can leave shifts unassigned, but does not explain why.
  - Frontend should receive structured reasons such as no qualified employees, unavailable, approved time off, overlapping shift, or rule/template mismatch.

- [ ] Use or remove `minEmployees` from templates.
  - `ShiftTemplateResponse` exposes `minEmployees` and `maxEmployees`.
  - Generation currently uses `maxEmployees` to allocate requirements.
  - Define whether `minEmployees` matters for generation, validation, or UI only.

- [ ] Define required setup before generation.
  - A useful schedule requires employees, job codes, employee-job-code assignments, availability, staffing rules, forecasts, role priorities, restaurant average price per head, and active shift templates.
  - Frontend should be able to detect missing setup before calling generate.

- [ ] Add setup health/check endpoint.
  - Suggested: `GET /schedules/generation-readiness?startDate=YYYY-MM-DD`.
  - Return missing forecasts, missing templates, missing staffing rules, employees without availability, employees without job codes, and unsupported constraints.

## CRUD And Batch Ergonomics

- [ ] Add delete or deactivate behavior where upsert-only APIs are not enough.
  - `staffing-rules` has upsert but no delete.
  - `employee-role-priorities` has upsert but no delete.
  - `forecasts` has upsert but no delete/reset.
  - `job-codes` has upsert but no delete/deactivate.

- [ ] Add batch endpoints for grid editing.
  - Shift templates, staffing rules, forecasts, availability, employee job codes, and role priorities are likely edited in grids.
  - One-row-at-a-time APIs can work, but batch endpoints reduce slow UI saves and partial-update bugs.

- [ ] Define idempotent upsert semantics.
  - Current upserts sometimes include optional `id`, and sometimes use path keys.
  - Document whether `id` is required for updates, whether natural keys are used, and how duplicate unique constraints return errors.

- [ ] Define stable sorting.
  - Employees: likely by enabled status then name.
  - Job codes: by rank.
  - Staffing rules: day of week then job-code rank.
  - Shift templates: day of week, start time, job-code rank.
  - Shifts: date, start time, job-code rank, employee name, id.
  - Time-off requests: status then start date or created date.

## Security And Error Handling

- [ ] Ensure every endpoint enforces restaurant scoping.
  - Frontend should never pass restaurant IDs except through authenticated context unless explicitly designed.
  - Backend should reject cross-restaurant employee, job-code, shift, schedule, and template IDs.

- [ ] Make `401` and `403` responses consistent.
  - Current `GlobalExceptionHandler` handles validation, bad request, and not found only.
  - Frontend needs stable handling for unauthenticated and forbidden responses.

- [ ] Standardize error response shape.
  - Current validation response shape: `{ "error": "Validation failed", "fields": { ... } }`.
  - Other handled errors use `{ "error": "..." }`.
  - Document this as the contract or add a standard envelope with `code`, `message`, and `fields`.

- [ ] Add conflict responses for schedule edits.
  - Use `409 Conflict` for overlapping shifts, published-schedule edit attempts, stale schedule versions, or assignment conflicts.
  - Return machine-readable conflict details so the frontend can show targeted messages.

- [ ] Decide concurrency/stale-update strategy.
  - Schedule and shift editing is multi-user by nature.
  - Consider `updatedAt`, optimistic locking versions, or last-write-wins with clear frontend refresh behavior.

## Seed Data Needed For Frontend Development

- [x] Align demo credentials with frontend expectations.
  - Frontend currently uses `admin/admin` and `user/user`.
  - Backend seed users are `manager1@demo.com`, `employee1@demo.com`, and `manager2@test.com`.
  - Document the real seeded password or update seeds/frontend fixtures to match.

- [ ] Add complete demo scheduling data.
  - Restaurant settings with `averagePricePerHead`.
  - Manager and several employees with realistic names.
  - Job codes matching frontend roles: Manager, Shift Lead, Cook, Host, Server, Bartender.
  - Employee job-code assignments, including employees with multiple roles.
  - Role priorities.
  - Availability for each employee across the week.
  - Approved and pending time-off requests.
  - Staffing rules for weekday/weekend coverage.
  - Shift templates for AM/PM service periods.
  - Forecasts for at least current week and next week.
  - One generated draft schedule.
  - One published schedule for employee dashboard testing.

- [ ] Add frontend fixture docs.
  - Include known manager login, known employee login, expected schedule week, and what data should be visible for each role.

## Frontend Implementation Checklist

- [x] Add an API client module.
  - Centralize base URL, JSON headers, `Authorization` header injection, token refresh/logout handling, and error parsing.

- [x] Replace hardcoded login.
  - Call `POST /auth/login`.
  - Store token according to the agreed session contract.
  - Use backend role to route to manager or employee dashboard.

- [x] Bootstrap app state from backend.
  - On reload, call `GET /auth/me` if a token exists.
  - Remove reliance on `role === null` as the only auth state.
  - Add loading and expired-session states.

- [x] Replace `scheduleData` reads.
  - Schedule page should fetch schedule by selected week.
  - Manager dashboard should fetch schedule summary or derive summary from schedule data.
  - Employee dashboard should fetch current user's published shifts.

- [x] Convert backend schedule data for existing components.
  - Convert `shiftDate` to day labels.
  - Convert `startTime`/`endTime` to 12-hour display.
  - Map `jobCodeName` to frontend role labels and colors.
  - Handle `employeeName = null` as unassigned.

- [x] Wire manager schedule generation.
  - Selected week should become `startDate`.
  - Forecast input should call `PUT /forecasts/{date}` or be removed until a full forecast editor exists.
  - Generate button should call `POST /schedules/generate` and then render returned schedule.

- [x] Wire publish button.
  - Replace local `setIsPublished(true)` with backend publish endpoint after it exists.
  - Employee notification banner should come from published schedule state, not manager-local React state.

- [x] Add loading, empty, and error states for each integrated view.
  - No schedule exists.
  - Schedule is draft.
  - Schedule is published.
  - Generation in progress.
  - Generation completed with unassigned shifts.
  - Network failure.
  - Unauthorized/forbidden.

- [x] Add frontend tests around API integration behavior.
  - Login success and failure.
  - Token bootstrap.
  - Manager can generate and publish.
  - Employee cannot see draft schedules.
  - Unassigned shifts render without crashing.

## API Contract Documentation

- [ ] Add OpenAPI or equivalent maintained docs.
  - Minimum contract for every endpoint: method, path, auth role, request body, response body, errors, and enum values.
  - Include example JSON for login, `/auth/me`, schedule generation, schedule read, shift edit, publish, employee schedule, forecasts, staffing rules, templates, availability, and time off.

- [ ] Document local integration smoke test with curl or HTTP file.
  - Login as manager.
  - Fetch current user.
  - Fetch employees.
  - Fetch job codes.
  - Fetch employee job-code assignments.
  - Fetch availability.
  - Fetch staffing rules.
  - Fetch shift templates.
  - Fetch forecasts for a week.
  - Generate a draft schedule.
  - Fetch that schedule without regenerating it.
  - Assign or edit one shift.
  - Publish the schedule.
  - Login as employee.
  - Fetch published employee schedule.

## Verification Before Handoff

- [x] Backend tests pass from a clean checkout.
  - Preferred command after wrapper repair: `cd backend/api && ./mvnw test`.
  - Acceptable command if wrapper is intentionally removed: `cd backend/api && mvn test`.

- [x] Frontend checks pass.
  - `cd frontend && npm install`
  - `cd frontend && npm run lint`
  - `cd frontend && npm run build`
  - Add or document test command if Vitest should be run in CI.

- [x] Local database setup works from scratch.
  - `backend/docker-compose.yml` starts PostgreSQL.
  - Flyway migrations apply cleanly to an empty database.
  - Demo seed data loads without manual SQL changes.

- [ ] Browser integration smoke test passes.
  - Start backend on `http://localhost:8080`.
  - Start frontend on `http://localhost:5173`.
  - Manager can log in, load dashboard, load team/schedule data, generate a week schedule, edit an unassigned shift, and publish.
  - Employee can log in, see only published schedule data, see upcoming shifts, and cannot access manager-only API responses.

## Suggested Backend Implementation Order

1. Add CORS, document API base URL, repair Maven wrapper, and expand `/auth/me`.
2. Add schedule read endpoints for manager and employee views.
3. Add publish/reopen workflow and protect published schedules from accidental regeneration.
4. Add shift create/update/delete/assignment endpoints.
5. Add generation readiness and structured generation warning responses.
6. Add complete frontend seed data and a smoke-test script.
7. Decide whether earnings, messages, announcements, and labor percentage are in scope for the first integrated frontend release.
