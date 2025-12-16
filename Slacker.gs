// Slack Kit Builder: https://app.slack.com/block-kit-builder

function slackMrkdwnMessage(slackChannel , message)
{
  var payload = {
      unfurl_links: false,
      unfurl_media: false,
      blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message
        },
      },
      {
			  type: 'divider'
		  }
    ]
  };
    
  return slackPayload(payload , slackChannel);
}

function slackPayload(payload, channel)
{ 
  var options = {
    method : 'post',
    payload : JSON.stringify(payload),
  };
  
  try
  {
    var response = UrlFetchApp.fetch(channel, options);

    console.log(response.getContentText());
  }
  catch(ex)
  {
    console.error(ex.toString()); 
    console.error(ex.stack);    

    console.log('payload', JSON.stringify(payload));

    return false;
  }
  
  return true;
}
