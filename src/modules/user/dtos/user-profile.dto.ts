export class UserProfileDto {
  id: string;
  userName: string;
  email: string;
  photo?: string;

  bookmarked: {
    id: string;
    name: string;
  }[];
}