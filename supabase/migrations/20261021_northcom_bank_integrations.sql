-- Bank-specific technical metadata, never store access tokens or private keys.
create table if not exists public.northcom_bank_integrations (
 fdic_certificate text primary key,
 bank_name text not null,
 api_portal text,
 oauth_token_url text,
 wallet_status text not null default 'not_verified',
 blockchain_status text not null default 'not_verified',
 digital_asset_status text not null default 'not_verified',
 live_api_connected boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.northcom_bank_integrations enable row level security;
revoke all on public.northcom_bank_integrations from anon, authenticated;
insert into public.northcom_bank_integrations(fdic_certificate,bank_name,api_portal,oauth_token_url,wallet_status,blockchain_status,digital_asset_status)
values ('14','State Street Bank and Trust Company','https://developer.statestreet.com/','https://api.statestreet.com/oauth/accesstoken','entitlement_required','entitlement_required','entitlement_required')
on conflict(fdic_certificate) do update set api_portal=excluded.api_portal,oauth_token_url=excluded.oauth_token_url,updated_at=now();
