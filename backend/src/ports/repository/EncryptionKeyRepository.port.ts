export interface EncryptionKey {
  userId: string;
  encryptedDek: string;
  dekIv: string;
  dekSalt: string;
  kdfAlgorithm: string;
  kdfParams: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewEncryptionKey {
  userId: string;
  encryptedDek: string;
  dekIv: string;
  dekSalt: string;
  kdfAlgorithm: string;
  kdfParams: string;
}

export interface UpdateEncryptionKey {
  encryptedDek: string;
  dekIv: string;
  dekSalt: string;
  kdfAlgorithm: string;
  kdfParams: string;
}

export interface EncryptionKeyRepositoryPort {
  create(data: NewEncryptionKey): Promise<EncryptionKey>;
  findByUserId(userId: string): Promise<EncryptionKey | null>;
  update(userId: string, data: UpdateEncryptionKey): Promise<EncryptionKey>;
}
