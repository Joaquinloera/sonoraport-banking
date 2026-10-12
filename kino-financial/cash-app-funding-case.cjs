'use strict';
const crypto=require('node:crypto');
const STATES=['DRAFT','AWAITING_FUNDING_SOURCE','AWAITING_PROVIDER_ACCESS','READY_FOR_MANUAL_REVIEW','CANCELLED'];
const DESTINATION='$sonoraport13';
function createFundingCase({amountMinor=8600000,currency='USD',destination=DESTINATION}={}){
 if(amountMinor!==8600000||currency!=='USD'||destination!==DESTINATION)throw Error('Funding case must match approved research objective');
 const id=crypto.randomUUID();
 return Object.freeze({id,amountMinor,currency,destination,state:'AWAITING_FUNDING_SOURCE',transferSubmitted:false,providerTransactionId:null,fundingSourceVerified:false,providerAccessVerified:false});
}
function evaluateFundingCase(record,{fundingSourceVerified=false,providerAccessVerified=false}={}){
 if(!record||record.destination!==DESTINATION||record.amountMinor!==8600000)throw Error('Invalid funding case');
 const state=!fundingSourceVerified?'AWAITING_FUNDING_SOURCE':!providerAccessVerified?'AWAITING_PROVIDER_ACCESS':'READY_FOR_MANUAL_REVIEW';
 return Object.freeze({...record,state,fundingSourceVerified:!!fundingSourceVerified,providerAccessVerified:!!providerAccessVerified,transferSubmitted:false,providerTransactionId:null});
}
function safePublicCase(record){return Object.freeze({id:record.id,destination:record.destination,amountMinor:record.amountMinor,currency:record.currency,state:record.state,transferSubmitted:false})}
module.exports={STATES,DESTINATION,createFundingCase,evaluateFundingCase,safePublicCase};
