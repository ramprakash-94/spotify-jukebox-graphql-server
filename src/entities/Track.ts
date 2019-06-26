
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany, Generated, ManyToOne, ManyToMany, JoinTable, PrimaryColumn, OneToOne,JoinColumn } from 'typeorm'
import {User} from './User'
import { Playlist } from './Playlist';

@Entity()
export class Track extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  uri: string

  @Column()
  title: string

  @Column()
  artist: string

  @Column()
  album: string

  @Column()
  albumArt: string

  @ManyToMany(type => Playlist, playlist => playlist.rooms)
  playlists: Playlist[]

  @OneToOne(type => User)
  @JoinColumn()
  user: User
}
