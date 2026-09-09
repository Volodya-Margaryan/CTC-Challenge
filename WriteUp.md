# Write-up

## 1. What did you build for Part B, and why that?

Visits - logging what Brennen spent at a restaurant. The `visits` table was
already in the schema, but nothing used it: no routes, no UI, no way to
actually record a dollar spent anywhere. For an app called "Feeding Brennen"
that's supposed to track his spending, that felt like the obvious gap to fix.

## 2. What did you decide, and what did you rule out?

Visits are created and listed through `/api/restaurants/:id/visits`, so the
restaurant id comes from the URL, not the body. Reading or deleting a single
visit is flat, `/api/visits/:id`, since it doesn't need its parent in the
path. I left out editing a visit - only add/remove - so if you log something
wrong you delete it and re-add it instead of patching a field. Not sure that's
the right call for a real app, but it kept things small here.

## 3. Where did you cut corners?

No pagination on the visits list, and no spend total across *all*
restaurants, just per restaurant. With another day I'd add that plus a way to
edit a visit instead of only add/remove.

---

## Part B: routes

| Method and path                    | What it does                             | Success                                        | Errors                                       |
| ----------------------------------- | ----------------------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| `GET /api/restaurants/:id/visits`   | List a restaurant's visits + total spent | `200` + `{restaurantId, totalSpent, visits[]}`  | `404` if restaurant doesn't exist            |
| `POST /api/restaurants/:id/visits`  | Log a visit against that restaurant      | `201` + created visit                            | `404` if restaurant doesn't exist, `400` on invalid body |
| `GET /api/visits/:id`               | Read one visit                            | `200` + visit                                    | `404` if missing                              |
| `DELETE /api/visits/:id`            | Delete a visit                            | `204`, no body                                   | `404` if missing                              |

**`POST /api/restaurants/:id/visits`**

```jsonc
// request
{ "date": "2026-06-15", "amountSpent": 22.50, "notes": "Lunch special" }

// 201 response
{
  "id": 4,
  "restaurantId": 2,
  "date": "2026-06-15",
  "amountSpent": 22.5,
  "notes": "Lunch special",
  "createdAt": "2026-09-09T19:45:07.532Z"
}
```

`date` is required, `YYYY-MM-DD`, must be a real calendar date. `amountSpent`
is optional but must be `>= 0` if present. `notes` is optional.

## Schema changes

None - `visits` was already in `001_create_tables.sql`.

## How I verified this

**Part A**, the contract table in CHALLENGE.md:

```bash
curl -i http://localhost:3000/api/restaurants                              # 200 + array
curl -i http://localhost:3000/api/restaurants/1                            # 200 + one restaurant
curl -i http://localhost:3000/api/restaurants/99999                        # 404
curl -i http://localhost:3000/api/restaurants/abc                          # 404, not 500
curl -i http://localhost:3000/api/restaurants/1.5                          # 404

curl -i -X POST http://localhost:3000/api/restaurants \
  -H 'Content-Type: application/json' \
  -d '{"name":"Valid Spot","cuisine":"Test","address":"2 Test St","rating":4.5}'  # 201

curl -i -X POST http://localhost:3000/api/restaurants \
  -H 'Content-Type: application/json' -d '{"name":"Out Of Range","rating":6}'     # 400

curl -i -X POST http://localhost:3000/api/restaurants \
  -H 'Content-Type: application/json' -d '{"rating":3}'                          # 400, missing name

curl -i -X PUT http://localhost:3000/api/restaurants/6 \
  -H 'Content-Type: application/json' \
  -d '{"name":"Valid Spot Updated","cuisine":"Test2","address":"3 Test St","rating":5}'  # 200

curl -i -X PUT http://localhost:3000/api/restaurants/99999 \
  -H 'Content-Type: application/json' -d '{"name":"X","rating":3}'               # 404

curl -i -X DELETE http://localhost:3000/api/restaurants/6                        # 204
curl -i -X DELETE http://localhost:3000/api/restaurants/6                        # 404 (already gone)
```

**Part B**, the same shape for visits:

```bash
curl -i http://localhost:3000/api/restaurants/2/visits                     # 200 + summary
curl -i http://localhost:3000/api/restaurants/99999/visits                 # 404

curl -i -X POST http://localhost:3000/api/restaurants/2/visits \
  -H 'Content-Type: application/json' \
  -d '{"date":"2026-05-01","amountSpent":50.25,"notes":"Test visit"}'      # 201

curl -i -X POST http://localhost:3000/api/restaurants/2/visits \
  -H 'Content-Type: application/json' -d '{"amountSpent":10}'             # 400, missing date

curl -i -X POST http://localhost:3000/api/restaurants/2/visits \
  -H 'Content-Type: application/json' -d '{"date":"2026-02-30"}'          # 400, invalid date

curl -i -X DELETE http://localhost:3000/api/visits/4                       # 204
curl -i -X DELETE http://localhost:3000/api/visits/4                       # 404 (already gone)
```

Also clicked through the UI: opened a restaurant, logged a visit through the
form, watched the total update, removed it, watched the total drop back down.
`npm run lint`, `npx tsc --noEmit`, and `npm run build` all clean.

## Known issues / what I'd do next

- No editing a visit once logged, only add/remove.
- No pagination on the visits list.
- No spend total across all restaurants, only per-restaurant.
