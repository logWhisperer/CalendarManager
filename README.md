# Calendar Manager

A Google Apps Script project has 2 components:

1. PaintEvents - Automatically set colors to your calendar events based on meeting participants and type. 

2. ChaseThemDown - An automated Slack alerting system that monitors your calendar events and sends Slack notifications when external attendees haven't accepted your meeting invites.

## PaintEvents

The `colorCalendarEvents()` uses the following logic to determine event colors:

1. **Solo Meetings (Gray)**: Events with no guests or only the calendar owner
2. **Internal Meetings (Green)**: Events where all participants have email addresses from your organization's domain(s)
3. **Customer-Facing Meetings (Red)**: Events with any participants from external domains

## ChaseThemDown

### How It Works

The `chaseThemDown()` function:

1. **Scans upcoming events**: Processes all calendar events for the next 3 days
2. **Identifies external attendees**: Dynamically filters out internal domain participants based on domains listed in the "Internal Domains" sheet
3. **Checks acceptance status**: Verifies if any external attendees have accepted the meeting invite
4. **Sends alerts**: If no external attendees have accepted the invite, it sends a Slack alert
5. **Prevents duplicates**: Tracks sent alerts in the "Alerts" sheet to avoid sending multiple alerts for the same event on the same day

### Requirements

The function requires three sheets in your Google Sheet:
- **Alerts**: Tracks event IDs and alert dates to prevent duplicate notifications
- **Customers**: Contains your customer domains (you may add additional color categories - Prospects, Partners, Vendors, etc.)
- **Internal Domains**: Lists internal email domains to exclude from alerting (e.g., `company.com`, `yourorg.com`)

### Alert Conditions

A Slack alert is sent when:
- The meeting has external (non-internal domain) attendees
- No external attendees have accepted the invite
- The meeting is within the next 3 days
- The event was not created today (gives attendees time to respond)
- An alert hasn't already been sent for this event today

External attendees are identified by checking email domains against the "Internal Domains" sheet, making it easy to customize which domains are considered internal without modifying code.

### Configuration

Update the `SLACK_CHANNEL` constant in `ChaseThemDown.js` with your Slack webhook URL to enable notifications.


## Notes

- The `colorCalendarEvents()` function processes events for the next month from the current date
- The `chaseThemDown()` function scans events for the next 3 days only
- Only events in your default calendar are processed
- Event colors are updated in place (existing colors may be overwritten)
- Both scripts require manual execution via the menu or use a trigger to schedule them running once a day or hour
- Internal domains are managed via the "Internal Domains" sheet for flexibility, can include your company email domain, any ai note takers domains you use, etc.



