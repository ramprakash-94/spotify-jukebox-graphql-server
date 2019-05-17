import { GraphQLServer } from 'graphql-yoga'
import { createConnection, getRepository, Repository } from 'typeorm';
import { User } from './entities/User';
import { Room } from './entities/Room';
import { createBrotliCompress } from 'zlib';
import { Playlist } from './entities/Playlist';

const typeDefs = `
  type User {
    id: ID!
    userType: String!
    rooms: [Room!]!
  }
  type Room{
    id: ID!
    number: ID!
    admin: User!
    playlists: [Playlist!]!
  }
  type Playlist{
    id: ID!
    rooms: [Room!]!
    tracks: [String!]!
  }
  type Query {
    hello(name: String): String!
    user(id: ID!): User!
    users(ids: [ID!]): [User!]!
    allUsers(limit: Int): [User!]!
    allRooms(limit: Int): [Room!]!
    allTracksInPlaylist(playlistId: ID!): Playlist!
  }
  type Mutation {
    addUser(type: String!): User
    createRoom(userId: ID!): Room
    insertTrack(playlistId: ID!, track: String!): Playlist
  }
`;

const resolvers = {
  Query: {
    hello: (_, { name }) => `Hello ${name || 'World'}`,
    // this is the user resolver
    user: (_, { id }) => {
      return getRepository(User).findOne(id)
    },
    users: (_, {ids}) => {
      return getRepository(User).findByIds(ids)
    },
    allUsers: (_, {limit}) => {
      return getRepository(User).find({
        take: limit, 
        relations: ["rooms"]
      })
    },
    allRooms: (_, {limit}) => {
      return getRepository(Room).find({
        take: limit, 
        relations: ["admin", "playlists"]
      })
    },
    allTracksInPlaylist: (_, {playlistId}) => {
      return Playlist.findOne(playlistId)
    }
  },
  Mutation: {
    // this is the addUser resolver
    addUser: (_, {type}) => {
      const user = new User()
      user.userType = type
      user.rooms = []
      return getRepository(User).save(user)
    },

    createRoom: async(_, {userId}) => {
      const user = await User.findOne(userId)
      if (!user) {
        throw new Error(`Couldn’t find user with id ${userId}`);
      }
      // New Room
      const room = new Room()
      room.admin = user // Set Admin

      // New Playlist
      const playlist = new Playlist()
      await getRepository(Playlist).save(playlist)

      const roomPlaylists = [playlist]
      room.playlists = roomPlaylists
      await getRepository(Room).save(room)
      return room
    },

    insertTrack: async(_, {playlistId, track}) => {
      const playlist = await Playlist.findOne(playlistId)
      if (!playlist) {
        throw new Error(`Couldn’t find playlist with id ${playlistId}`);
      }

      let tracks = playlist.tracks
      if (tracks){
        tracks.push(track)
      }
      else{
        tracks = [track]
      }
      playlist.tracks = tracks
      await getRepository(Playlist).save(playlist)
      return playlist
    }
  },
}

const server = new GraphQLServer({ typeDefs, resolvers })

createConnection().then(() => {
  server.start(() => console.log("Server is running on localhost:5432"));
}).catch((msg) => {
  console.log("Couldn't connect to the database.")
  console.log(msg);
});