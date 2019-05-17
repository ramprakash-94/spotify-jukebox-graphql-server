import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany, Generated, ManyToOne, ManyToMany, JoinTable } from 'typeorm'
import {User} from './User'
import { Playlist } from './Playlist';

@Entity()
export class Room extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  @Generated("increment")
  number: number

  @ManyToOne(type => User, user => user.rooms)
  admin: User 

  @ManyToMany(type => Playlist, playlist => playlist.rooms)
  @JoinTable()
  playlists: Playlist[]
}

