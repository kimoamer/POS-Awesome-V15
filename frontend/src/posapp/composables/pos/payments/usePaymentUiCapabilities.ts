import { usePosRuntimeCapabilities, type PosRuntimeCapabilitiesParams } from "../usePosRuntimeCapabilities";

export type PaymentUiCapabilitiesParams = PosRuntimeCapabilitiesParams;

export function usePaymentUiCapabilities(params: PaymentUiCapabilitiesParams) {
	return usePosRuntimeCapabilities(params);
}
