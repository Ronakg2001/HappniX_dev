# Frontend To Backend Flow

This file maps pages to scripts, scripts to API calls, and API calls to Python handlers.

## Global Pattern

1. Django view renders template.
2. Template loads one or more JS files.
3. JS gathers form input or UI state.
4. JS sends `fetch(...)` requests to `/api/...`.
5. Django function view handles the request.
6. JSON response updates the UI or redirects.
7. Messaging additionally opens `ws/messages/` and reacts to socket events.

## Quick Reference Links

- Main app shell template: [home_page.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/home_page.html:1472)
- Main app script: [home_page.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/home_page.js:11)
- Messaging script: [messages.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/messages.js:97)
- App URL map: [HAPPNIX/urls.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/urls.py:4)
- WebSocket route: [routing.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/routing.py:5)
- WebSocket consumer: [consumers.py](/e:/project/Party_connect_hub_redefine/HAPPNIX/consumers.py:29)

## Page To Script Map

| Template | Page route | Scripts loaded |
| --- | --- | --- |
| [index.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/index.html:57) | `/` | [index.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/index.js:1) |
| [signup_signin.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/signup_signin.html:117) | `/signin/` | [signup_signin.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/signup_signin.js:1) |
| [signup_details.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/signup_details.html:56) | `/signup/details/` | [signup_details.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/signup_details.js:1) |
| [signup_profile_optional.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/signup_profile_optional.html:32) | `/signup/profile/` | [signup_profile_optional.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/signup_profile_optional.js:1) |
| [forgot_password.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/forgot_password.html:35) | `/signin/forgot_password/` | [forgot_password.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/forgot_password.js:1) |
| [home_page.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/home_page.html:1472) | `/home/` | [qr_generator.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/qr_generator.js:1), `home_page_tailwind.js`, `mobile_navigation_tailwind.js`, [mobile_navigation.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/mobile_navigation.js:1), [frontend_config.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/frontend_config.js:1), [home_page.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/home_page.js:11), [messages.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/messages.js:97) |
| [ticket_view.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/ticket_view.html:69) | `/ticket/<id>/` | [qr_generator.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/qr_generator.js:1), [ticket_view.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/ticket_view.js:1) |
| [custom_location.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/custom_location.html:61) | `/location/custom/` | [custom_location.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/custom_location.js:88) |
| [create_post_event.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/create_post_event.html:1215) | supporting page | [qr_generator.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/qr_generator.js:1), [create_post_event.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/create_post_event.js:563) |
| [guest_onboarding.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/guest_onboarding.html:199) | `/guest-invite/<token>/` | inline JS in template |
| [guest_ticket.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/guest_ticket.html:212) | `/guest-ticket/<token>/` | inline JS in template |

## Auth And Signup Flow

- [signup_signin.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/signup_signin.js:1) calls:
  - `/api/auth/mobile/send-otp` -> `signin_signup.send_mobile_otp`
  - `/api/auth/mobile/verify-otp` -> `signin_signup.verify_mobile_otp`
  - `/api/auth/mobile/resend-otp` -> `signin_signup.resend_mobile_otp`
  - `/api/auth/username/login` -> `signin_signup.login_with_password`
- [forgot_password.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/forgot_password.js:1) calls:
  - `/api/auth/password/forgot` -> `signin_signup.forgot_password_request`
- [signup_details.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/signup_details.js:1) calls:
  - `/api/signup/details` -> `signin_signup.register_user_details`
- [signup_profile_optional.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/signup_profile_optional.js:1) calls:
  - `/api/signup/profile` -> `signin_signup.complete_profile_setup`
- [home_page.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/home_page.js:11) calls Aadhaar endpoints:
  - `/api/auth/aadhaar/send-otp` -> `signin_signup.send_aadhaar_otp_api`
  - `/api/auth/aadhaar/verify-otp` -> `signin_signup.verify_aadhaar_otp_api`

## Event Flow

- [create_post_event.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/create_post_event.js:563)
  - `/api/events/create` -> `views.create_event_api`
- [home_page.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/home_page.js:11)
  - `/api/events/mine` -> `views.my_events_api`
  - `/api/events/live` -> `views.live_events_api`
  - `/api/events/nearby` -> `views.nearby_events_api`
  - `/api/events/<event_id>` -> `views.delete_event_api`

## Ticket Flow

- [home_page.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/home_page.js:11)
  - `/api/tickets` -> `views.tickets_api`
  - `/api/tickets/book` -> `views.book_ticket_api`
  - `/api/tickets/<ticket_id>/pay` -> `views.pay_ticket_api`
  - `/api/tickets/<ticket_id>/group` -> `views.update_group_ticket_api`
  - `/api/tickets/<ticket_id>/cancel` -> `views.cancel_ticket_api`
  - `/api/tickets/<ticket_id>/archive` -> `views.archive_ticket_api`
  - `/api/tickets/<ticket_id>/delete` -> `views.delete_ticket_api`
- [ticket_view.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/ticket_view.html:69) renders through [views.view_ticket_page](/e:/project/Party_connect_hub_redefine/HAPPNIX/views.py:397)

## Guest Invite And Guest Ticket Flow

- [home_page.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/home_page.js:11)
  - `/api/guest-invites` -> `views.create_guest_invite_api`
  - `/api/guest-invites/<token>/pay-by-owner` -> `views.guest_pay_by_owner_api`
  - `/api/guest-invites/<token>/cancel-by-owner` -> `views.guest_cancel_by_owner_api`
