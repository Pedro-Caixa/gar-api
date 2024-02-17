import type { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import noblox from 'noblox.js';
import { getCardsInList, getCard } from "../../../functions/get-blacklists"

function readJSON(path: string): any {
  const info = fs.readFileSync(path, 'utf-8');
  return JSON.parse(info);
}
const garDivisions = readJSON('gar-information/divisions.json');
const divisionRanks = readJSON('gar-information/division-officers.json');

function checkOfficer(groupRank: number, divisions: any, userDivisionName: string): { isOfficer: boolean; isHICOM: boolean } {
  let isOfficer = false;
  let isHICOM = false;

  if (divisions.hasOwnProperty(userDivisionName)) {
    const divisionRanksForDivision = divisions[userDivisionName];

    for (const rankStr in divisionRanksForDivision) {
      const rankNumber = parseInt(rankStr, 10);

      if (groupRank >= rankNumber) {
        const rankRole = divisionRanksForDivision[rankStr];
        
        if (rankRole === "Officer") {
          isOfficer = true;
        } else if (rankRole === "HICOM") {
          isHICOM = true;
          break; 
        }
      }
    }
  }
  return { isOfficer, isHICOM };
}
type ResponseData = {
  username: string;
  isInGar: boolean;
  divisions: Record<string, { isOfficer: boolean; isHICOM: boolean; rank: number; }>;
  departments: Record<string, {rank: number; }>;
  blacklist?: string[]
};


let response: ResponseData | undefined;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {

  let isInGar = false;
  let blacklist = []
  let divisions: Record<string, { isOfficer: boolean; isHICOM: boolean; rank: number; }> = {};
  let departments = {}

  const userId = parseInt(req.query.id as string);
  const robloxUsername = await noblox.getUsernameFromId(userId);
  const groups = await noblox.getGroups(userId);


  for (const group of groups) {
    if (group.Id === 5214183) {
      isInGar = true;
      break;
    }
  }

  if (isInGar && garDivisions.divisions && typeof garDivisions.divisions === 'object') {  
    for (const divisionId in garDivisions.divisions) {
      if (garDivisions.divisions.hasOwnProperty(divisionId)) {
        const divisionName = garDivisions.divisions[divisionId];
        const group = groups.find(group => group.Id === parseInt(divisionId));
        if (group) {
          const { isOfficer, isHICOM } = checkOfficer(group.Rank, divisionRanks, divisionName);
          divisions[divisionName] = { isOfficer, isHICOM, rank: group.Rank };
        }
      }
    }
  }

  if (isInGar && garDivisions.departments && typeof garDivisions.departments === 'object') {
    for (const departmentId in garDivisions.departments) {
      if (garDivisions.departments.hasOwnProperty(departmentId)) {
        const departmentName = garDivisions.departments[departmentId];
        const group = groups.find(group => group.Id === parseInt(departmentId));
          if (group) {
            departments[departmentName] = {rank: group.Rank}
          }
    }
  }



  const foundCard = await getCard(robloxUsername);
  if (foundCard?.listName) {
    blacklist.push(foundCard.listName);
  }

  response = {
    username: robloxUsername,
    isInGar,
    divisions,
    departments,
    blacklist
  };

  if (response) {
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate')
    res.status(200).json(response);
  }
}
}