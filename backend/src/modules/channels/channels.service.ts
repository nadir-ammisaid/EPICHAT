import { prisma } from "../../prisma/client.js";
import HttpError from "../../shared/errors/httpError.js";
 
 
type CreateChannelInput = {
  serverId: string;
  userId: string;
  name: string;
};


    //Create a new channel in a server

export async function createChannelService(input: CreateChannelInput) {
  const { serverId, userId, name } = input;

//Check if the server exists
  const server = await prisma.server.findUnique({
    where: { id: serverId },
  });
 
  if (!server) {
    throw new HttpError(404,"Server not found");
  }
 
//Check if channel name is unique in the server
  const existing = await prisma.channel.findFirst({
    where: { serverId, name },
  });
 
  if (existing) {
    throw new HttpError(409, "Channel already exists in this server");
  }
 
//Create the channel in the db
  const channel = await prisma.channel.create({
    data: {
      serverId,
      name,
      createdBy: userId,
    },
  });
 
  return channel;
}


    //Get all channels for a server
 
export async function getServerChannelsService(serverId: string) {
//Check if the server exists
  const server = await prisma.server.findUnique({
    where: { id: serverId },
  });
 
  if (!server) {
    throw new HttpError(404, "Server not found");
  }
   
//Fetch channels ordered by creation date
  const channels = await prisma.channel.findMany({
    where: { serverId },
    orderBy: { createdAt: "asc" },
  });
 
  return channels;
}


    //Get channel details by id
    
export async function getChannelDetailsService(channelId: string) {

//Fetch channel from database
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
  });
  if (!channel) {
    throw new HttpError(404, "Channel not found");
  }

  return channel;
}