import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { CourseStatus } from './base';
import { UserEntity } from './UserEntity';
import { SectionEntity } from './SectionEntity';

@Entity('courses')
export class CourseEntity {
  @PrimaryGeneratedColumn({ name: 'course_id' })
  courseId!: number;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'course_thumbnail', type: 'text', nullable: true })
  courseThumbnail?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column({ name: 'avg_rating', type: 'real', default: 0 })
  avgRating!: number;

  @Column({ name: 'total_rating', type: 'integer', default: 0 })
  totalRating!: number;

  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.APPROVED
  })
  status!: CourseStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'category_id', type: 'bigint', nullable: true })
  categoryId?: number;

  @Column({ name: 'instructor_id', type: 'bigint', nullable: true })
  instructorId?: number;

  // Relations
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'instructor_id' })
  instructor?: UserEntity;

  @OneToMany(() => SectionEntity, section => section.course)
  sections?: SectionEntity[];
}