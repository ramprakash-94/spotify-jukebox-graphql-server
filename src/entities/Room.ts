import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany, Generated, ManyToOne, ManyToMany, JoinTable, OneToOne, JoinColumn } from 'typeorm'
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
  @JoinColumn()
  currentTrack: Track

  @Column("integer")
  position: number

  @Column("integer")
  duration: number

  @Column()
  playing: Boolean

  @ManyToMany(type => Playlist, playlist => playlist.rooms)
  @JoinTable()
  playlists: Playlist[]
}

