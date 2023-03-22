import { PaymentElementSDKEvents } from "../models/events";
import { CheckoutEventMap, CrossmintCheckoutEvent, PaymentElement } from "../models/paymentElement";
import { getEnvironmentBaseUrl } from "../utils";

export function crossmintPaymentService({ clientId, uiConfig, recipient, environment, mintArgs }: PaymentElement) {
    const baseUrl = getEnvironmentBaseUrl(environment);

    function getIframeUrl() {
        const params = new URLSearchParams({
            clientId,
        });

        if (uiConfig != null) {
            params.append("uiConfig", JSON.stringify(uiConfig));
        }

        if (recipient != null) {
            params.append("recipient", JSON.stringify(recipient));
        }

        if (mintArgs != null) {
            params.append("mintArgs", JSON.stringify(mintArgs));
        }

        return `${baseUrl}/sdk/paymentElement?${params.toString()}`;
    }

    function listenToEvents(
        cb: <K extends keyof CheckoutEventMap>(event: MessageEvent<CrossmintCheckoutEvent<K>>) => void
    ) {
        window.addEventListener("message", (event) => {
            if (event.origin !== baseUrl) {
                return;
            }

            cb(event);
        });
    }

    function emitQueryParams(payload: Partial<Record<keyof Omit<PaymentElement, "onEvent" | "environment">, any>>) {
        const iframe = document.getElementById("iframe-crossmint-payment-element") as HTMLIFrameElement;
        iframe?.contentWindow?.postMessage({ type: PaymentElementSDKEvents.PARAMS_UPDATE, payload }, baseUrl);
    }

    return {
        getIframeUrl,
        listenToEvents,
        emitQueryParams,
    };
}