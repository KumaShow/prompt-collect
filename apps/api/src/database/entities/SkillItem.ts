import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from './Category.js';

@Entity()
export class SkillItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  title!: string;

  @Column({ type: 'uuid', nullable: false })
  categoryId!: string;

  @ManyToOne(() => Category, (category) => category.skillItems, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @Column({
    type: 'text',
    array: true,
    nullable: false,
    default: () => "'{}'",
  })
  tags!: string[];

  @Column({
    type: 'text',
    nullable: false,
  })
  content!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  useCase!: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  exampleInput!: string | null;

  @CreateDateColumn({ type: 'timestamptz', nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
