// NORTHCOM State Street: server-side OAuth client credentials, no browser secrets.
// Requires bank-approved API credentials in environment variables.
const TOKEN_URL='https://api.statestreet.com/oauth/accesstoken';
export async function requestStateStreetToken({clientId=process.env.STATE_STREET_CLIENT_ID,clientSecret=process.env.STATE_STREET_CLIENT_SECRET,fetchImpl=fetch}={}){
 if(!clientId||!clientSecret)throw new Error('State Street bank-issued OAuth credentials required');
 const authorization=Buffer.from(clientId+':'+clientSecret).toString('base64');
 const response=await fetchImpl(TOKEN_URL,{method:'POST',headers:{Authorization:'Basic '+authorization,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('State Street OAuth failed: HTTP '+response.status);
 const payload=await response.json();
 if(typeof payload.access_token!=='string'||!payload.access_token)throw new Error('OAuth response missing access_token');
 return {accessToken:payload.access_token,tokenType:payload.token_type||'Bearer',expiresIn:payload.expires_in??null};
}
