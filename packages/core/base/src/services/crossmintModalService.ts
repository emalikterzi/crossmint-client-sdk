import { CheckoutEvents } from "../models/events";
import { Currency, Locale, PayButtonConfig, PaymentMethod, SigninMethods, clientNames } from "../models/types";
import { getEnvironmentBaseUrl } from "../utils/ui";

type MintQueryParams = {
    clientId: string;
    mintTo?: string;
    emailTo?: string;
    listingId?: string;
    clientName: string;
    clientVersion: string;
    mintConfig: string;
    whPassThroughArgs?: string;
    paymentMethod?: PaymentMethod;
    preferredSigninMethod?: SigninMethods;
    prepay?: string;
    locale: Locale;
    currency: Currency;
    successCallbackURL?: string;
    failureCallbackURL?: string;
};

const overlayId = "__crossmint-overlay__";

const POPUP_WIDTH = 400;
const POPUP_HEIGHT = 750;

const getChromeVersion = () => {
    const raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
    return raw ? parseInt(raw[2]) : null;
};

function createPopupString(width: number, height: number) {
    function getLeft() {
        return window?.top != null
            ? window.top.outerWidth / 2 + window.top.screenX - width / 2
            : window.outerWidth / 2 + window.screenX - width / 2;
    }

    function getTop() {
        return window?.top != null
            ? window.top.outerHeight / 2 + window.top.screenY - height / 2
            : window.outerHeight / 2 + window.screenY - height / 2;
    }

    // In newer versions of chrome (>99) you need to add the `popup=true` for the new window to actually open in a popup
    const chromeVersion = getChromeVersion();
    const chromeVersionGreaterThan99 = chromeVersion && chromeVersion > 99;
    const popupStringBase = chromeVersionGreaterThan99 ? "popup=true," : "";

    return `${popupStringBase}height=${height},width=${width},left=${getLeft()},top=${getTop()},resizable=yes,scrollbars=yes,toolbar=yes,menubar=true,location=no,directories=no, status=yes`;
}

const addLoadingOverlay = (dissmissableOverlayOnClick?: boolean): void => {
    const overlayEl = document.createElement("div");
    overlayEl.setAttribute("id", overlayId);
    const overlayStyles = {
        width: "100vw",
        height: "100vh",
        "background-color": "rgba(0, 0, 0, 0.5)",
        position: "fixed",
        "z-index": "99999999",
        top: "0",
        left: "0",
    };
    Object.assign(overlayEl.style, overlayStyles);
    document.body.appendChild(overlayEl);

    if (dissmissableOverlayOnClick) {
        overlayEl.addEventListener("click", () => {
            removeLoadingOverlay();
        });
    }
};

const removeLoadingOverlay = (): void => {
    const overlayEl = document.getElementById(overlayId);
    if (overlayEl) overlayEl.remove();
};

interface CrossmintModalServiceParams {
    clientId: string;
    libVersion: string;
    showOverlay: boolean;
    dismissOverlayOnClick?: boolean;
    setConnecting: (connecting: boolean) => void;
    environment?: string;
    clientName: clientNames;
    locale: Locale;
    currency: Currency;
    successCallbackURL?: string;
    failureCallbackURL?: string;
    // TODO: Enable when events are ready in crossbit-main and docs are updated
    // onEvent?: (event: CheckoutEvents, metadata?: any) => void;
}

export interface CrossmintModalServiceReturn {
    connect: (
        mintConfig: PayButtonConfig | PayButtonConfig[],
        mintTo?: string,
        emailTo?: string,
        listingId?: string,
        whPassThroughArgs?: any,
        paymentMethod?: PaymentMethod,
        preferredSigninMethod?: SigninMethods,
        prepay?: boolean
    ) => void;
}

export function crossmintModalService({
    clientId,
    libVersion,
    showOverlay,
    dismissOverlayOnClick,
    setConnecting,
    environment,
    clientName,
    locale,
    currency,
    successCallbackURL,
    failureCallbackURL,
}: CrossmintModalServiceParams): CrossmintModalServiceReturn {
    const createPopup = (
        mintConfig: PayButtonConfig | PayButtonConfig[],
        mintTo?: string,
        emailTo?: string,
        listingId?: string,
        whPassThroughArgs?: any,
        paymentMethod?: PaymentMethod,
        preferredSigninMethod?: SigninMethods,
        prepay?: boolean
    ) => {
        const urlOrigin = getEnvironmentBaseUrl(environment);
        const getMintQueryParams = (): string => {
            const mintQueryParams: MintQueryParams = {
                clientId: clientId,
                clientName,
                clientVersion: libVersion,
                mintConfig: JSON.stringify(mintConfig),
                locale,
                currency,
            };

            if (mintTo) mintQueryParams.mintTo = mintTo;
            if (emailTo) mintQueryParams.emailTo = emailTo;
            if (listingId) mintQueryParams.listingId = listingId;
            if (whPassThroughArgs) mintQueryParams.whPassThroughArgs = JSON.stringify(whPassThroughArgs);
            if (paymentMethod) mintQueryParams.paymentMethod = paymentMethod.toLowerCase() as PaymentMethod;
            if (preferredSigninMethod) mintQueryParams.preferredSigninMethod = preferredSigninMethod;
            if (prepay) mintQueryParams.prepay = "true";
            if (successCallbackURL) mintQueryParams.successCallbackURL = successCallbackURL;
            if (failureCallbackURL) mintQueryParams.failureCallbackURL = failureCallbackURL;

            return new URLSearchParams(mintQueryParams).toString();
        };
        const callbackUrl = encodeURIComponent(`${urlOrigin}/checkout/mint?${getMintQueryParams()}`);
        const url = `${urlOrigin}/signin?callbackUrl=${callbackUrl}&locale=${locale}&currency=${currency}`;

        const pop = window.open(url, "popUpWindow", createPopupString(POPUP_WIDTH, POPUP_HEIGHT));
        if (pop) {
            registerListeners(pop);
            if (showOverlay) {
                addLoadingOverlay(dismissOverlayOnClick);
            }
            return;
        }
        setConnecting(false);
        const newTab = window.open(url, "_blank");
        if (!newTab) {
            console.error("Failed to open popup window and new tab");
        }
    };

    const connect = (
        mintConfig: PayButtonConfig | PayButtonConfig[],
        mintTo?: string,
        emailTo?: string,
        listingId?: string,
        whPassThroughArgs?: any,
        paymentMethod?: PaymentMethod,
        preferredSigninMethod?: SigninMethods,
        prepay?: boolean
    ) => {
        setConnecting(true);

        createPopup(
            mintConfig,
            mintTo,
            emailTo,
            listingId,
            whPassThroughArgs,
            paymentMethod,
            preferredSigninMethod,
            prepay
        );
    };

    function registerListeners(pop: Window) {
        function messageEventListener(message: MessageEvent<any>) {
            if (message.origin !== getEnvironmentBaseUrl(environment)) {
                return;
            }

            // TODO: Enable when events are ready in crossbit-main and docs are updated
            /* if (onEvent != null) {
                onEvent(message.data.name, message.data);
            } */
        }

        const timer = setInterval(function () {
            if (pop.closed) {
                clearInterval(timer);
                setConnecting(false);
                if (showOverlay) {
                    removeLoadingOverlay();
                }
                window.removeEventListener("message", messageEventListener);
            }
        }, 500);

        window.addEventListener("message", messageEventListener);
    }

    return {
        connect,
    };
}
