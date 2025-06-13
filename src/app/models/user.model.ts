export interface User {
  id: string;
  name: string;
  phone?: string;
  createdAt: number;
}

export interface UserFile {
  fileId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: number;
  userId: string;
}
