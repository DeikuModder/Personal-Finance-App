export declare class RefreshToken {
    id: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    deviceHash: string | null;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
}
