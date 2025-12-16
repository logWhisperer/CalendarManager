// Build your own Slack Alert: // Slack Kit Builder: https://app.slack.com/block-kit-builder/T07068QQ8UD#%7B%22blocks%22:%5B%7B%22type%22:%22section%22,%22text%22:%7B%22type%22:%22mrkdwn%22,%22text%22:%22*%F0%9F%9A%AB%20No%20one%20accepted%20the%20invite*%5Cn%3Chttps://calendar.google.com/calendar/event?eid=abc123%7CWeekly%20Vendor%20Sync%3E%22%7D%7D,%7B%22type%22:%22context%22,%22elements%22:%5B%7B%22type%22:%22mrkdwn%22,%22text%22:%22*Meeting%20time:*%20%60Jan%2017,%202026%2010:00%20AM%60%22%7D%5D%7D,%7B%22type%22:%22section%22,%22text%22:%7B%22type%22:%22mrkdwn%22,%22text%22:%22*Organizer:*%5Cnops@company.com%22%7D%7D,%7B%22type%22:%22section%22,%22text%22:%7B%22type%22:%22mrkdwn%22,%22text%22:%22*Attendees:*%5Cnvendor@external.com%5Cnconsultant@gmail.com%22%7D%7D%5D%7D

const SLACK_CHANNEL = 'https://hooks.slack.com/services/YOUR_CHANNEL_URL';

function chaseThemDown() {

  const logsSheet       = getOrCreateSheetByName('Alerts' , ['EventID' , 'Alert Date']);
  const customersSheet  = getOrCreateSheetByName('Customers' , ["Domain"]);
  const internalDomains = getOrCreateSheetByName('Internal Domains' , ["Domain"]);

  let customersData = customersSheet.getDataRange().getValues();
  customersData = customersData.map(row => row[0]);

  let internalDomainsData = internalDomains.getDataRange().getValues();
  internalDomainsData = internalDomainsData.map(row => row[0]);

  const alertsSentData = arrayToJson(logsSheet.getDataRange().getValues());
  
  const calendar = CalendarApp.getDefaultCalendar();
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);
  const events = calendar.getEvents(now, threeDaysFromNow);

  events.forEach(function(event) {
    
    console.log(event.getTitle());
    
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

    if (allEmails.length > 1) 
    {
      let guests = event.getGuestList();
      let filteredGuests = guests.filter(function (guest) {
        const email = guest.getEmail().toLowerCase();

        return !internalDomainsData.some(domain =>
          email.endsWith('@' + domain)
        );
      });

      if(filteredGuests.length === 0)
      {
        return;
      }

      let hasAccepted = filteredGuests.some(function(guest) {
        console.log(guest.getEmail())
        return guest.getGuestStatus() == CalendarApp.GuestStatus.YES;
      });

      if(hasAccepted == false)
      {
        let shouldSlackAlert = true;

        if(isSameDate(new Date() , event.getDateCreated())) // check if event was scheduled today
        {
          shouldSlackAlert = false;
        }
        else if(alertsSentData.hasOwnProperty(event.getId()) == true) // check if alert was already sent in the past
        {
          shouldSlackAlert = isSameDate(new Date() , alertsSentData[event.getId()].date) === false; // check if alert was sent today
        }

        if(shouldSlackAlert)
        {
          Utilities.sleep(500); // put some sleep not to get blocked by Slack rate limits
          slackAlert(event , internalDomainsData);
          logEventAlert(event);
        }
      }
    }
  });

  console.log("Completed chaseThemDown successfully")
}













function isSameDate(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}


function arrayToJson(arr) {
  var result = {};
  arr.forEach(function(row) {
    var key = row[0];
    var value = row[1];
    result[key] = { date: value };
  });
  return result;
}


function logEventAlert(event)
{
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let logsSheet = ss.getSheetByName("Alerts");

  logsSheet.appendRow([event.getId() , new Date()]);
}

function getEventUrl(event) {

  var eventId = event.getId();
  // Strip @google.com suffix if present
  eventId = eventId.replace(/@google.com$/, "");
  
  var raw = eventId + " " + CalendarApp.getDefaultCalendar().getId();
  var eid = Utilities.base64EncodeWebSafe(raw).replace(/=+$/, "");
  return "https://calendar.google.com/calendar/event?eid=" + eid;
}



function formatDate(date) {
  const weekday = date.toLocaleString("en-US", { weekday: "short" }); // Tue
  const month = date.toLocaleString("en-US", { month: "short" });     // Aug
  const day = date.getDate();                                          // 19
  const year = date.getFullYear();                                     // 2025
  const time = date.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }); // 8:00 AM

  return `${weekday}, ${month} ${day}, ${year} at ${time}`;
}


function slackAlert(event , internalDomainsData)
{
  const targetChannel = SLACK_CHANNEL;
  
  let externalGuestEmails = event.getGuestList()
    .map(function(guest) { return guest.getEmail(); })
    .filter(function(email) { return !internalDomainsData.some(domain => email.endsWith('@' + domain)); });

  let creator = event.getCreators()[0];


  let message = "No one accepted the invite for the <" + getEventUrl(event) + "|" + event.getTitle().replaceAll("<" , "&lt;").replaceAll(">" , "&gt;") + ">\nMeeting time: `" + formatDate(event.getStartTime()) + "`\n\n*Organizer*: " + creator + "\n\n*Attendees*:\n" + externalGuestEmails.join("\n");

  return slackMrkdwnMessage(targetChannel , message);
}




