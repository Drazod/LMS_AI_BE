import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { OrderEntity } from './OrderEntity';
import { CourseEntity } from './CourseEntity';

@Entity('order_items')
export class OrderItemsEntity {
  @PrimaryColumn({ name: 'order_id' })
  orderId!: number;

  @PrimaryColumn({ name: 'course_id' })
  courseId!: number;

  @ManyToOne(() => OrderEntity)
  @JoinColumn({ name: 'order_id', referencedColumnName: 'orderId' })
  order!: OrderEntity;

  @ManyToOne(() => CourseEntity)
  @JoinColumn({ name: 'course_id', referencedColumnName: 'courseId' })
  course!: CourseEntity;

  @Column({ name: 'price', type: 'bigint' })
  price!: number;
}
