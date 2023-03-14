import { NFTCollectionViewProps, NFTDetailProps } from "../models/types";

const REGEX =
    /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

export default function validate(uuid: string) {
    return typeof uuid === "string" && REGEX.test(uuid);
}

export function assertValidNFTCollectionViewProps({ wallets, projectId }: NFTCollectionViewProps) {
    if (wallets.length === 0) {
        throw new Error("wallets prop is empty. Please provide at least one wallet.");
    }

    if (!projectId) {
        throw new Error("projectId prop is empty. Please provide a valid projectId.");
    }
}

export function assertValidValidateNFTDetailProps({ nft, projectId }: NFTDetailProps) {
    if (nft == null) {
        throw new Error("nft prop is empty. Please provide a valid nft.");
    }
}
