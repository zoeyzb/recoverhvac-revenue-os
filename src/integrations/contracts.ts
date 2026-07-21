export type ProviderMode = "test" | "live";
export type ProviderResult<T> = { ok: true; data: T; externalId?: string } | { ok: false; code: string; message: string; retryable: boolean };
export interface CrmAdapter { upsertCompany(input: unknown): Promise<ProviderResult<{ id: string }>>; updateOpportunity(input: unknown): Promise<ProviderResult<{ id: string }>>; }
export interface OutreachAdapter { createApprovedCampaign(input: unknown): Promise<ProviderResult<{ id: string }>>; stopOnReply(threadId: string): Promise<ProviderResult<{ stopped: boolean }>>; }
export interface TelephonyAdapter { sendRecoveryText(input: unknown): Promise<ProviderResult<{ messageId: string }>>; placeApprovedCall(input: unknown): Promise<ProviderResult<{ callId: string }>>; }
export interface VoiceAdapter { startSession(input: unknown): Promise<ProviderResult<{ roomId: string }>>; endSession(roomId: string, reason: string): Promise<ProviderResult<{ ended: boolean }>>; }
export interface BillingAdapter { createCheckout(input: unknown): Promise<ProviderResult<{ url: string }>>; }
