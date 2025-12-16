const INTERTNAL_MEETING_COLOR = CalendarApp.EventColor.GREEN;
const EXTERNAL_MEETING_WITH_CUSTOMER = CalendarApp.EventColor.MAUVE;
const EXTERNAL_MEETING_WITH_PROSPECT = CalendarApp.EventColor.RED;


function colorCalendarEvents() {

  const customersSheet  = getOrCreateSheetByName('Customers' , ["Domain"]);
  const internalDomains = getOrCreateSheetByName('Internal Domains' , ["Domain"]);

  let customersData = customersSheet.getDataRange().getValues();
  customersData = customersData.map(row => row[0]);

  let internalDomainsData = internalDomains.getDataRange().getValues();
  internalDomainsData = internalDomainsData.map(row => row[0]);
 
  const calendar = CalendarApp.getDefaultCalendar();
  const now = new Date();
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(now.getMonth() + 1);
  const events = calendar.getEvents(now, oneMonthFromNow);

  events.forEach(function(event) {
    
    console.log(event.getTitle());

    Utilities.sleep(500);
    
    const guests = event.getGuestList();

    const organizer = event.getCreators();

    let allEmails = guests.map(function(guest) { return guest.getEmail(); });

    if (organizer && organizer.length > 0) 
    {
      allEmails = allEmails.concat(organizer);
    }
    
    switch (event.getEventType()) {

      case CalendarApp.EventType.DEFAULT:
        // Regular calendar event to be handled
        break;

      // ignore all other types of calendar events
      case CalendarApp.EventType.WORKING_LOCATION:
      case CalendarApp.EventType.OUT_OF_OFFICE:
      case CalendarApp.EventType.FOCUS_TIME:
        return;

      default:
        // Future-proof: Google may add new event types
        Logger.log('Unknown event type: ' + event.getEventType());
    }

    // If it's only me in the meeting, color it gray, it's me blocking timeslots in my calendar
    if (allEmails.length === 0 || (allEmails.length === 1 && allEmails[0] === Session.getActiveUser().getEmail())) 
    {
      // check whether the event blocks time on the calendar or not
      let transparency = event.getTransparency();

      if(transparency.name() === 'OPAQUE')
        event.setColor(CalendarApp.EventColor.GRAY);
    } 
    else if (isInternalMeeting(event , internalDomainsData)) 
    {
      event.setColor(INTERTNAL_MEETING_COLOR);
    } 
    else // meeting with external ppl
    {
      let isCustomers = allEmails.some(function(email) {
          let domain = email.split('@')[1]
              return customersData.includes(domain);
          });

      event.setColor(isCustomers == true ? EXTERNAL_MEETING_WITH_CUSTOMER : EXTERNAL_MEETING_WITH_PROSPECT);
    }

  });

  console.log("Completed colorCalendarEvents successfully")
}







