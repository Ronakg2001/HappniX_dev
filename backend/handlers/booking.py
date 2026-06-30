"""
handlers/booking.py — Ticket booking endpoints for HappniX.

Actions:
  - BookTicket       — Create a new order and tickets for the authenticated user
  - GetMyBookings    — Fetch all bookings for the authenticated user (GET)
  - CancelTicket     — Cancel a single ticket
  - GetEventTiers    — Fetch ticket tiers for an event (for the booking modal)
"""

from utils.Response import success_response, error_response
from utils import utilities as util
from integration import cognito_auth as cognito
from integration import rds
from services import booking_services, event_services


def book_ticket(**kwargs):
    """
    Create a new booking order with tickets.
    
    Expects:
        eventID  — UUID of the event to book
        tierID   — UUID of the ticket tier
        quantity — number of tickets (default 1)
    """
    try:
        user_id = kwargs.get("user_id")
        username = kwargs.get("username")
        event_id = kwargs.get("eventID")
        tier_id = kwargs.get("tierID")
        quantity = int(kwargs.get("quantity", 1))

        if not event_id:
            return error_response("Missing eventID.", 400)
        if not tier_id:
            return error_response("Missing tierID.", 400)
        if quantity != 1:
            return error_response("You can only book 1 ticket per person.", 400)

        # Enforce 1 ticket per user per event rule
        if booking_services.has_active_ticket(user_id, event_id):
            return error_response(
                "You already hold an active pass for this event. Please cancel your existing pass from My Bookings before booking again.",
                400
            )

        # Validate event exists and is published
        event_result = rds.get_record("events", eventID=event_id)
        if not event_result.get("success"):
            return error_response("Event not found.", 404)

        event_data = event_result.get("data", {})
        if event_data.get("status") != "Published":
            return error_response("Event is not available for booking.", 400)

        # Validate tier exists, belongs to this event, and has capacity
        tier_result = rds.get_record("event_ticket_tiers", tierID=tier_id)
        if not tier_result.get("success"):
            return error_response("Ticket tier not found.", 404)

        tier_data = tier_result.get("data", {})
        if tier_data.get("eventID") != event_id:
            return error_response("Tier does not belong to this event.", 400)

        if str(tier_data.get("isActive", "true")).lower() == "false":
            return error_response("This ticket tier is no longer available.", 400)

        capacity = tier_data.get("capacity")
        tickets_sold = int(tier_data.get("ticketsSold", 0))
        if capacity is not None and tickets_sold + quantity > int(capacity):
            remaining = max(int(capacity) - tickets_sold, 0)
            return error_response(
                f"Not enough tickets available. Only {remaining} left.", 400
            )

        # Build ticket list for booking_services.create_order
        tickets = []
        for _ in range(quantity):
            tickets.append({
                "tierID": tier_id,
                "attendeeUserID": user_id,
                "attendeeName": username,
            })

        result = booking_services.create_order(
            buyer_user_id=user_id,
            event_id=event_id,
            tickets=tickets,
        )

        if not result.get("success"):
            return error_response(result.get("error", "Booking failed."), 500)

        util.log("info", "booking.book_ticket",
                 f"Booking created", user=username,
                 order_id=result.get("orderID"))

        return success_response({
            "success": True,
            "message": "Tickets booked successfully!",
            "orderID": result.get("orderID"),
            "orderNumber": result.get("orderNumber"),
            "totalAmount": result.get("totalAmount"),
            "tickets": result.get("tickets", []),
        })

    except Exception as exc:
        util.log("error", "booking.book_ticket", f"Error: {str(exc)}")
        return error_response(str(exc), 500)


def get_my_bookings(**kwargs):
    """Fetch all bookings for the authenticated user."""
    try:
        user_id = kwargs.get("user_id")
        username = kwargs.get("username")

        if not user_id:
            return success_response({"success": True, "bookings": []})

        result = booking_services.get_user_bookings(user_id)

        if not result.get("success"):
            return error_response(result.get("error", "Failed to fetch bookings."), 500)

        return success_response({
            "success": True,
            "bookings": result.get("data", []),
        })

    except Exception as exc:
        util.log("error", "booking.get_my_bookings", f"Error: {str(exc)}")
        return error_response(str(exc), 500)


