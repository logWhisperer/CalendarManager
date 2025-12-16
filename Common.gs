function isInternalMeeting(event, internalDomains) {
  var guests = event.getGuestList();

  // Include the organizer as well
  var organizer = event.getCreators();

  var allEmails = guests.map(function(guest) { return guest.getEmail(); });

  if (organizer && organizer.length > 0) {
    allEmails = allEmails.concat(organizer);
  }

  // If there are no guests or organizers, treat as not internal
  if (allEmails.length === 0) 
    return false;

  return allEmails.every(function(email) {
    return internalDomains.includes(email.split('@')[1]);
  });
}


function getOrCreateSheetByName(sheetName, headers) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);

    // Add header row
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}
