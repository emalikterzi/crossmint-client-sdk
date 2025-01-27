import { NFT, NFTCollectionViewProps, NFTDetailProps, baseUrls } from "../models/types";

export const getEnvironmentBaseUrl = (environment = ""): string => {
    const productionValues = ["prod", "production"];
    if (environment === "staging") return baseUrls.staging;
    if (productionValues.includes(environment) || !environment) return baseUrls.prod;
    return environment;
};

function getNFTLocator(nft: NFT) {
    if (typeof nft === "string") {
        return nft;
    }

    switch (nft.chain) {
        case "solana":
            return `${nft.chain}:${nft.mintHash}`;
        case "polygon":
        case "ethereum":
        case "bsc":
            return `${nft.chain}:${nft.contractAddress}:${nft.tokenId}`;
        case "cardano":
            return `${nft.chain}:${nft.assetId}`;
        default:
            throw new Error(`Invalid chain type ${JSON.stringify(nft)}`);
    }
}

export function getNFTCollectionViewSrc(props: NFTCollectionViewProps, clientVersion: string) {
    const baseUrl = getEnvironmentBaseUrl(props.environment);
    const { wallets } = props;
    const walletsStringify = JSON.stringify(wallets);

    const queryParams = new URLSearchParams({
        wallets: walletsStringify,
        clientVersion,
        ...(props.uiConfig != null ? { uiConfig: JSON.stringify(props.uiConfig) } : {}),
    });
    return `${baseUrl}/sdk/wallets/collection?${queryParams.toString()}`;
}

export function getNFTDetailSrc(props: NFTDetailProps, clientVersion: string) {
    const baseUrl = getEnvironmentBaseUrl(props.environment);
    const queryParams = new URLSearchParams({
        clientVersion,
        ...(props.uiConfig != null ? { uiConfig: JSON.stringify(props.uiConfig) } : {}),
    });
    const tokenLocator = getNFTLocator(props.nft);
    return `${baseUrl}/sdk/wallets/tokens/${tokenLocator}?${queryParams.toString()}`;
}