- [guest_onboarding.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/guest_onboarding.html:199) inline JS
  - `/api/guest-invites/<token>/send-mobile-otp` -> `views.guest_send_mobile_otp_api`
  - `/api/guest-invites/<token>/verify-mobile-otp` -> `views.guest_verify_mobile_otp_api`
  - `/api/guest-invites/<token>/onboarding` -> `views.guest_onboarding_api`
- [guest_ticket.html](/e:/project/Party_connect_hub_redefine/HAPPNIX/templates/guest_ticket.html:212) inline JS
  - `/api/guest-invites/<token>/pay` -> `views.guest_pay_api`
  - `/api/guest-invites/<token>/cancel` -> `views.guest_cancel_api`

## User Search, Profiles, And Follow Flow

- [home_page.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/home_page.js:11) and [messages.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/messages.js:97)
  - `/api/users/search` -> `views.search_users_api`
- [home_page.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/home_page.js:11)
  - `/api/users/<user_id>/profile` -> `views.public_profile_api`
  - `/api/users/follow` -> `views.follow_user_api`
  - `/api/profile/me` -> `views.current_profile_api`
  - `/api/profile/<graph_type>` -> `views.profile_follow_graph_api`
  - `/api/profile/update` -> `views.profile_update_api`
  - `/api/profile/privacy` -> `views.profile_privacy_api`
  - `/api/profile/follow-requests` -> `views.follow_requests_api`

## Settings And Notifications Flow

- [home_page.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/home_page.js:11)
  - `/api/settings/preferences` -> `views.settings_preferences_api`
  - `/api/settings/people/<category>` -> `views.settings_people_api`
  - `/api/notifications` -> `views.notifications_api`
  - `/api/notifications/activity` -> `views.log_activity_api`

## Messaging Flow

### Direct conversations

- [messages.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/messages.js:97)
  - `/api/messages/conversations` -> `messaging.conversations_api`
  - `/api/messages/conversations/start` -> `messaging.start_conversation_api`
  - `/api/messages/conversations/<id>/messages` -> `messaging.conversation_messages_api`
  - `/api/messages/conversations/<id>/read` -> `messaging.mark_conversation_read_api`
  - `/api/messages/conversations/<id>/clear` -> `messaging.clear_conversation_api`
  - `/api/messages/conversations/<id>/delete` -> `messaging.delete_conversation_api`

### Direct message item actions

- [messages.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/messages.js:97)
  - `/api/messages/messages/<id>/edit` -> `messaging.edit_message_api`
  - `/api/messages/messages/<id>/forward` -> `messaging.forward_message_api`
  - `/api/messages/messages/<id>/delete` -> `messaging.delete_message_for_me_api`
  - `/api/messages/messages/<id>/unsend` -> `messaging.unsend_message_api`

### Group chat

- [messages.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/messages.js:97)
  - `/api/messages/groups/create` -> `group_chat.create_group_api`
  - `/api/messages/groups/<id>` -> `group_chat.group_details_api`
  - `/api/messages/groups/<id>/messages` -> `group_chat.group_messages_api`
  - `/api/messages/groups/<id>/members` -> `group_chat.add_group_members_api`
  - `/api/messages/groups/<id>/members/<user_id>/role` -> `group_chat.update_group_member_role_api`
  - `/api/messages/groups/<id>/members/<user_id>/remove` -> `group_chat.remove_group_member_api`
  - `/api/messages/groups/<id>/rename` -> `group_chat.rename_group_api`
  - `/api/messages/groups/<id>/leave` -> `group_chat.leave_group_api`
  - `/api/messages/groups/<id>/clear` -> `group_chat.clear_group_conversation_api`
  - `/api/messages/groups/<id>/delete` -> `group_chat.delete_group_api`
  - `/api/messages/group-messages/<id>/edit` -> `group_chat.edit_group_message_api`
  - `/api/messages/group-messages/<id>/delete` -> `group_chat.delete_group_message_for_me_api`
  - `/api/messages/group-messages/<id>/unsend` -> `group_chat.unsend_group_message_api`

### WebSocket integration

- [messages.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/messages.js:2216) opens `ws/messages/`
- [consumers.MessageConsumer](/e:/project/Party_connect_hub_redefine/HAPPNIX/consumers.py:29) handles:
  - online presence updates
  - typing indicators
  - delivery receipts
  - read receipts
  - live conversation/message snapshots

## Request Packaging Patterns

- JSON POST
  - auth, follow, settings, notifications, most ticket actions
- multipart form data
  - event creation
  - profile update
  - message sending with attachments
- query-string GET
  - search
  - list and fetch operations

## Important Wiring Notes

- [home_page.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/home_page.js:11) is the central orchestrator for most non-message product areas.
- [messages.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/messages.js:97) owns both direct and group chat flows.
- Guest onboarding and guest ticket pages use inline template JavaScript instead of static JS files.
- Search users is a shared dependency across profile, ticket-grouping, guest invites, and messaging flows.

## Known Mismatch

- [home_page.js](/e:/project/Party_connect_hub_redefine/HAPPNIX/static/js/home_page.js:6281) contains a reference to `/api/tickets/<id>/verify`, but no matching backend route is currently registered.
