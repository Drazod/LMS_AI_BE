import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { UserEntity } from './UserEntity';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn({ name: 'order_id' })
  orderId!: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'student_id', referencedColumnName: 'userId' })
  student!: UserEntity;

  @Column({ name: 'student_id' })
  studentId!: number;

  @CreateDateColumn({ name: 'payment_date', type: 'timestamp' })
  paymentDate!: Date;

  @Column({ name: 'total_price', type: 'bigint' })
  totalPrice!: number;
}
