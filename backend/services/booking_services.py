"""
services/booking_services.py — Group booking, order creation, and ticket management.

The booking flow:
1. User selects tickets for themselves and friends → creates an Order
2. Payment is processed → Order status moves to 'Paid'
3. Individual tickets are generated for each attendee
4. Tier inventory (ticketsSold) is atomically incremented
"""
import uuid
import hashlib
from utils import utilities as util
from integration import rds, dynamo_db


def _generate_order_number() -> str:
    """Generate a human-readable order number like 'HX-ORD-7K9M2'."""
    raw = uuid.uuid4().hex[:5].upper()
    return f"HX-ORD-{raw}"


def _generate_claim_token() -> str:
    """Generate a unique claim token for non-platform friend tickets."""
    return hashlib.sha256(uuid.uuid4().bytes).hexdigest()[:32]


def has_active_ticket(user_id: str, event_id: str) -> bool:
    """Check if the user already holds an active ticket (Confirmed/Pending) for this event."""
    conn = rds.get_connection()
    if not conn:
        return False
    try:
        with conn.cursor() as cur:
            cur.execute('''
                SELECT 1 FROM event_tickets
                WHERE "attendeeUserID" = %s
                  AND "eventID" = %s
                  AND ("status" IS NULL OR "status" IN ('Confirmed', 'Pending'))
                LIMIT 1;
            ''', (user_id, event_id))
            return cur.fetchone() is not None
    except Exception as exc:
        util.log("error", "booking_services.has_active_ticket", f"Check failed: {exc}")
        return False
    finally:
        conn.close()


def create_order(buyer_user_id: str, event_id: str, tickets: list) -> dict:
    """
    Create a group booking order:
    1. INSERT into `event_orders`
    2. INSERT each ticket into `event_tickets`
    3. UPDATE `event_ticket_tiers.ticketsSold` for each tier
    4. UPDATE DynamoDB EVENT_CARD cached ticketsSold

    tickets: [
        {"tierID": "...", "attendeeName": "John", "attendeeEmail": "john@x.com", "attendeeUserID": null},
        {"tierID": "...", "attendeeUserID": "uuid-of-friend-on-platform"},
    ]
    """
    order_id = str(uuid.uuid4())
    order_number = _generate_order_number()

    # ── Calculate totals ──
    subtotal = 0.0
    for ticket in tickets:
        tier_result = rds.get_record("event_ticket_tiers", tierID=ticket.get("tierID"))
        if tier_result.get("success"):
            price = float(tier_result["data"].get("price", 0))
            ticket["_price"] = price
            subtotal += price
        else:
            return {"success": False, "error": f"Tier {ticket.get('tierID')} not found."}

    platform_fee = round(subtotal * 0.05, 2)  # 5% platform fee (configurable)
    total_amount = round(subtotal + platform_fee, 2)

    # ── Step 1: Insert order ──
    order_result = rds.insert_record("event_orders",
        orderID=order_id,
        orderNumber=order_number,
        eventID=event_id,
        buyerUserID=buyer_user_id,
        subtotal=subtotal,
        platformFee=platform_fee,
        totalAmount=total_amount,
        paymentStatus="Pending",
    )

    if not order_result.get("success"):
        util.log("error", "booking_services.create_order",
                 f"Order insert failed: {order_result.get('error')}")
        return {"success": False, "error": "Failed to create order."}

    # ── Step 2: Insert individual tickets ──
    created_tickets = []
    for ticket in tickets:
        ticket_id = str(uuid.uuid4())
        attendee_user_id = ticket.get("attendeeUserID")
        claim_token = None

        # If no attendeeUserID, generate a claim token for the friend
        if not attendee_user_id and ticket.get("attendeeEmail"):
            claim_token = _generate_claim_token()

        rds.insert_record("event_tickets",
            ticketID=ticket_id,
            orderID=order_id,
            eventID=event_id,
            tierID=ticket.get("tierID"),
            attendeeUserID=attendee_user_id,
            attendeeName=ticket.get("attendeeName"),
            attendeeEmail=ticket.get("attendeeEmail"),
            claimToken=claim_token,
            status="Pending",
        )

        created_tickets.append({
            "ticketID": ticket_id,
            "tierID": ticket.get("tierID"),
            "attendeeName": ticket.get("attendeeName"),
            "claimToken": claim_token,
        })

    # ── Step 3: Increment tier ticketsSold ──
    # Group tickets by tier to do one update per tier
    tier_counts = {}
    for ticket in tickets:
        tier_id = ticket.get("tierID")
        tier_counts[tier_id] = tier_counts.get(tier_id, 0) + 1

    conn = rds.get_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                for tier_id, count in tier_counts.items():
                    cur.execute(
                        'UPDATE event_ticket_tiers SET "ticketsSold" = "ticketsSold" + %s, '
                        '"updatedAt" = CURRENT_TIMESTAMP WHERE "tierID" = %s;',
                        (count, tier_id)
                    )
                conn.commit()
        except Exception as exc:
            conn.rollback()
            util.log("error", "booking_services.create_order",
                     f"Tier update failed: {exc}")
        finally:
            conn.close()

    # ── Step 4: Update DynamoDB EVENT_CARD cached ticketsSold ──
    _sync_event_card_tickets_sold(event_id)

    util.log("info", "booking_services.create_order",
             f"Order created", order_id=order_id, order_number=order_number,
             ticket_count=len(created_tickets))

    return {
        "success": True,
        "orderID": order_id,
        "orderNumber": order_number,
        "totalAmount": total_amount,
        "tickets": created_tickets,
    }