def cancel_ticket(**kwargs):
    """Cancel a single ticket. Validates ticket ownership first."""
    try:
        user_id = kwargs.get("user_id")
        ticket_id = kwargs.get("ticketID")

        if not ticket_id:
            return error_response("Missing ticketID.", 400)

        # Verify ownership via the order's buyerUserID
        ticket_result = rds.get_record("event_tickets", ticketID=ticket_id)
        if not ticket_result.get("success"):
            return error_response("Ticket not found.", 404)

        ticket_data = ticket_result.get("data", {})

        # Check if the ticket belongs to this user (either as attendee or buyer)
        if ticket_data.get("attendeeUserID") != user_id:
            order_result = rds.get_record("event_orders", orderID=ticket_data.get("orderID"))
            if not order_result.get("success") or order_result["data"].get("buyerUserID") != user_id:
                return error_response("Unauthorized to cancel this ticket.", 403)

        if ticket_data.get("status") == "Cancelled":
            return error_response("Ticket is already cancelled.", 400)

        result = booking_services.cancel_ticket(ticket_id)

        if not result.get("success"):
            return error_response(result.get("error", "Cancellation failed."), 500)

        util.log("info", "booking.cancel_ticket",
                 f"Ticket cancelled", ticket_id=ticket_id)

        return success_response({
            "success": True,
            "message": "Ticket cancelled successfully.",
        })

    except Exception as exc:
        util.log("error", "booking.cancel_ticket", f"Error: {str(exc)}")
        return error_response(str(exc), 500)


def get_event_tiers(**kwargs):
    """Fetch ticket tiers for an event (used by the booking modal)."""
    try:
        event_id = kwargs.get("eventID")
        if not event_id:
            return error_response("Missing eventID.", 400)

        result = event_services.get_event_with_tiers(event_id)

        if not result.get("success"):
            return error_response(result.get("error", "Event not found."), 404)

        return success_response({
            "success": True,
            "event": result.get("event"),
            "tiers": result.get("tiers", []),
        })

    except Exception as exc:
        util.log("error", "booking.get_event_tiers", f"Error: {str(exc)}")
        return error_response(str(exc), 500)


ACTION_HANDLERS = {
    "BookTicket": book_ticket,
    "CancelTicket": cancel_ticket,
    "GetEventTiers": get_event_tiers,
}


def lambda_handler(event, context):
    try:
        http_method = event.get("httpMethod", "")

        # Browsers send OPTIONS requests during preflight
        if http_method == "OPTIONS":
            return success_response({"success": True, "message": "CORS preflight successful"})

        headers = event.get("headers", {})
        auth_header = headers.get("Authorization") or headers.get("authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return error_response("Missing or invalid Authorization header.", 401)

        access_token = auth_header.split(" ")[1]
        cognito_user = cognito.get_user(access_token)
        if not cognito_user:
            return error_response("Unauthorized. User may be deleted.", 401)

        username = cognito_user.get("Username")
        if not username:
            return error_response("Unauthorized. Invalid Cognito user.", 401)

        # Extract user_id from Cognito attributes
        user_attrs = cognito_user.get("UserAttributes", [])
        user_id = None
        for attr in user_attrs:
            if attr.get("Name") == "custom:userId":
                user_id = attr.get("Value")
                break

        if not user_id:
            user_id = username

        # GET → GetMyBookings
        if http_method == "GET":
            path = event.get("path", "")
            qs = event.get("queryStringParameters") or {}

            # GET /api/booking?eventID=xxx → get tiers for booking modal
            if qs.get("eventID"):
                return get_event_tiers(
                    user_id=user_id, username=username,
                    eventID=qs.get("eventID"),
                )

            # GET /api/booking → get user's bookings
            return get_my_bookings(user_id=user_id, username=username)

        # POST → route by actionItem
        body = util.parse_body(event)
        if body == "400":
            return error_response("Malformed JSON in request body.", 400)

        action_item = body.get("actionItem")
        if not action_item:
            return error_response("Missing 'actionItem' in request body.", 400)

        handler = ACTION_HANDLERS.get(action_item)
        if not handler:
            return error_response(f"Action '{action_item}' not implemented.", 501)

        payload = {k: v for k, v in body.items() if k != "actionItem"}
        payload["username"] = username
        payload["user_id"] = user_id

        return handler(**payload)

    except Exception as exc:
        util.log("error", "booking.lambda_handler", f"Unhandled exception: {exc}")
        return error_response("Internal server error.", 500)
