import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Check,
} from 'typeorm';

@Entity()
@Check(`"role" IN ('member', 'admin')`)
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 320,
    nullable: false,
    unique: true,
  })
  email!: string;

  @Column({
    type: 'varchar',
    length: 60,
    nullable: false,
    select: false,
  })
  passwordHash!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'member',
  })
  role!: 'member' | 'admin';

  @CreateDateColumn({ type: 'timestamptz', nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
