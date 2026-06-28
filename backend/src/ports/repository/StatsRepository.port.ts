export interface RecentFileSummary {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  folderId: string | null;
  createdAt: Date;
}

export interface StatsRepositoryPort {
  countFilesByUserId(userId: string): Promise<number>;
  countFoldersByUserId(userId: string): Promise<number>;
  sumFileBytesByUserId(userId: string): Promise<number>;
  findRecentFilesByUserId(userId: string, limit: number): Promise<RecentFileSummary[]>;
  getUserStorageTier(userId: string): Promise<string | null>;
  updateUserStorageTier(userId: string, tierId: string): Promise<void>;
}
