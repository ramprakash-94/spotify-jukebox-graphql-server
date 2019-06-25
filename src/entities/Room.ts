import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany, Generated, ManyToOne, ManyToMany, JoinTable, OneToOne } from 'typeorm'
import {User} from './User'
import { Playlist } from './Playlist';
import { Track } from './Track';

@Entity()
export class Room extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  @Generated("increment")
  number: number

  @ManyToOne(type => User, user => user.rooms)
  admin: User 

  @OneToOne(type => Track)
  currentTrack: Track

  @ManyToMany(type => Playlist, playlist => playlist.rooms)
  @JoinTable()
  playlists: Playlist[]
}

