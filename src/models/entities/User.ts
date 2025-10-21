import { UserRole } from './base';

export interface User {
  userId: number;  // Primary key matching user_id in CSV
  name: string;
  email: string;
  password: string;
  avtUrl?: string;  // Matches avt_url in CSV
  publicAvtId?: string;  // Matches public_avt_id in CSV
  firstName?: string;  // Matches first_name in CSV
  lastName?: string;  // Matches last_name in CSV
  phoneNumber?: string;  // Matches phone_number in CSV
  userAddress?: string;  // Matches user_address in CSV
  userCity?: string;  // Matches user_city in CSV
  userCountry?: string;  // Matches user_country in CSV
  userPostalCode?: number;  // Matches user_postal_code in CSV
  role: UserRole;  // Matches user_role in CSV (S=STUDENT, I=INSTRUCTOR, A=ADMIN)
  activated: boolean;  // Matches activated in CSV
}

export interface Student extends User {
  role: UserRole.STUDENT;
  enrollments?: Enrollment[];
}

export interface Instructor extends User {
  role: UserRole.INSTRUCTOR;
  bio?: string;
  experience?: string;
  courses?: Course[];
}

export interface Admin extends User {
  role: UserRole.ADMIN;
}

// Forward declarations (will be defined in other files)
declare interface Course {
  courseId: number;
}

declare interface Enrollment {
  enrollmentId: number;
}