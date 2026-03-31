import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Account } from './Account';

export enum RoleType {
    Admin = 'Admin',
    Contributor = 'Contributor',
    Player = 'Player'
}

@Entity('Roles')
export class Role {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', unique: true })
    name!: RoleType;

    @Column({ type: 'varchar', nullable: true })
    description?: string;

    @OneToMany(() => Account, account => account.role)
    accounts?: Account[];
}