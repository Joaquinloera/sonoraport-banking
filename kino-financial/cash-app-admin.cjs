'use strict';
const crypto=require('node:crypto');
const {createFundingCase,safePublicCase}=require('./cash-app-funding-case.cjs');
const DEFAULT_DESTINATION='$sonoraport13';
class CashAppAdmin {
 constructor({audit=()=>{},clock=()=>new Date().toISOString()}={}){this.cases=new Map();this.keys=new Map();this.audit=audit;this.clock=clock;}
 requireAdmin(actor){if(!actor||actor.role!=='admin'||!actor.id)throw Error('ADMIN_REQUIRED');}
 createCase(actor,key){this.requireAdmin(actor);if(typeof key!=='string'||key.length<12)throw Error('INVALID_IDEMPOTENCY_KEY');if(this.keys.has(key))return this.getCase(actor,this.keys.get(key));const record=createFundingCase();this.cases.set(record.id,record);this.keys.set(key,record.id);this.audit({event:'CASH_APP_CASE_CREATED',actorId:actor.id,caseId:record.id,at:this.clock()});return safePublicCase(record);}
 getCase(actor,id){this.requireAdmin(actor);const record=this.cases.get(id);if(!record)throw Error('NOT_FOUND');return safePublicCase(record);}
 getProviderStatus(actor){this.requireAdmin(actor);return {provider:'cash_app_pay',destination:DEFAULT_DESTINATION,mode:'RESEARCH_AND_SIMULATION',partnerApproved:false,credentialsConfigured:false,liveTransfersEnabled:false,webhookVerificationConfigured:false};}
 requestTransfer(){throw Error('LIVE_MONEY_MOVEMENT_DISABLED');}
 processWebhook(){throw Error('WEBHOOK_VERIFICATION_NOT_CONFIGURED');}
}
module.exports={CashAppAdmin};