def cancel_ticket(ticket_id: str) -> dict:
    """
    Cancel a single ticket:
    1. UPDATE ticket status to 'Cancelled'
    2. Decrement the tier's ticketsSold
    3. Check waitlist and notify if slot freed
    """
    ticket_result = rds.get_record("event_tickets", ticketID=ticket_id)
    if not ticket_result.get("success"):
        return {"success": False, "error": "Ticket not found."}

    ticket = ticket_result["data"]
    tier_id = ticket.get("tierID")
    event_id = ticket.get("eventID")

    # Update ticket status
    rds.update_record("event_tickets", "ticketID", ticket_id, {
        "status": "Cancelled",
        "updatedAt": util.now_iso(),
    })

    # Decrement tier count
    conn = rds.get_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute(
                    'UPDATE event_ticket_tiers SET "ticketsSold" = GREATEST("ticketsSold" - 1, 0), '
                    '"updatedAt" = CURRENT_TIMESTAMP WHERE "tierID" = %s;',
                    (tier_id,)
                )
                conn.commit()
        except Exception as exc:
            conn.rollback()
            util.log("error", "booking_services.cancel_ticket", f"Tier decrement failed: {exc}")
        finally:
            conn.close()

    # Sync DynamoDB
    _sync_event_card_tickets_sold(event_id)

    # TODO: Check waitlist for this event/tier and send notification

    util.log("info", "booking_services.cancel_ticket",
             f"Ticket cancelled", ticket_id=ticket_id)
    return {"success": True}


def get_user_bookings(user_id: str) -> dict:
    """
    Fetch all tickets for a user, JOINed with event and tier details.
    Returns data shaped for the frontend My Bookings page.
    """
    conn = rds.get_connection()
    if not conn:
        return {"success": False, "error": "Database connection failed."}

    try:
        from psycopg2.extras import RealDictCursor
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute('''
                SELECT
                    t."ticketID",
                    t."orderID",
                    t."eventID",
                    t."tierID",
                    t."status"          AS ticket_status,
                    t."ticketQrPayload",
                    t."checkedInAt",
                    t."createdAt"       AS ticket_created_at,
                    o."orderNumber",
                    o."totalAmount",
                    o."paymentStatus",
                    e."title"           AS event_title,
                    e."startAt"         AS event_start_at,
                    e."endAt"           AS event_end_at,
                    e."locationName"    AS event_venue,
                    e."coverImageUrl"   AS event_cover,
                    e."status"          AS event_status,
                    e."isOnline"        AS event_is_online,
                    tt."name"           AS tier_name,
                    tt."price"          AS tier_price
                FROM event_tickets t
                JOIN event_orders o    ON t."orderID"  = o."orderID"
                JOIN events e          ON t."eventID"  = e."eventID"
                JOIN event_ticket_tiers tt ON t."tierID" = tt."tierID"
                WHERE t."attendeeUserID" = %s
                ORDER BY t."createdAt" DESC;
            ''', (user_id,))
            rows = cur.fetchall()

        bookings = []
        for row in rows:
            row = util.format_rds_row(row)

            # Format date/time for display
            start_at = row.get("event_start_at", "")
            display_date = ""
            display_time = ""
            if start_at:
                try:
                    from datetime import datetime
                    dt = datetime.fromisoformat(str(start_at))
                    display_date = dt.strftime("%b %d")
                    display_time = dt.strftime("%I:%M %p")
                except Exception:
                    display_date = str(start_at)[:10]
                    display_time = ""

            bookings.append({
                "id": row.get("ticketID"),
                "orderID": row.get("orderID"),
                "orderNumber": row.get("orderNumber"),
                "eventID": row.get("eventID"),
                "eventTitle": row.get("event_title", "Untitled Event"),
                "tierName": row.get("tier_name", "General"),
                "tierID": row.get("tierID"),
                "date": display_date,
                "time": display_time,
                "seat": row.get("tier_name", "General Entry"),
                "venue": row.get("event_venue", "Venue TBD"),
                "status": row.get("ticket_status", "Pending"),
                "totalPaid": row.get("totalAmount"),
                "tierPrice": row.get("tier_price"),
                "paymentStatus": row.get("paymentStatus"),
                "qrPayload": row.get("ticketQrPayload"),
                "coverImageUrl": row.get("event_cover"),
                "eventStartAt": start_at,
                "eventEndAt": row.get("event_end_at"),
                "eventStatus": row.get("event_status"),
                "checkedInAt": row.get("checkedInAt"),
                "createdAt": row.get("ticket_created_at"),
            })

        return {"success": True, "data": bookings}

    except Exception as exc:
        util.log("error", "booking_services.get_user_bookings", f"Failed: {exc}")
        return {"success": False, "error": str(exc)}
    finally:
        conn.close()


def _sync_event_card_tickets_sold(event_id: str):
    """
    Re-compute the total ticketsSold from all tiers and update the DynamoDB EVENT_CARD.
    """
    conn = rds.get_connection()
    if not conn:
        return

    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT COALESCE(SUM("ticketsSold"), 0) as total FROM event_ticket_tiers WHERE "eventID" = %s;',
                (event_id,)
            )
            row = cur.fetchone()
            total_sold = int(row[0]) if row else 0

        # Update the DynamoDB EVENT_CARD
        from boto3.dynamodb.conditions import Key
        table = dynamo_db._get_table("events")
        if table:
            table.update_item(
                Key={"PK": f"EVENT#{event_id}", "SK": "CARD"},
                UpdateExpression="SET ticketsSold = :ts, updatedAt = :ua",
                ExpressionAttributeValues={
                    ":ts": total_sold,
                    ":ua": util.now_iso(),
                },
            )
    except Exception as exc:
        util.log("warning", "booking_services._sync_event_card_tickets_sold",
                 f"Sync failed (non-fatal): {exc}", event_id=event_id)
    finally:
        conn.close()
