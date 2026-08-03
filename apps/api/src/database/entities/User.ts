import {Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

export enum UserRole{
  MEMBER = 'member',
  ADMIN = 'admin'
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false
  })
  name!: string

  @Column({
    type: 'varchar',
    length: 320,
    nullable: false,
    unique: true
  })
  email!: string

  @Column()
  passwordHash!: string

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MEMBER
  })
  role!: UserRole
}