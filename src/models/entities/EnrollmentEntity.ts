import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { UserEntity } from './UserEntity';
import { CourseEntity } from './CourseEntity';

@Entity('enrollments')
export class EnrollmentEntity {
  @PrimaryGeneratedColumn({ name: 'enrollment_id' })
  enrollmentId!: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'student_id', referencedColumnName: 'userId' })
  student!: UserEntity;

  @Column({ name: 'student_id' })
  studentId!: number;

  @ManyToOne(() => CourseEntity)
  @JoinColumn({ name: 'course_id', referencedColumnName: 'courseId' })
  course!: CourseEntity;

  @Column({ name: 'course_id' })
  courseId!: number;

  @CreateDateColumn({ name: 'enrollment_date', type: 'timestamp' })
  enrollmentDate!: Date;

  @Column({ name: 'is_complete', type: 'boolean', default: false })
  isComplete!: boolean;

  @Column({ name: 'current_section_position', type: 'bigint', default: 1 })
  currentSectionPosition!: number;

  @Column({ name: 'completion_date', type: 'timestamp', nullable: true })
  completionDate?: Date;
}
